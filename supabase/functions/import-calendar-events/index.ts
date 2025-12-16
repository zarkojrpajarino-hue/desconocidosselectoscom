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

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

    console.log(`Importing calendar events for user: ${user_id}`);

    // Get user's Google Calendar tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .maybeSingle();

    if (tokenError || !tokenData) {
      throw new Error('Google Calendar not connected');
    }

    let accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const tokenExpiry = new Date(tokenData.token_expiry);

    // Refresh token if expired
    if (tokenExpiry < new Date()) {
      console.log('Token expired, refreshing...');
      
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update token in database
      await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: accessToken,
          token_expiry: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id);
    }

    // Fetch events from Google Calendar (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const calendarId = tokenData.calendar_id || 'primary';
    const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      new URLSearchParams({
        timeMin: now.toISOString(),
        timeMax: thirtyDaysFromNow.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100',
      });

    const eventsResponse = await fetch(eventsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error('Google Calendar API error:', errorText);
      throw new Error('Failed to fetch calendar events');
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.items || [];

    console.log(`Found ${events.length} events to import`);

    // Get user's organization
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (!userRole?.organization_id) {
      throw new Error('User has no organization');
    }

    let importedCount = 0;

    for (const event of events) {
      // Skip all-day events or events without proper times
      if (!event.start?.dateTime || !event.end?.dateTime) {
        continue;
      }

      // Check if this event is already mapped
      const { data: existingMapping } = await supabase
        .from('calendar_sync_events')
        .select('id')
        .eq('google_event_id', event.id)
        .eq('user_id', user_id)
        .maybeSingle();

      if (existingMapping) {
        console.log(`Event ${event.id} already imported, skipping`);
        continue;
      }

      // Create calendar_sync_event record
      const { error: syncError } = await supabase
        .from('calendar_sync_events')
        .insert({
          user_id,
          google_event_id: event.id,
          event_title: event.summary || 'Sin título',
          event_description: event.description || null,
          event_start: event.start.dateTime,
          event_end: event.end.dateTime,
          sync_status: 'imported',
          last_synced_at: new Date().toISOString(),
        });

      if (syncError) {
        console.error(`Error inserting sync event:`, syncError);
        continue;
      }

      importedCount++;
    }

    console.log(`Successfully imported ${importedCount} events`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported_count: importedCount,
        total_events: events.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error importing calendar events:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
