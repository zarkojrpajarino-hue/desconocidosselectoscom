import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  event: string
  data: Record<string, unknown>
  timestamp: string
  webhook_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization_id, event, data } = await req.json() as {
      organization_id: string
      event: string
      data: Record<string, unknown>
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all active webhooks for this org that listen to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('is_active', true)
      .contains('events', [event])

    if (error) {
      console.error('Error fetching webhooks:', error)
      throw error
    }

    const deliveryResults: Array<{ webhook_id: string; status: string }> = []

    if (webhooks && webhooks.length > 0) {
      // Queue webhook deliveries
      for (const webhook of webhooks) {
        const payload: WebhookPayload = {
          event,
          data,
          timestamp: new Date().toISOString(),
          webhook_id: webhook.id
        }

        // Create HMAC signature
        const encoder = new TextEncoder()
        const keyData = encoder.encode(webhook.secret)
        const payloadData = encoder.encode(JSON.stringify(payload))
        
        const key = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        )
        
        const signature = await crypto.subtle.sign('HMAC', key, payloadData)
        const signatureHex = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')

        // Create delivery record
        const { data: deliveryRecord } = await supabase
          .from('webhook_deliveries')
          .insert({
            webhook_id: webhook.id,
            event_type: event,
            payload,
            status: 'pending'
          })
          .select()
          .single()

        // Attempt delivery
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': signatureHex,
              'X-Webhook-Event': event,
              'X-Webhook-ID': webhook.id,
              'X-Webhook-Timestamp': payload.timestamp,
            },
            body: JSON.stringify(payload),
          })

          const status = response.ok ? 'delivered' : 'failed'
          const responseBody = await response.text()
          
          // Update delivery record
          if (deliveryRecord) {
            await supabase
              .from('webhook_deliveries')
              .update({
                status,
                http_status_code: response.status,
                response_body: responseBody.substring(0, 1000),
                delivered_at: new Date().toISOString(),
              })
              .eq('id', deliveryRecord.id)
          }

          // Update webhook stats
          await supabase
            .from('webhooks')
            .update({
              total_deliveries: (webhook.total_deliveries || 0) + 1,
              successful_deliveries: status === 'delivered' 
                ? (webhook.successful_deliveries || 0) + 1 
                : webhook.successful_deliveries,
              failed_deliveries: status === 'failed'
                ? (webhook.failed_deliveries || 0) + 1
                : webhook.failed_deliveries,
              last_delivery_at: new Date().toISOString(),
              last_delivery_status: status
            })
            .eq('id', webhook.id)

          deliveryResults.push({ webhook_id: webhook.id, status })

        } catch (fetchError) {
          // Failed to deliver - schedule retry
          const nextRetry = new Date()
          nextRetry.setMinutes(nextRetry.getMinutes() + 5)

          if (deliveryRecord) {
            await supabase
              .from('webhook_deliveries')
              .update({
                status: 'failed',
                error_message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
                next_retry_at: nextRetry.toISOString()
              })
              .eq('id', deliveryRecord.id)
          }

          deliveryResults.push({ webhook_id: webhook.id, status: 'failed' })
        }
      }
    }

    // Also send to Slack if configured
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/slack-notify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          organization_id,
          event_type: event,
          data
        })
      })
    } catch (slackError) {
      console.error('Slack notification error:', slackError)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Webhooks processed', 
        count: webhooks?.length || 0,
        results: deliveryResults 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Trigger webhook error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
