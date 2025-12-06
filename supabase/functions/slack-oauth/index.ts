import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SLACK_CLIENT_ID = Deno.env.get('SLACK_CLIENT_ID') || ''
const SLACK_CLIENT_SECRET = Deno.env.get('SLACK_CLIENT_SECRET') || ''
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
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    
    // Generate OAuth URL
    if (action === 'authorize') {
      const organizationId = url.searchParams.get('organization_id')
      if (!organizationId) {
        return new Response(
          JSON.stringify({ error: 'organization_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/slack-oauth?action=callback`
      const scopes = 'chat:write,channels:read,groups:read,team:read'
      
      const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${organizationId}`
      
      return new Response(
        JSON.stringify({ auth_url: authUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle OAuth callback
    if (action === 'callback') {
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state') // Contains organization_id
      const error = url.searchParams.get('error')

      if (error) {
        return new Response(null, {
          status: 302,
          headers: { 'Location': `${APP_URL}/settings/api-keys?slack=error&message=${error}` },
        })
      }

      if (!code || !state) {
        return new Response(null, {
          status: 302,
          headers: { 'Location': `${APP_URL}/settings/api-keys?slack=error&message=missing_params` },
        })
      }

      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/slack-oauth?action=callback`

      // Exchange code for access token
      const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: SLACK_CLIENT_ID,
          client_secret: SLACK_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      })

      const tokenData = await tokenResponse.json()

      if (!tokenData.ok) {
        console.error('Slack OAuth error:', tokenData.error)
        return new Response(null, {
          status: 302,
          headers: { 'Location': `${APP_URL}/settings/api-keys?slack=error&message=${tokenData.error}` },
        })
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const organizationId = state

      // Get channels list
      const channelsResponse = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      })
      const channelsData = await channelsResponse.json()

      // Upsert Slack workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('slack_workspaces')
        .upsert({
          organization_id: organizationId,
          team_id: tokenData.team.id,
          team_name: tokenData.team.name,
          access_token: tokenData.access_token,
          bot_user_id: tokenData.bot_user_id,
          scope: tokenData.scope,
          enabled: true,
        }, { onConflict: 'organization_id' })
        .select()
        .single()

      if (workspaceError) {
        console.error('Error saving workspace:', workspaceError)
        return new Response(null, {
          status: 302,
          headers: { 'Location': `${APP_URL}/settings/api-keys?slack=error&message=db_error` },
        })
      }

      // Store channels
      if (channelsData.ok && channelsData.channels) {
        const channels = channelsData.channels.map((channel: { id: string; name: string; is_private?: boolean; is_archived?: boolean }) => ({
          slack_workspace_id: workspace.id,
          channel_id: channel.id,
          channel_name: channel.name,
          is_private: channel.is_private || false,
          is_archived: channel.is_archived || false,
        }))

        await supabase
          .from('slack_channels')
          .upsert(channels, { onConflict: 'slack_workspace_id,channel_id' })

        // Create default event mappings
        const defaultMappings = [
          { event_type: 'lead.created', default_channel: 'sales' },
          { event_type: 'lead.won', default_channel: 'sales' },
          { event_type: 'task.completed', default_channel: 'general' },
          { event_type: 'okr.at_risk', default_channel: 'general' },
        ]

        for (const mapping of defaultMappings) {
          const channel = channelsData.channels?.find((c: { name: string }) => 
            c.name.toLowerCase().includes(mapping.default_channel) || c.name === 'general'
          ) || channelsData.channels[0]
          
          if (channel) {
            await supabase
              .from('slack_event_mappings')
              .upsert({
                slack_workspace_id: workspace.id,
                event_type: mapping.event_type,
                channel_id: channel.id,
                channel_name: channel.name,
                enabled: true,
              }, { onConflict: 'slack_workspace_id,event_type' })
          }
        }
      }

      return new Response(null, {
        status: 302,
        headers: { 'Location': `${APP_URL}/settings/api-keys?slack=connected` },
      })
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Slack OAuth error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
