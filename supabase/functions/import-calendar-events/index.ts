import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, days_ahead = 14 } = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

    console.log(`📥 [IMPORT] Starting import for user: ${user_id}, days_ahead: ${days_ahead}`);

    // Get user's Google Calendar tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .maybeSingle();

    if (tokenError) {
      console.error('❌ [IMPORT] Error fetching token:', tokenError);
      throw new Error('Error fetching calendar token');
    }

    if (!tokenData) {
      console.log('⚠️ [IMPORT] No active Google Calendar connection');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Calendar not connected',
          code: 'NOT_CONNECTED'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const tokenExpiry = new Date(tokenData.token_expiry);

    // Refresh token if expired or expiring soon
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    if (tokenExpiry.getTime() - Date.now() < expiryBuffer) {
      console.log('🔄 [IMPORT] Token expiring soon, refreshing...');
      
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        throw new Error('Missing Google OAuth credentials');
      }

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        console.error('❌ [IMPORT] Token refresh failed:', errorData);
        
        // Mark token as inactive
        await supabase
          .from('google_calendar_tokens')
          .update({ is_active: false })
          .eq('user_id', user_id);
          
        throw new Error('Token refresh failed. Please reconnect Google Calendar.');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update token in database
      await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: accessToken,
          token_expiry: new Date(Date.now() + (refreshData.expires_in || 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id);

      console.log('✅ [IMPORT] Token refreshed successfully');
    }

    // Fetch events from Google Calendar
    const now = new Date();
    const futureDate = new Date(now.getTime() + days_ahead * 24 * 60 * 60 * 1000);

    const eventsUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${tokenData.calendar_id}/events`);
    eventsUrl.searchParams.set('timeMin', now.toISOString());
    eventsUrl.searchParams.set('timeMax', futureDate.toISOString());
    eventsUrl.searchParams.set('singleEvents', 'true');
    eventsUrl.searchParams.set('orderBy', 'startTime');
    eventsUrl.searchParams.set('maxResults', '100');

    console.log(`📅 [IMPORT] Fetching events from ${now.toISOString()} to ${futureDate.toISOString()}`);

    const eventsResponse = await fetch(eventsUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!eventsResponse.ok) {
      const errorData = await eventsResponse.json();
      console.error('❌ [IMPORT] Failed to fetch events:', errorData);
      throw new Error('Failed to fetch calendar events');
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.items || [];

    console.log(`📅 [IMPORT] Found ${events.length} events to import`);

    // Filter out all-day events and already synced events
    const { data: existingEvents } = await supabase
      .from('calendar_sync_events')
      .select('google_event_id')
      .eq('user_id', user_id);

    const existingEventIds = new Set((existingEvents || []).map(e => e.google_event_id));

    let importedCount = 0;
    let skippedCount = 0;
    const importedEvents: any[] = [];

    for (const event of events) {
      // Skip if already synced
      if (existingEventIds.has(event.id)) {
        skippedCount++;
        continue;
      }

      // Skip all-day events (they don't have dateTime)
      if (!event.start?.dateTime || !event.end?.dateTime) {
        console.log(`⏭️ [IMPORT] Skipping all-day event: ${event.summary}`);
        skippedCount++;
        continue;
      }

      // Skip events created by OPTIMUS-K
      if (event.description?.includes('Sincronizado desde OPTIMUS-K')) {
        skippedCount++;
        continue;
      }

      try {
        // Insert into calendar_sync_events
        const { data: syncEvent, error: insertError } = await supabase
          .from('calendar_sync_events')
          .insert({
            user_id,
            google_event_id: event.id,
            event_title: event.summary || 'Sin título',
            event_start: event.start.dateTime,
            event_end: event.end.dateTime,
            event_description: event.description,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error(`❌ [IMPORT] Error inserting event ${event.id}:`, insertError);
          continue;
        }

        importedEvents.push({
          id: syncEvent.id,
          title: event.summary,
          start: event.start.dateTime,
          end: event.end.dateTime,
        });

        importedCount++;
      } catch (eventError) {
        console.error(`❌ [IMPORT] Error processing event ${event.id}:`, eventError);
      }
    }

    console.log(`✅ [IMPORT] Import completed. Imported: ${importedCount}, Skipped: ${skippedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        imported_count: importedCount,
        skipped_count: skippedCount,
        total_found: events.length,
        events: importedEvents,
        message: `${importedCount} eventos importados de Google Calendar`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [IMPORT] Error importing events:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
