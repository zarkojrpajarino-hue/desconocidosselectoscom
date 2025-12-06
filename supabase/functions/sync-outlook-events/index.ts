import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID') || ''
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OutlookAccount {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
  calendar_id: string | null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Outlook account
    const { data: account, error: accountError } = await supabase
      .from('outlook_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('sync_enabled', true)
      .maybeSingle()

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'No Outlook account connected' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const outlookAccount = account as OutlookAccount

    // Check if token needs refresh
    let accessToken = outlookAccount.access_token
    if (new Date(outlookAccount.token_expires_at) < new Date()) {
      accessToken = await refreshToken(outlookAccount, supabase)
    }

    // Get accepted task schedules for this week
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const { data: schedules, error: schedulesError } = await supabase
      .from('task_schedule')
      .select(`
        id,
        task_id,
        scheduled_start,
        scheduled_end,
        tasks (
          title,
          description
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .gte('scheduled_start', weekStart.toISOString())

    if (schedulesError) {
      throw schedulesError
    }

    let synced = 0
    let errors = 0

    for (const schedule of (schedules || [])) {
      try {
        // Get task info - handle both array and object
        const taskData = Array.isArray(schedule.tasks) ? schedule.tasks[0] : schedule.tasks
        const taskTitle = taskData?.title || 'Tarea sin título'
        const taskDescription = taskData?.description || ''

        // Check if already synced
        const { data: existingMapping } = await supabase
          .from('outlook_event_mappings')
          .select('outlook_event_id')
          .eq('task_schedule_id', schedule.id)
          .maybeSingle()

        const calendarId = outlookAccount.calendar_id || 'me/calendar'

        if (existingMapping) {
          // Update existing event
          await fetch(
            `https://graph.microsoft.com/v1.0/${calendarId}/events/${existingMapping.outlook_event_id}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                subject: `[OPTIMUS-K] ${taskTitle}`,
                body: {
                  contentType: 'text',
                  content: taskDescription
                },
                start: {
                  dateTime: schedule.scheduled_start,
                  timeZone: 'UTC'
                },
                end: {
                  dateTime: schedule.scheduled_end,
                  timeZone: 'UTC'
                }
              })
            }
          )
          synced++
        } else {
          // Create new event
          const createResponse = await fetch(
            `https://graph.microsoft.com/v1.0/${calendarId}/events`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                subject: `[OPTIMUS-K] ${taskTitle}`,
                body: {
                  contentType: 'text',
                  content: taskDescription
                },
                start: {
                  dateTime: schedule.scheduled_start,
                  timeZone: 'UTC'
                },
                end: {
                  dateTime: schedule.scheduled_end,
                  timeZone: 'UTC'
                },
                showAs: 'busy'
              })
            }
          )

          if (createResponse.ok) {
            const eventData = await createResponse.json()
            
            await supabase
              .from('outlook_event_mappings')
              .insert({
                outlook_account_id: outlookAccount.id,
                task_schedule_id: schedule.id,
                outlook_event_id: eventData.id
              })
            
            synced++
          } else {
            errors++
          }
        }
      } catch (err) {
        console.error('Error syncing task:', err)
        errors++
      }
    }

    // Update last sync
    await supabase
      .from('outlook_accounts')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: errors > 0 ? 'partial' : 'success'
      })
      .eq('id', outlookAccount.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        synced,
        errors,
        total: (schedules || []).length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function refreshToken(account: OutlookAccount, supabase: SupabaseClient): Promise<string> {
  const tokenResponse = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token',
        scope: 'offline_access Calendars.ReadWrite User.Read'
      })
    }
  )

  const tokens = await tokenResponse.json()

  if (tokens.error) {
    throw new Error(tokens.error_description || tokens.error)
  }

  const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000))

  await supabase
    .from('outlook_accounts')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || account.refresh_token,
      token_expires_at: expiresAt.toISOString()
    })
    .eq('id', account.id)

  return tokens.access_token
}
