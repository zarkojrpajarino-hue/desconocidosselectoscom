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
    const { code, user_id } = await req.json();

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
    const REDIRECT_URI = `${req.headers.get('origin')}/auth/google/callback`;

    console.log('🔄 Processing OAuth callback for user:', user_id);

    // Intercambiar código por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }

    console.log('✅ Got access token');

    // Obtener info del calendario principal
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList/primary',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    const calendarData = await calendarResponse.json();

    console.log('📅 Got calendar ID:', calendarData.id);

    // Guardar tokens en la BD
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokens.expires_in);

    const { error } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokenExpiry.toISOString(),
        calendar_id: calendarData.id,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) throw error;

    console.log('✅ Google Calendar connected for user:', user_id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error in callback:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
