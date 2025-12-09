import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { organization_id } = await req.json()

    // Verify user belongs to the organization (IDOR protection)
    const { data: membership, error: membershipError } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single();

    if (membershipError || !membership) {
      return new Response(JSON.stringify({ error: 'You are not a member of this organization' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get HubSpot account
    const { data: account } = await supabase
      .from('hubspot_accounts')
      .select('*')
      .eq('organization_id', organization_id)
      .single()

    if (!account || !account.sync_enabled) {
      return new Response(JSON.stringify({ message: 'HubSpot not connected or sync disabled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Refresh token if expired
    let accessToken = account.access_token as string
    if (new Date(account.token_expires_at) < new Date()) {
      accessToken = await refreshHubSpotToken(account.refresh_token, account.id)
    }

    // Get leads to sync (only unsynced or recently updated)
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organization_id)

    let syncedCount = 0
    let errorCount = 0

    for (const lead of leads || []) {
      // Check if already mapped
      const { data: mapping } = await supabase
        .from('hubspot_contact_mappings')
        .select('*')
        .eq('lead_id', lead.id)
        .maybeSingle()

      try {
        if (mapping) {
          // Update existing contact
          await updateHubSpotContact(accessToken, mapping.hubspot_contact_id, lead)
          
          // Update mapping
          await supabase
            .from('hubspot_contact_mappings')
            .update({
              last_synced_at: new Date().toISOString(),
              last_synced_direction: 'to_hubspot',
              sync_status: 'active',
              last_error: null
            })
            .eq('id', mapping.id)
        } else {
          // Create new contact
          const contactId = await createHubSpotContact(accessToken, lead)
          
          // Create deal if lead has value
          let dealId = null
          if (lead.estimated_value && lead.estimated_value > 0) {
            dealId = await createHubSpotDeal(accessToken, contactId, lead)
          }

          // Store mapping
          await supabase
            .from('hubspot_contact_mappings')
            .insert({
              hubspot_account_id: account.id,
              lead_id: lead.id,
              hubspot_contact_id: contactId,
              hubspot_deal_id: dealId,
              last_synced_direction: 'to_hubspot',
              sync_status: 'active'
            })
        }

        syncedCount++

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[sync-to-hubspot] Error syncing lead ${lead.id}:`, error)
        errorCount++
        
        // Log error in mapping if exists
        if (mapping) {
          await supabase
            .from('hubspot_contact_mappings')
            .update({
              sync_status: 'error',
              last_error: errorMessage
            })
            .eq('id', mapping.id)
        }
      }
    }

    // Update account stats
    await supabase
      .from('hubspot_accounts')
      .update({
        total_contacts_synced: (account.total_contacts_synced || 0) + syncedCount,
        last_sync_at: new Date().toISOString(),
        last_sync_status: errorCount > 0 ? 'partial' : 'success'
      })
      .eq('id', account.id)

    console.log(`[sync-to-hubspot] Synced ${syncedCount} leads, ${errorCount} errors`)

    return new Response(
      JSON.stringify({ success: true, synced: syncedCount, errors: errorCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[sync-to-hubspot] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function refreshHubSpotToken(refreshToken: string, accountId: string): Promise<string> {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: Deno.env.get('HUBSPOT_CLIENT_ID')!,
      client_secret: Deno.env.get('HUBSPOT_CLIENT_SECRET')!,
      refresh_token: refreshToken
    })
  })

  const tokens = await response.json()
  const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000))

  await supabaseAdmin
    .from('hubspot_accounts')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt.toISOString()
    })
    .eq('id', accountId)

  return tokens.access_token as string
}

async function createHubSpotContact(accessToken: string, lead: Record<string, unknown>) {
  const leadName = (lead.name as string) || ''
  const [firstName, ...lastNameParts] = leadName.split(' ')
  const lastName = lastNameParts.join(' ')

  const properties = {
    firstname: firstName,
    lastname: lastName || '',
    email: lead.email || '',
    company: lead.company || '',
    phone: lead.phone || '',
    lifecyclestage: 'lead'
  }

  const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ properties })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`HubSpot API error: ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  return data.id
}

async function updateHubSpotContact(accessToken: string, contactId: string, lead: Record<string, unknown>) {
  const leadName = (lead.name as string) || ''
  const [firstName, ...lastNameParts] = leadName.split(' ')
  const lastName = lastNameParts.join(' ')

  const properties = {
    firstname: firstName,
    lastname: lastName || '',
    email: lead.email || '',
    company: lead.company || '',
    phone: lead.phone || ''
  }

  const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ properties })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`HubSpot API error: ${JSON.stringify(errorData)}`)
  }
}

async function createHubSpotDeal(accessToken: string, contactId: string, lead: Record<string, unknown>) {
  const properties = {
    dealname: `${lead.company || lead.name} - Deal`,
    amount: lead.estimated_value || 0,
    pipeline: 'default',
    dealstage: mapStageToHubSpot(lead.stage as string)
  }

  const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties,
      associations: [{
        to: { id: contactId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
      }]
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`HubSpot API error: ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  return data.id
}

function mapStageToHubSpot(stage: string): string {
  const stageMap: Record<string, string> = {
    'new': 'appointmentscheduled',
    'contacted': 'qualifiedtobuy',
    'qualified': 'presentationscheduled',
    'proposal': 'decisionmakerboughtin',
    'negotiation': 'contractsent',
    'won': 'closedwon',
    'lost': 'closedlost'
  }
  return stageMap[stage] || 'appointmentscheduled'
}
