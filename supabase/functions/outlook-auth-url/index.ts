import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID') || ''
const APP_URL = Deno.env.get('APP_URL') || 'https://lovable.dev'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/outlook-auth-callback`
    
    const scopes = [
      'offline_access',
      'Calendars.ReadWrite',
      'User.Read'
    ].join(' ')

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${MICROSOFT_CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${user_id}` +
      `&response_mode=query`

    return new Response(
      JSON.stringify({ auth_url: authUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Outlook auth URL error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
