import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Retry helper for Google API calls
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Si es rate limit (429) o error temporal (5xx), reintentar
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        console.log(`⏳ Rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Fetch attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { user_id, task_id, timezone = 'Europe/Madrid' } = body;

    if (!user_id && !task_id) {
      throw new Error('user_id or task_id is required');
    }

    const targetUserId = user_id || (await getUserIdFromTask(supabase, task_id));
    
    console.log('🔄 [SYNC] Starting calendar sync for user:', targetUserId);
    console.log('🔄 [SYNC] Timezone:', timezone);

    // 1. Obtener tokens de Google (usando maybeSingle para evitar errores)
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .maybeSingle();

    if (tokenError) {
      console.error('❌ [SYNC] Error fetching token:', tokenError);
      throw new Error('Error fetching calendar token');
    }

    if (!tokenData) {
      console.log('⚠️ [SYNC] No active Google Calendar connection found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Calendar not connected',
          code: 'NOT_CONNECTED'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verificar y renovar token si es necesario
    let accessToken = tokenData.access_token;
    const now = new Date();
    const expiry = new Date(tokenData.token_expiry);
    
    // Renovar si expira en menos de 5 minutos
    const expiryBuffer = 5 * 60 * 1000; // 5 minutos
    
    if (expiry.getTime() - now.getTime() < expiryBuffer) {
      console.log('🔄 [SYNC] Token expiring soon, refreshing...');
      
      const refreshResult = await refreshAccessToken(
        supabase,
        targetUserId,
        tokenData.refresh_token
      );
      
      if (!refreshResult.success) {
        console.error('❌ [SYNC] Token refresh failed:', refreshResult.error);
        
        // Marcar token como inactivo
        await supabase
          .from('google_calendar_tokens')
          .update({ is_active: false })
          .eq('user_id', targetUserId);
          
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token refresh failed. Please reconnect Google Calendar.',
            code: 'TOKEN_REFRESH_FAILED'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      accessToken = refreshResult.accessToken;
      console.log('✅ [SYNC] Token refreshed successfully');
    }

    // 3. Obtener tareas programadas del usuario
    let schedulesQuery = supabase
      .from('task_schedule')
      .select('*, tasks(id, title, description, area)')
      .eq('user_id', targetUserId)
      .eq('status', 'accepted')
      .gte('scheduled_date', new Date().toISOString().split('T')[0]);
    
    // Si se especificó task_id, filtrar solo esa tarea
    if (task_id) {
      schedulesQuery = schedulesQuery.eq('task_id', task_id);
    }
    
    const { data: schedules, error: schedulesError } = await schedulesQuery;

    if (schedulesError) {
      console.error('❌ [SYNC] Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    console.log(`📅 [SYNC] Found ${schedules?.length || 0} scheduled tasks to sync`);

    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // 4. Sincronizar cada tarea
    for (const schedule of schedules || []) {
      try {
        // Verificar si ya existe un evento
        const { data: existingMapping } = await supabase
          .from('calendar_event_mappings')
          .select('google_event_id')
          .eq('task_schedule_id', schedule.id)
          .eq('user_id', targetUserId)
          .maybeSingle();

        const eventStart = `${schedule.scheduled_date}T${schedule.scheduled_start}:00`;
        const eventEnd = `${schedule.scheduled_date}T${schedule.scheduled_end}:00`;

        const eventData = {
          summary: `📋 ${schedule.tasks?.title || 'Tarea sin título'}`,
          description: `${schedule.tasks?.description || ''}\n\nÁrea: ${schedule.tasks?.area || 'General'}\n\n---\nSincronizado desde OPTIMUS-K`,
          start: {
            dateTime: eventStart,
            timeZone: timezone,
          },
          end: {
            dateTime: eventEnd,
            timeZone: timezone,
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
              { method: 'popup', minutes: 10 },
            ],
          },
          colorId: '9', // Color azul para tareas
        };

        if (existingMapping?.google_event_id) {
          // Actualizar evento existente
          console.log(`🔄 [SYNC] Updating event: ${existingMapping.google_event_id}`);
          
          const updateResponse = await fetchWithRetry(
            `https://www.googleapis.com/calendar/v3/calendars/${tokenData.calendar_id}/events/${existingMapping.google_event_id}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventData),
            }
          );
          
          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`Failed to update event: ${errorData.error?.message || updateResponse.status}`);
          }
          
          syncedCount++;
        } else {
          // Crear nuevo evento
          console.log(`✨ [SYNC] Creating new event for: ${schedule.tasks?.title}`);
          
          const createResponse = await fetchWithRetry(
            `https://www.googleapis.com/calendar/v3/calendars/${tokenData.calendar_id}/events`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventData),
            }
          );

          if (!createResponse.ok) {
            const errorData = await createResponse.json();
            throw new Error(`Failed to create event: ${errorData.error?.message || createResponse.status}`);
          }

          const createdEvent = await createResponse.json();

          // Guardar mapping
          await supabase.from('calendar_event_mappings').insert({
            task_schedule_id: schedule.id,
            user_id: targetUserId,
            google_event_id: createdEvent.id,
            calendar_id: tokenData.calendar_id,
          });
          
          // También guardar en calendar_sync_events para tracking
          await supabase.from('calendar_sync_events').upsert({
            user_id: targetUserId,
            task_id: schedule.tasks?.id,
            google_event_id: createdEvent.id,
            event_title: schedule.tasks?.title || 'Tarea',
            event_start: eventStart,
            event_end: eventEnd,
            event_description: schedule.tasks?.description,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
          }, { onConflict: 'google_event_id' });
          
          syncedCount++;
        }
      } catch (taskError) {
        errorCount++;
        const errorMessage = taskError instanceof Error ? taskError.message : 'Unknown error';
        errors.push(`Task ${schedule.id}: ${errorMessage}`);
        console.error(`❌ [SYNC] Error syncing task ${schedule.id}:`, taskError);
      }
    }

    console.log(`✅ [SYNC] Calendar sync completed. Synced: ${syncedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors : undefined,
        message: `${syncedCount} eventos sincronizados${errorCount > 0 ? `, ${errorCount} errores` : ''}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ [SYNC] Error syncing calendar:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: Get user_id from task_id
async function getUserIdFromTask(supabase: any, taskId: string): Promise<string> {
  const { data, error } = await supabase
    .from('task_schedule')
    .select('user_id')
    .eq('task_id', taskId)
    .limit(1)
    .maybeSingle();
    
  if (error || !data) {
    throw new Error('Task not found or user not assigned');
  }
  
  return data.user_id;
}

// Helper: Refresh access token
async function refreshAccessToken(
  supabase: any,
  userId: string,
  refreshToken: string
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  try {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      return { success: false, error: 'Missing Google OAuth credentials' };
    }
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [REFRESH] Token refresh failed:', errorData);
      return { 
        success: false, 
        error: errorData.error_description || errorData.error || 'Token refresh failed'
      };
    }

    const tokens = await response.json();
    
    if (!tokens.access_token) {
      return { success: false, error: 'No access token in response' };
    }

    // Actualizar token en BD
    const newExpiry = new Date();
    newExpiry.setSeconds(newExpiry.getSeconds() + (tokens.expires_in || 3600));

    const { error: updateError } = await supabase
      .from('google_calendar_tokens')
      .update({
        access_token: tokens.access_token,
        token_expiry: newExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ [REFRESH] Error updating token in DB:', updateError);
    }

    return { success: true, accessToken: tokens.access_token };
  } catch (error) {
    console.error('❌ [REFRESH] Exception during token refresh:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
