import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TrelloCard {
  id: string;
  name: string;
  desc?: string;
  closed: boolean;
  due?: string;
  dateLastActivity: string;
  idList: string;
  url: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { organizationId, limit = 50 } = await req.json();

    // Verify user belongs to the organization
    const { data: membership } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Not a member of this organization' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Trello account
    const { data: trelloAccount } = await supabase
      .from('trello_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (!trelloAccount) {
      return new Response(JSON.stringify({ error: 'Trello not connected' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-from-trello] Starting import for org ${organizationId}`);

    // Fetch cards from Trello board
    const boardId = trelloAccount.board_id;
    const url = `https://api.trello.com/1/boards/${boardId}/cards?key=${trelloAccount.api_key}&token=${trelloAccount.api_token}&limit=${limit}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Trello API error: ${JSON.stringify(errorData)}`);
    }

    const trelloCards = await response.json() as TrelloCard[];
    console.log(`[sync-from-trello] Fetched ${trelloCards.length} cards from Trello`);

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const card of trelloCards) {
      // Skip archived cards
      if (card.closed) {
        skippedCount++;
        continue;
      }

      // Check if already mapped
      const { data: existingMapping } = await supabase
        .from('external_task_mappings')
        .select('*, tasks(*)')
        .eq('external_id', card.id)
        .eq('platform', 'trello')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existingMapping?.task_id) {
        // Update existing task if Trello is newer
        const trelloModified = new Date(card.dateLastActivity);
        const lastSynced = new Date(existingMapping.last_synced_at || 0);

        if (trelloModified > lastSynced) {
          await supabase
            .from('tasks')
            .update({
              title: card.name,
              description: card.desc || null,
              due_date: card.due ? card.due.split('T')[0] : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMapping.task_id);

          await supabase
            .from('external_task_mappings')
            .update({
              last_synced_at: new Date().toISOString(),
              sync_status: 'active'
            })
            .eq('id', existingMapping.id);

          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        // Create new task
        const { data: newTask, error: taskError } = await supabase
          .from('tasks')
          .insert({
            organization_id: organizationId,
            title: card.name,
            description: card.desc || null,
            status: 'pending',
            due_date: card.due ? card.due.split('T')[0] : null,
            priority: 'medium',
            created_by: user.id
          })
          .select('id')
          .single();

        if (taskError) {
          console.error(`[sync-from-trello] Error creating task:`, taskError);
          continue;
        }

        // Create mapping
        await supabase.from('external_task_mappings').insert({
          task_id: newTask.id,
          organization_id: organizationId,
          platform: 'trello',
          external_id: card.id,
          external_url: card.url,
          last_synced_at: new Date().toISOString(),
          sync_status: 'active'
        });

        importedCount++;
      }
    }

    // Update account sync status
    await supabase
      .from('trello_accounts')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success'
      })
      .eq('id', trelloAccount.id);

    console.log(`[sync-from-trello] Completed: ${importedCount} imported, ${updatedCount} updated, ${skippedCount} skipped`);

    return new Response(JSON.stringify({
      success: true,
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      total_fetched: trelloCards.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[sync-from-trello] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
