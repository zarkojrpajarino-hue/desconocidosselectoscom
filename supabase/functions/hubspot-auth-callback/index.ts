import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const HUBSPOT_CLIENT_ID = Deno.env.get('HUBSPOT_CLIENT_ID')!
const HUBSPOT_CLIENT_SECRET = Deno.env.get('HUBSPOT_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const APP_URL = Deno.env.get('APP_URL') || 'https://nrsrzfqtzjrxrvqyypdn.lovableproject.com'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // organization_id

    if (!code || !state) {
      throw new Error('Missing code or state')
    }

    console.log('[hubspot-auth-callback] Processing callback for org:', state)

    const redirectUri = `${SUPABASE_URL}/functions/v1/hubspot-auth-callback`

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: HUBSPOT_CLIENT_ID,
        client_secret: HUBSPOT_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code
      })
    })

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      console.error('[hubspot-auth-callback] Token error:', tokens)
      throw new Error(tokens.message || tokens.error)
    }

    // Get account info
    const accountInfoResponse = await fetch(
      'https://api.hubapi.com/account-info/v3/details',
      {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      }
    )
    const accountInfo = await accountInfoResponse.json()

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000))

    // Store in database
    const supabase = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: dbError } = await supabase
      .from('hubspot_accounts')
      .upsert({
        organization_id: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        portal_id: accountInfo.portalId.toString(),
        hub_domain: accountInfo.hubDomain || accountInfo.portalId.toString(),
        sync_enabled: true
      }, {
        onConflict: 'organization_id'
      })

    if (dbError) {
      console.error('[hubspot-auth-callback] DB error:', dbError)
      throw dbError
    }

    console.log('[hubspot-auth-callback] HubSpot connected for portal:', accountInfo.portalId)

    // Redirect back to app
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${APP_URL}/settings/api-keys?hubspot=connected`
      }
    })

  } catch (error) {
    console.error('[hubspot-auth-callback] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${APP_URL}/settings/api-keys?hubspot=error&message=${encodeURIComponent(errorMessage)}`
      }
    })
  }
})
