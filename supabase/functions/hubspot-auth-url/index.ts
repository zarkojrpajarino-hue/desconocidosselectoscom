import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { withRateLimit, rateLimitResponse } from '../_shared/rateLimiter.ts';
import { generateOAuthState } from '../_shared/oauth-csrf.ts';

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

    // Rate limiting: 10 requests per minute per organization
    const rateLimitResult = withRateLimit(organization_id, 'hubspot-auth-url', { maxRequests: 10, windowMs: 60000 });
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult, corsHeaders);
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

    // Generate secure CSRF-protected state token
    const state = await generateOAuthState(organization_id)
    console.log('🔐 Generated secure HubSpot state token for org:', organization_id)

    const authUrl = `https://app.hubspot.com/oauth/authorize?` +
      `client_id=${HUBSPOT_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${encodeURIComponent(state)}`

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
