import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { user_id } = await req.json();

    console.log('🔄 Syncing calendar for user:', user_id);

    // 1. Obtener tokens de Google
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Google Calendar not connected');
    }

    // 2. Verificar si el token ha expirado y renovarlo si es necesario
    const now = new Date();
    const expiry = new Date(tokenData.token_expiry);

    let accessToken = tokenData.access_token;

    if (expiry <= now) {
      console.log('🔄 Refreshing expired token...');
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const newTokens = await refreshResponse.json();
      accessToken = newTokens.access_token;

      // Actualizar token en BD
      const newExpiry = new Date();
      newExpiry.setSeconds(newExpiry.getSeconds() + newTokens.expires_in);

      await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: accessToken,
          token_expiry: newExpiry.toISOString(),
        })
        .eq('user_id', user_id);
    }

    // 3. Obtener tareas programadas del usuario
    const { data: schedules, error: schedulesError } = await supabase
      .from('task_schedule')
      .select('*, tasks(title, description, area)')
      .eq('user_id', user_id)
      .eq('status', 'accepted') // Solo las aceptadas
      .gte('scheduled_date', new Date().toISOString().split('T')[0]); // Futuras

    if (schedulesError) throw schedulesError;

    console.log(`📅 Found ${schedules?.length || 0} scheduled tasks to sync`);

    // 4. Sincronizar cada tarea
    for (const schedule of schedules || []) {
      // Verificar si ya existe un evento
      const { data: existingMapping } = await supabase
        .from('calendar_event_mappings')
        .select('google_event_id')
        .eq('task_schedule_id', schedule.id)
        .eq('user_id', user_id)
        .maybeSingle();

      const eventStart = `${schedule.scheduled_date}T${schedule.scheduled_start}:00`;
      const eventEnd = `${schedule.scheduled_date}T${schedule.scheduled_end}:00`;

      const eventData = {
        summary: `📋 ${schedule.tasks.title}`,
        description: `${schedule.tasks.description || ''}\n\nÁrea: ${schedule.tasks.area || 'General'}`,
        start: {
          dateTime: eventStart,
          timeZone: 'Europe/Madrid',
        },
        end: {
          dateTime: eventEnd,
          timeZone: 'Europe/Madrid',
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

      if (existingMapping) {
        // Actualizar evento existente
        console.log('🔄 Updating event:', existingMapping.google_event_id);
        
        await fetch(
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
      } else {
        // Crear nuevo evento
        console.log('✨ Creating new event for:', schedule.tasks.title);
        
        const createResponse = await fetch(
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

        const createdEvent = await createResponse.json();

        // Guardar mapping
        await supabase.from('calendar_event_mappings').insert({
          task_schedule_id: schedule.id,
          user_id: user_id,
          google_event_id: createdEvent.id,
          calendar_id: tokenData.calendar_id,
        });
      }
    }

    console.log('✅ Calendar sync completed successfully');

    return new Response(
      JSON.stringify({ success: true, synced: schedules?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error syncing calendar:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
