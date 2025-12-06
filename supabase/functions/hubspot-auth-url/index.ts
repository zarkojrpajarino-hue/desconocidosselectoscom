import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const HUBSPOT_CLIENT_ID = Deno.env.get('HUBSPOT_CLIENT_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization_id } = await req.json()

    if (!organization_id) {
      throw new Error('Missing organization_id')
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/hubspot-auth-callback`

    const scopes = [
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.deals.read',
      'crm.objects.deals.write',
      'crm.schemas.contacts.read',
      'crm.schemas.deals.read'
    ].join(' ')

    const authUrl = `https://app.hubspot.com/oauth/authorize?` +
      `client_id=${HUBSPOT_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${organization_id}`

    console.log('[hubspot-auth-url] Generated auth URL for org:', organization_id)

    return new Response(
      JSON.stringify({ auth_url: authUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[hubspot-auth-url] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
