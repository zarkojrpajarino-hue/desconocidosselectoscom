import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    if (!code || !user_id) {
      throw new Error('Missing required parameters: code and user_id');
    }

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Missing Google OAuth configuration');
    }
    
    const REDIRECT_URI = `${req.headers.get('origin')}/auth/google/callback`;

    console.log('🔄 [CALLBACK] Processing OAuth callback for user:', user_id);
    console.log('🔄 [CALLBACK] Redirect URI:', REDIRECT_URI);

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

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('❌ [CALLBACK] Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error || 'Unknown error'}`);
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error('❌ [CALLBACK] No access token in response:', tokens);
      throw new Error('Failed to get access token from Google');
    }

    console.log('✅ [CALLBACK] Got access token');
    console.log('📋 [CALLBACK] Has refresh_token:', !!tokens.refresh_token);

    // Obtener info del calendario principal
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList/primary',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json();
      console.error('❌ [CALLBACK] Failed to get calendar info:', errorData);
      throw new Error('Failed to get calendar information');
    }

    const calendarData = await calendarResponse.json();

    console.log('📅 [CALLBACK] Got calendar ID:', calendarData.id);

    // Verificar si ya existe un token para este usuario
    const { data: existingToken } = await supabase
      .from('google_calendar_tokens')
      .select('refresh_token')
      .eq('user_id', user_id)
      .maybeSingle();

    // Guardar tokens en la BD
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + (tokens.expires_in || 3600));

    // Usar el refresh_token existente si Google no devuelve uno nuevo
    // (Google solo devuelve refresh_token en la primera autorización o con prompt=consent)
    const refreshTokenToSave = tokens.refresh_token || existingToken?.refresh_token;

    if (!refreshTokenToSave) {
      console.error('❌ [CALLBACK] No refresh token available');
      throw new Error('No refresh token available. Please try disconnecting and reconnecting Google Calendar.');
    }

    const { error } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id,
        access_token: tokens.access_token,
        refresh_token: refreshTokenToSave,
        token_expiry: tokenExpiry.toISOString(),
        calendar_id: calendarData.id,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('❌ [CALLBACK] Error saving token:', error);
      throw error;
    }

    console.log('✅ [CALLBACK] Google Calendar connected successfully for user:', user_id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Google Calendar connected successfully',
        calendar_id: calendarData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ [CALLBACK] Error in callback:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
