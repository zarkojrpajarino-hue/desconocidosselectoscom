import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    company?: string;
    phone?: string;
    lifecyclestage?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
  };
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

    const { organization_id, sync_deals = true, limit = 100 } = await req.json()

    // Verify user belongs to the organization
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

    if (!account) {
      return new Response(JSON.stringify({ error: 'HubSpot not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Refresh token if expired
    let accessToken = account.access_token as string
    if (new Date(account.token_expires_at) < new Date()) {
      accessToken = await refreshHubSpotToken(account.refresh_token, account.id)
    }

    console.log(`[sync-from-hubspot] Starting import for org ${organization_id}`)

    // Fetch contacts from HubSpot
    const contacts = await fetchHubSpotContacts(accessToken, limit)
    console.log(`[sync-from-hubspot] Fetched ${contacts.length} contacts from HubSpot`)

    let importedCount = 0
    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const contact of contacts) {
      try {
        // Check if already mapped
        const { data: existingMapping } = await supabase
          .from('hubspot_contact_mappings')
          .select('*, leads(*)')
          .eq('hubspot_contact_id', contact.id)
          .eq('hubspot_account_id', account.id)
          .maybeSingle()

        if (existingMapping?.lead_id) {
          // Update existing lead if HubSpot is newer
          const hubspotModified = new Date(contact.properties.lastmodifieddate || 0)
          const leadUpdated = new Date(existingMapping.last_synced_at || 0)

          if (hubspotModified > leadUpdated) {
            await updateLeadFromHubSpot(supabase, existingMapping.lead_id, contact)
            
            await supabase
              .from('hubspot_contact_mappings')
              .update({
                last_synced_at: new Date().toISOString(),
                last_synced_direction: 'from_hubspot',
                sync_status: 'active'
              })
              .eq('id', existingMapping.id)

            updatedCount++
          } else {
            skippedCount++
          }
        } else {
          // Create new lead
          const leadId = await createLeadFromHubSpot(supabase, organization_id, contact)

          // Fetch associated deal if enabled
          let dealId: string | null = null
          let dealAmount: number | null = null
          let dealStage: string | null = null

          if (sync_deals) {
            const deals = await fetchContactDeals(accessToken, contact.id)
            if (deals.length > 0) {
              const primaryDeal = deals[0]
              dealId = primaryDeal.id
              dealAmount = parseFloat(primaryDeal.properties.amount || '0')
              dealStage = mapHubSpotStageToLocal(primaryDeal.properties.dealstage || '')

              // Update lead with deal info
              await supabase
                .from('leads')
                .update({
                  estimated_value: dealAmount,
                  stage: dealStage
                })
                .eq('id', leadId)
            }
          }

          // Create mapping
          await supabase
            .from('hubspot_contact_mappings')
            .insert({
              hubspot_account_id: account.id,
              lead_id: leadId,
              hubspot_contact_id: contact.id,
              hubspot_deal_id: dealId,
              last_synced_direction: 'from_hubspot',
              sync_status: 'active'
            })

          importedCount++
        }
      } catch (error) {
        console.error(`[sync-from-hubspot] Error importing contact ${contact.id}:`, error)
        errorCount++
      }
    }

    // Update account stats
    await supabase
      .from('hubspot_accounts')
      .update({
        total_contacts_synced: (account.total_contacts_synced || 0) + importedCount,
        last_sync_at: new Date().toISOString(),
        last_sync_status: errorCount > 0 ? 'partial' : 'success'
      })
      .eq('id', account.id)

    console.log(`[sync-from-hubspot] Completed: ${importedCount} imported, ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errorCount,
        total_fetched: contacts.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[sync-from-hubspot] Error:', error)
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

async function fetchHubSpotContacts(accessToken: string, limit: number): Promise<HubSpotContact[]> {
  const properties = ['firstname', 'lastname', 'email', 'company', 'phone', 'lifecyclestage', 'createdate', 'lastmodifieddate']
  
  const response = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts?limit=${limit}&properties=${properties.join(',')}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`HubSpot API error: ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  return data.results || []
}

async function fetchContactDeals(accessToken: string, contactId: string): Promise<HubSpotDeal[]> {
  try {
    // Get associated deals
    const assocResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/deals`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!assocResponse.ok) return []

    const assocData = await assocResponse.json()
    const dealIds = (assocData.results || []).map((r: { id: string }) => r.id)

    if (dealIds.length === 0) return []

    // Fetch deal details
    const dealsResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/deals/batch/read`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: ['dealname', 'amount', 'dealstage', 'closedate'],
          inputs: dealIds.map((id: string) => ({ id }))
        })
      }
    )

    if (!dealsResponse.ok) return []

    const dealsData = await dealsResponse.json()
    return dealsData.results || []
  } catch {
    return []
  }
}

async function createLeadFromHubSpot(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  organizationId: string,
  contact: HubSpotContact
): Promise<string> {
  const fullName = [contact.properties.firstname, contact.properties.lastname]
    .filter(Boolean)
    .join(' ') || 'Sin nombre'

  const { data, error } = await supabaseClient
    .from('leads')
    .insert({
      organization_id: organizationId,
      name: fullName,
      email: contact.properties.email || null,
      company: contact.properties.company || null,
      phone: contact.properties.phone || null,
      source: 'hubspot',
      stage: mapLifecycleToStage(contact.properties.lifecyclestage || ''),
      notes: `Importado de HubSpot el ${new Date().toLocaleDateString()}`
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function updateLeadFromHubSpot(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  leadId: string,
  contact: HubSpotContact
): Promise<void> {
  const fullName = [contact.properties.firstname, contact.properties.lastname]
    .filter(Boolean)
    .join(' ')

  const updates: Record<string, unknown> = {}
  
  if (fullName) updates.name = fullName
  if (contact.properties.email) updates.email = contact.properties.email
  if (contact.properties.company) updates.company = contact.properties.company
  if (contact.properties.phone) updates.phone = contact.properties.phone

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString()
    
    const { error } = await supabaseClient
      .from('leads')
      .update(updates)
      .eq('id', leadId)

    if (error) throw error
  }
}

function mapLifecycleToStage(lifecycle: string): string {
  const stageMap: Record<string, string> = {
    'subscriber': 'new',
    'lead': 'new',
    'marketingqualifiedlead': 'contacted',
    'salesqualifiedlead': 'qualified',
    'opportunity': 'proposal',
    'customer': 'won',
    'evangelist': 'won',
    'other': 'new'
  }
  return stageMap[lifecycle.toLowerCase()] || 'new'
}

function mapHubSpotStageToLocal(dealStage: string): string {
  const stageMap: Record<string, string> = {
    'appointmentscheduled': 'new',
    'qualifiedtobuy': 'contacted',
    'presentationscheduled': 'qualified',
    'decisionmakerboughtin': 'proposal',
    'contractsent': 'negotiation',
    'closedwon': 'won',
    'closedlost': 'lost'
  }
  return stageMap[dealStage.toLowerCase()] || 'new'
}
