import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SlackEventData {
  id?: string
  name?: string
  email?: string
  phone?: string
  company?: string
  value?: number
  title?: string
  progress?: number
  full_name?: string
  threshold?: number
  [key: string]: unknown
}

interface SlackBlockElement {
  type: string
  text?: { type: string; text: string } | string
  url?: string
  style?: string
}

interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
  }
  elements?: SlackBlockElement[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization_id, event_type, data } = await req.json() as {
      organization_id: string
      event_type: string
      data: SlackEventData
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Slack workspace and event mapping
    const { data: workspace } = await supabase
      .from('slack_workspaces')
      .select(`
        *,
        slack_event_mappings!inner (
          channel_id,
          channel_name,
          enabled,
          template,
          mention_users
        )
      `)
      .eq('organization_id', organization_id)
      .eq('enabled', true)
      .eq('slack_event_mappings.event_type', event_type)
      .eq('slack_event_mappings.enabled', true)
      .single()

    if (!workspace) {
      return new Response(JSON.stringify({ 
        message: 'No Slack workspace configured for this event' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const mapping = workspace.slack_event_mappings[0]

    // Build message based on event type
    let message = buildSlackMessage(event_type, data)
    
    // Use custom template if provided
    if (mapping.template) {
      message = interpolateTemplate(mapping.template, data)
    }

    // Build Slack message blocks
    const blocks = buildSlackBlocks(event_type, data, message)

    // Send to Slack
    const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${workspace.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: mapping.channel_id,
        text: message,
        blocks,
        unfurl_links: false,
        unfurl_media: false,
      }),
    })

    const slackData = await slackResponse.json()

    // Log message
    await supabase.from('slack_messages').insert({
      slack_workspace_id: workspace.id,
      event_type,
      channel_id: mapping.channel_id,
      message_text: message,
      message_blocks: blocks,
      slack_timestamp: slackData.ts,
      status: slackData.ok ? 'sent' : 'failed',
      error_message: slackData.error,
    })

    // Update workspace stats
    if (slackData.ok) {
      await supabase
        .from('slack_workspaces')
        .update({
          total_messages_sent: (workspace.total_messages_sent || 0) + 1,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', workspace.id)
    }

    return new Response(
      JSON.stringify({ success: slackData.ok, ts: slackData.ts }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Slack notify error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildSlackMessage(eventType: string, data: SlackEventData): string {
  const messages: Record<string, (d: SlackEventData) => string> = {
    'lead.created': (d) => `🎯 Nuevo lead: *${d.name}* de ${d.company || 'sin empresa'}`,
    'lead.won': (d) => `🎉 Lead ganado: *${d.name}* - €${d.value || 0}`,
    'lead.updated': (d) => `📝 Lead actualizado: *${d.name}*`,
    'task.created': (d) => `📋 Nueva tarea: ${d.title}`,
    'task.completed': (d) => `✅ Tarea completada: ${d.title}`,
    'okr.at_risk': (d) => `⚠️ OKR en riesgo: ${d.title} (${d.progress}%)`,
    'okr.completed': (d) => `🎯 OKR completado: ${d.title}`,
    'metric.threshold': (d) => `📊 Métrica ${d.name}: ${data.value} (umbral: ${d.threshold})`,
    'user.joined': (d) => `👋 Nuevo usuario: ${d.full_name}`,
  }

  const messageBuilder = messages[eventType]
  return messageBuilder ? messageBuilder(data) : `📌 Evento: ${eventType}`
}

function buildSlackBlocks(eventType: string, data: SlackEventData, message: string): SlackBlock[] {
  const appUrl = Deno.env.get('APP_URL') || 'https://lovable.dev'
  
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message,
      },
    },
  ]

  // Add context based on event type
  if ((eventType === 'lead.created' || eventType === 'lead.updated') && data.email) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: {
            type: 'mrkdwn',
            text: `📧 ${data.email}${data.phone ? ` | 📞 ${data.phone}` : ''}`
          },
        },
      ],
    })
  }

  // Add action button to view in app
  const viewUrl = getViewUrl(eventType, data)
  if (viewUrl) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Ver en OPTIMUS-K',
          },
          url: `${appUrl}${viewUrl}`,
          style: 'primary',
        },
      ],
    })
  }

  return blocks
}

function getViewUrl(eventType: string, data: SlackEventData): string | null {
  const urls: Record<string, (d: SlackEventData) => string> = {
    'lead.created': (d) => `/crm?lead=${d.id}`,
    'lead.updated': (d) => `/crm?lead=${d.id}`,
    'lead.won': (d) => `/crm?lead=${d.id}`,
    'task.created': () => `/home`,
    'task.completed': () => `/home`,
    'okr.at_risk': (d) => `/okrs?okr=${d.id}`,
    'okr.completed': (d) => `/okrs?okr=${d.id}`,
    'metric.threshold': () => `/business-metrics`,
  }

  const urlBuilder = urls[eventType]
  return urlBuilder ? urlBuilder(data) : null
}

function interpolateTemplate(template: string, data: SlackEventData): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = data[key]
    return value !== undefined ? String(value) : match
  })
}
