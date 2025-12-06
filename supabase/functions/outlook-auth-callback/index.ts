import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID') || ''
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET') || ''
const APP_URL = Deno.env.get('APP_URL') || 'https://lovable.dev'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // Contains user_id
    const error = url.searchParams.get('error')

    if (error) {
      console.error('Outlook OAuth error:', error)
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${APP_URL}/settings/api-keys?outlook=error&message=${error}` },
      })
    }

    if (!code || !state) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${APP_URL}/settings/api-keys?outlook=error&message=missing_params` },
      })
    }

    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/outlook-auth-callback`

    // Exchange code for tokens
    const tokenResponse = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: 'offline_access Calendars.ReadWrite User.Read'
        })
      }
    )

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      console.error('Token error:', tokens.error_description || tokens.error)
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${APP_URL}/settings/api-keys?outlook=error&message=${tokens.error}` },
      })
    }

    // Get user info
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    })
    const userInfo = await userInfoResponse.json()

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000))

    // Store in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const userId = state

    const { error: dbError } = await supabase
      .from('outlook_accounts')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        email: userInfo.mail || userInfo.userPrincipalName,
        display_name: userInfo.displayName,
        sync_enabled: true
      }, {
        onConflict: 'user_id'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${APP_URL}/settings/api-keys?outlook=error&message=db_error` },
      })
    }

    return new Response(null, {
      status: 302,
      headers: { 'Location': `${APP_URL}/settings/api-keys?outlook=connected` },
    })

  } catch (error) {
    console.error('Outlook callback error:', error)
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${APP_URL}/settings/api-keys?outlook=error&message=unknown` },
    })
  }
})
