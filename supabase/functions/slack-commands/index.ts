import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SLACK_SIGNING_SECRET = Deno.env.get('SLACK_SIGNING_SECRET') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-slack-signature, x-slack-request-timestamp',
}

interface SlackCommandPayload {
  token: string
  team_id: string
  team_domain: string
  channel_id: string
  channel_name: string
  user_id: string
  user_name: string
  command: string
  text: string
  response_url: string
  trigger_id: string
}

// deno-lint-ignore no-explicit-any
type SupabaseClientAny = SupabaseClient<any, any, any>

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify Slack signature
    const timestamp = req.headers.get('x-slack-request-timestamp')
    const signature = req.headers.get('x-slack-signature')
    
    if (!timestamp || !signature) {
      console.error('Missing Slack headers')
      return new Response(JSON.stringify({ error: 'Missing Slack headers' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Prevent replay attacks (5 min window)
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - parseInt(timestamp)) > 300) {
      console.error('Request too old')
      return new Response(JSON.stringify({ error: 'Request too old' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get raw body for signature verification
    const rawBody = await req.text()
    
    // Verify signature using Web Crypto API
    const sigBasestring = `v0:${timestamp}:${rawBody}`
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SLACK_SIGNING_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(sigBasestring))
    const computedSignature = `v0=${Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, '0')).join('')}`
    
    if (computedSignature !== signature) {
      console.error('Invalid signature')
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse form data
    const params = new URLSearchParams(rawBody)
    const payload: SlackCommandPayload = {
      token: params.get('token') || '',
      team_id: params.get('team_id') || '',
      team_domain: params.get('team_domain') || '',
      channel_id: params.get('channel_id') || '',
      channel_name: params.get('channel_name') || '',
      user_id: params.get('user_id') || '',
      user_name: params.get('user_name') || '',
      command: params.get('command') || '',
      text: params.get('text') || '',
      response_url: params.get('response_url') || '',
      trigger_id: params.get('trigger_id') || '',
    }

    console.log(`Received command: ${payload.command} ${payload.text} from ${payload.user_name}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get organization from team_id
    const { data: workspace, error: workspaceError } = await supabase
      .from('slack_workspaces')
      .select('organization_id')
      .eq('team_id', payload.team_id)
      .single()

    if (workspaceError || !workspace) {
      return slackResponse('❌ Tu workspace de Slack no está conectado a OPTIMUS-K. Conecta desde Configuración > Integraciones.')
    }

    const organizationId = workspace.organization_id

    // Route commands
    switch (payload.command) {
      case '/leads':
        return await handleLeadsCommand(supabase, organizationId, payload.text)
      
      case '/tasks':
        return await handleTasksCommand(supabase, organizationId, payload.text)
      
      case '/sync':
        return await handleSyncCommand(supabase, organizationId, payload.text)
      
      case '/okrs':
        return await handleOKRsCommand(supabase, organizationId)
      
      case '/metrics':
        return await handleMetricsCommand(supabase, organizationId)
      
      case '/team':
        return await handleTeamCommand(supabase, organizationId, payload.text)
      
      case '/report':
        return await handleReportCommand(supabase, organizationId, payload.text)
      
      case '/optimusk':
      case '/ok':
        return await handleHelpCommand()
      
      default:
        return slackResponse(`❓ Comando no reconocido: ${payload.command}\nUsa /optimusk para ver los comandos disponibles.`)
    }

  } catch (error) {
    console.error('Slack command error:', error)
    return slackResponse(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
})

// Helper to create Slack response
function slackResponse(text: string, blocks?: unknown[]): Response {
  const body: { response_type: string; text: string; blocks?: unknown[] } = {
    response_type: 'ephemeral',
    text,
  }
  if (blocks) {
    body.blocks = blocks
  }
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// /leads command handler
async function handleLeadsCommand(
  supabase: SupabaseClientAny,
  organizationId: string,
  text: string
): Promise<Response> {
  const args = text.trim().toLowerCase().split(/\s+/)
  const subcommand = args[0] || 'list'

  switch (subcommand) {
    case 'list':
    case '': {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('name, company, stage, estimated_value, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        return slackResponse('❌ Error obteniendo leads')
      }

      if (!leads || leads.length === 0) {
        return slackResponse('📭 No hay leads registrados')
      }

      const blocks = [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🎯 Últimos 10 Leads' }
        },
        { type: 'divider' },
        ...leads.map((lead: { name: string; company?: string; stage?: string; estimated_value?: number }) => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${lead.name}*${lead.company ? ` - ${lead.company}` : ''}\n📊 ${lead.stage || 'Nuevo'} | 💰 €${lead.estimated_value || 0}`
          }
        }))
      ]

      return slackResponse(`📊 ${leads.length} leads encontrados`, blocks)
    }

    case 'hot': {
      const { data: hotLeads } = await supabase
        .from('leads')
        .select('name, company, stage, estimated_value, probability')
        .eq('organization_id', organizationId)
        .in('stage', ['negotiation', 'closing', 'proposal'])
        .order('estimated_value', { ascending: false })
        .limit(5)

      if (!hotLeads || hotLeads.length === 0) {
        return slackResponse('🔥 No hay leads calientes en este momento')
      }

      const blocks = [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🔥 Leads Calientes (Top 5)' }
        },
        { type: 'divider' },
        ...hotLeads.map((lead: { name: string; estimated_value?: number; stage?: string; probability?: number }, i: number) => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${i + 1}. *${lead.name}* - €${lead.estimated_value || 0}\n📊 ${lead.stage} | 🎯 ${lead.probability || 0}% probabilidad`
          }
        }))
      ]

      return slackResponse(`🔥 ${hotLeads.length} leads calientes`, blocks)
    }

    case 'stats': {
      const { data: stats } = await supabase
        .from('leads')
        .select('stage, estimated_value')
        .eq('organization_id', organizationId)

      if (!stats || stats.length === 0) {
        return slackResponse('📊 No hay estadísticas disponibles')
      }

      const totalLeads = stats.length
      const totalValue = stats.reduce((sum: number, l: { estimated_value?: number }) => sum + (l.estimated_value || 0), 0)
      const byStage = stats.reduce((acc: Record<string, number>, l: { stage?: string }) => {
        acc[l.stage || 'nuevo'] = (acc[l.stage || 'nuevo'] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const stageText = Object.entries(byStage)
        .map(([stage, count]) => `• ${stage}: ${count}`)
        .join('\n')

      return slackResponse(
        `📊 *Estadísticas de Leads*\n\n` +
        `📈 Total: ${totalLeads} leads\n` +
        `💰 Valor pipeline: €${totalValue.toLocaleString()}\n\n` +
        `*Por etapa:*\n${stageText}`
      )
    }

    default:
      return slackResponse(
        `📋 *Comandos /leads disponibles:*\n` +
        `• \`/leads\` o \`/leads list\` - Lista últimos 10 leads\n` +
        `• \`/leads hot\` - Leads calientes (negociación/cierre)\n` +
        `• \`/leads stats\` - Estadísticas del pipeline`
      )
  }
}

// /tasks command handler
async function handleTasksCommand(
  supabase: SupabaseClientAny,
  organizationId: string,
  text: string
): Promise<Response> {
  const args = text.trim().toLowerCase().split(/\s+/)
  const subcommand = args[0] || 'today'

  switch (subcommand) {
    case 'today':
    case '': {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: tasks } = await supabase
        .from('task_schedule')
        .select(`
          id,
          start_time,
          end_time,
          status,
          tasks:task_id (title, priority)
        `)
        .eq('organization_id', organizationId)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`)
        .order('start_time')
        .limit(15)

      if (!tasks || tasks.length === 0) {
        return slackResponse('📭 No hay tareas programadas para hoy')
      }

      const blocks = [
        {
          type: 'header',
          text: { type: 'plain_text', text: `📅 Tareas de Hoy (${tasks.length})` }
        },
        { type: 'divider' },
        // deno-lint-ignore no-explicit-any
        ...tasks.map((t: any) => {
          const taskData = Array.isArray(t.tasks) ? t.tasks[0] : t.tasks
          const time = new Date(t.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          const statusEmoji = t.status === 'completed' ? '✅' : t.status === 'in_progress' ? '🔄' : '⬜'
          return {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${statusEmoji} *${time}* - ${taskData?.title || 'Sin título'}`
            }
          }
        })
      ]

      return slackResponse(`📅 ${tasks.length} tareas para hoy`, blocks)
    }

    case 'pending': {
      const { data: pendingTasks } = await supabase
        .from('task_schedule')
        .select(`
          id,
          start_time,
          tasks:task_id (title, priority)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('start_time')
        .limit(10)

      if (!pendingTasks || pendingTasks.length === 0) {
        return slackResponse('✅ ¡No hay tareas pendientes!')
      }

      const blocks = [
        {
          type: 'header',
          text: { type: 'plain_text', text: '⏳ Tareas Pendientes' }
        },
        { type: 'divider' },
        // deno-lint-ignore no-explicit-any
        ...pendingTasks.map((t: any) => {
          const taskData = Array.isArray(t.tasks) ? t.tasks[0] : t.tasks
          const date = new Date(t.start_time).toLocaleDateString('es-ES')
          return {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `⬜ *${taskData?.title || 'Sin título'}*\n📅 ${date}`
            }
          }
        })
      ]

      return slackResponse(`⏳ ${pendingTasks.length} tareas pendientes`, blocks)
    }

    case 'week': {
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + 1)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const { data: weekTasks } = await supabase
        .from('task_schedule')
        .select('status')
        .eq('organization_id', organizationId)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())

      if (!weekTasks) {
        return slackResponse('❌ Error obteniendo tareas de la semana')
      }

      const total = weekTasks.length
      const completed = weekTasks.filter((t: { status?: string }) => t.status === 'completed').length
      const pending = weekTasks.filter((t: { status?: string }) => t.status === 'pending').length
      const inProgress = weekTasks.filter((t: { status?: string }) => t.status === 'in_progress').length
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

      return slackResponse(
        `📊 *Resumen Semanal*\n\n` +
        `📈 Completadas: ${completed}/${total} (${completionRate}%)\n` +
        `🔄 En progreso: ${inProgress}\n` +
        `⏳ Pendientes: ${pending}`
      )
    }

    default:
      return slackResponse(
        `📋 *Comandos /tasks disponibles:*\n` +
        `• \`/tasks\` o \`/tasks today\` - Tareas de hoy\n` +
        `• \`/tasks pending\` - Tareas pendientes\n` +
        `• \`/tasks week\` - Resumen semanal`
      )
  }
}

// /sync command handler
async function handleSyncCommand(
  supabase: SupabaseClientAny,
  organizationId: string,
  text: string
): Promise<Response> {
  const args = text.trim().toLowerCase().split(/\s+/)
  const target = args[0] || 'status'

  switch (target) {
    case 'status': {
      const [hubspot, asana, trello, calendar, outlook] = await Promise.all([
        supabase.from('hubspot_accounts').select('sync_enabled, last_sync_at').eq('organization_id', organizationId).single(),
        supabase.from('asana_accounts').select('sync_enabled, last_sync_at').eq('organization_id', organizationId).single(),
        supabase.from('trello_accounts').select('sync_enabled, last_sync_at').eq('organization_id', organizationId).single(),
        supabase.from('google_calendar_tokens').select('is_active, updated_at').eq('organization_id', organizationId).limit(1).single(),
        supabase.from('outlook_accounts').select('sync_enabled, last_sync_at').eq('organization_id', organizationId).single(),
      ])

      const formatStatus = (result: { data?: { sync_enabled?: boolean; is_active?: boolean; last_sync_at?: string; updated_at?: string } | null }) => {
        if (!result.data) return '❌ No conectado'
        const enabled = result.data.sync_enabled ?? result.data.is_active
        const lastSync = result.data.last_sync_at ?? result.data.updated_at
        if (!enabled) return '⏸️ Desactivado'
        if (lastSync) {
          const ago = Math.round((Date.now() - new Date(lastSync).getTime()) / 60000)
          return `✅ Activo (hace ${ago} min)`
        }
        return '✅ Activo'
      }

      return slackResponse(
        `🔄 *Estado de Sincronización*\n\n` +
        `*HubSpot:* ${formatStatus(hubspot)}\n` +
        `*Asana:* ${formatStatus(asana)}\n` +
        `*Trello:* ${formatStatus(trello)}\n` +
        `*Google Calendar:* ${formatStatus(calendar)}\n` +
        `*Outlook:* ${formatStatus(outlook)}`
      )
    }

    case 'hubspot': {
      const { data: hubspotAccount } = await supabase
        .from('hubspot_accounts')
        .select('id, sync_enabled')
        .eq('organization_id', organizationId)
        .single()

      if (!hubspotAccount) {
        return slackResponse('❌ HubSpot no está conectado')
      }
      if (!hubspotAccount.sync_enabled) {
        return slackResponse('⏸️ La sincronización de HubSpot está desactivada')
      }

      await supabase
        .from('hubspot_accounts')
        .update({ last_sync_status: 'syncing' })
        .eq('id', hubspotAccount.id)

      return slackResponse('🔄 Sincronización de HubSpot iniciada. Recibirás una notificación cuando termine.')
    }

    case 'calendar': {
      return slackResponse('🔄 Para sincronizar Google Calendar, ve a OPTIMUS-K > Configuración > Integraciones')
    }

    default:
      return slackResponse(
        `🔄 *Comandos /sync disponibles:*\n` +
        `• \`/sync\` o \`/sync status\` - Estado de todas las integraciones\n` +
        `• \`/sync hubspot\` - Sincronizar HubSpot ahora`
      )
  }
}

// /okrs command handler
async function handleOKRsCommand(
  supabase: SupabaseClientAny,
  organizationId: string
): Promise<Response> {
  const { data: objectives } = await supabase
    .from('objectives')
    .select(`
      title,
      status,
      key_results (
        title,
        current_value,
        target_value,
        status
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .limit(5)

  if (!objectives || objectives.length === 0) {
    return slackResponse('📭 No hay OKRs activos')
  }

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🎯 OKRs Activos' }
    },
    { type: 'divider' },
  ]

  for (const obj of objectives) {
    const krs = (obj.key_results || []) as Array<{ current_value: number; target_value: number }>
    const avgProgress = krs.length > 0 
      ? Math.round(krs.reduce((sum: number, kr: { current_value: number; target_value: number }) => sum + (kr.current_value / kr.target_value * 100), 0) / krs.length)
      : 0

    const statusEmoji = avgProgress >= 70 ? '🟢' : avgProgress >= 40 ? '🟡' : '🔴'

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${statusEmoji} *${obj.title}*\n📊 Progreso: ${avgProgress}% | KRs: ${krs.length}`
      }
    })
  }

  return slackResponse(`🎯 ${objectives.length} OKRs activos`, blocks)
}

// /metrics command handler
async function handleMetricsCommand(
  supabase: SupabaseClientAny,
  organizationId: string
): Promise<Response> {
  const thisMonth = new Date()
  thisMonth.setDate(1)

  const { data: metrics } = await supabase
    .from('business_metrics')
    .select('revenue, leads_generated, conversion_rate, avg_ticket')
    .eq('organization_id', organizationId)
    .gte('metric_date', thisMonth.toISOString().split('T')[0])
    .order('metric_date', { ascending: false })
    .limit(1)
    .single()

  if (!metrics) {
    return slackResponse('📊 No hay métricas registradas este mes')
  }

  return slackResponse(
    `📊 *Métricas del Mes*\n\n` +
    `💰 Revenue: €${((metrics.revenue as number) || 0).toLocaleString()}\n` +
    `🎯 Leads generados: ${(metrics.leads_generated as number) || 0}\n` +
    `📈 Tasa conversión: ${(metrics.conversion_rate as number) || 0}%\n` +
    `🧾 Ticket promedio: €${(metrics.avg_ticket as number) || 0}`
  )
}

// /optimusk help command
async function handleHelpCommand(): Promise<Response> {
  return slackResponse(
    `🚀 *OPTIMUS-K - Comandos Disponibles*\n\n` +
    `*Leads:*\n` +
    `• \`/leads\` - Lista últimos leads\n` +
    `• \`/leads hot\` - Leads calientes\n` +
    `• \`/leads stats\` - Estadísticas pipeline\n\n` +
    `*Tareas:*\n` +
    `• \`/tasks\` - Tareas de hoy\n` +
    `• \`/tasks pending\` - Pendientes\n` +
    `• \`/tasks week\` - Resumen semanal\n\n` +
    `*Equipo:*\n` +
    `• \`/team\` - Rendimiento del equipo\n` +
    `• \`/team [nombre]\` - Stats de un miembro\n\n` +
    `*Reportes:*\n` +
    `• \`/report daily\` - Reporte diario\n` +
    `• \`/report weekly\` - Reporte semanal\n\n` +
    `*OKRs y Métricas:*\n` +
    `• \`/okrs\` - OKRs activos\n` +
    `• \`/metrics\` - Métricas del mes\n\n` +
    `*Sincronización:*\n` +
    `• \`/sync\` - Estado integraciones\n` +
    `• \`/sync hubspot\` - Sincronizar HubSpot`
  )
}

// /team command handler
async function handleTeamCommand(
  supabase: SupabaseClientAny,
  organizationId: string,
  text: string
): Promise<Response> {
  const searchName = text.trim().toLowerCase()

  // Get team members with their task stats
  const { data: members } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role,
      users!inner (
        id,
        full_name,
        email
      )
    `)
    .eq('organization_id', organizationId)

  if (!members || members.length === 0) {
    return slackResponse('👥 No hay miembros en el equipo')
  }

  // If searching for specific member
  if (searchName) {
    // deno-lint-ignore no-explicit-any
    const member = members.find((m: any) => 
      m.users?.full_name?.toLowerCase().includes(searchName)
    )
    
    if (!member) {
      return slackResponse(`❌ No se encontró a "${text}"`)
    }

    // Get member's task completions this week
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    
    const { data: completions } = await supabase
      .from('task_completions')
      .select('id, validated_by_leader')
      .eq('user_id', member.user_id)
      .gte('completed_at', weekStart.toISOString())

    const total = completions?.length || 0
    const validated = completions?.filter((c: { validated_by_leader?: boolean }) => c.validated_by_leader).length || 0

    // deno-lint-ignore no-explicit-any
    const userData = member.users as any
    return slackResponse(
      `👤 *${userData.full_name}*\n` +
      `📧 ${userData.email}\n` +
      `🎭 Rol: ${member.role}\n\n` +
      `📊 *Esta semana:*\n` +
      `• Tareas completadas: ${total}\n` +
      `• Validadas: ${validated}\n` +
      `• Tasa: ${total > 0 ? Math.round((validated / total) * 100) : 0}%`
    )
  }

  // Overview of all team members
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `👥 Equipo (${members.length} miembros)` }
    },
    { type: 'divider' },
  ]

  // deno-lint-ignore no-explicit-any
  for (const member of members.slice(0, 10) as any[]) {
    const roleEmoji = member.role === 'admin' ? '👑' : member.role === 'leader' ? '⭐' : '👤'
    const userData = member.users
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${roleEmoji} *${userData?.full_name || 'Sin nombre'}*\n${member.role}`
      }
    })
  }

  return slackResponse(`👥 ${members.length} miembros`, blocks)
}

// /report command handler
async function handleReportCommand(
  supabase: SupabaseClientAny,
  organizationId: string,
  text: string
): Promise<Response> {
  const reportType = text.trim().toLowerCase() || 'daily'

  const today = new Date()
  let startDate: Date
  let periodLabel: string

  if (reportType === 'weekly') {
    startDate = new Date(today)
    startDate.setDate(today.getDate() - 7)
    periodLabel = 'Últimos 7 días'
  } else {
    startDate = new Date(today)
    startDate.setHours(0, 0, 0, 0)
    periodLabel = 'Hoy'
  }

  // Gather data
  const [tasks, leads, metrics] = await Promise.all([
    supabase
      .from('task_schedule')
      .select('status')
      .eq('organization_id', organizationId)
      .gte('start_time', startDate.toISOString()),
    supabase
      .from('leads')
      .select('stage, estimated_value')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString()),
    supabase
      .from('business_metrics')
      .select('revenue, leads_generated')
      .eq('organization_id', organizationId)
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: false })
      .limit(1)
      .maybeSingle()
  ])

  const taskData = tasks.data || []
  const leadData = leads.data || []
  const metricsData = metrics.data

  const totalTasks = taskData.length
  const completedTasks = taskData.filter((t: { status?: string }) => t.status === 'completed').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const newLeads = leadData.length
  const pipelineValue = leadData.reduce((sum: number, l: { estimated_value?: number }) => sum + (l.estimated_value || 0), 0)

  const revenue = metricsData?.revenue || 0

  const reportEmoji = reportType === 'weekly' ? '📅' : '📆'

  return slackResponse(
    `${reportEmoji} *Reporte ${reportType === 'weekly' ? 'Semanal' : 'Diario'}*\n` +
    `_${periodLabel}_\n\n` +
    `*📋 Tareas*\n` +
    `• Completadas: ${completedTasks}/${totalTasks} (${completionRate}%)\n\n` +
    `*🎯 Leads*\n` +
    `• Nuevos: ${newLeads}\n` +
    `• Valor pipeline: €${pipelineValue.toLocaleString()}\n\n` +
    `*💰 Revenue*\n` +
    `• Total: €${revenue.toLocaleString()}`
  )
}
