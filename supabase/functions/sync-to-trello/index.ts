import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

    const { organizationId, taskId, listId } = await req.json();

    // Verify user belongs to the organization (IDOR protection)
    const { data: membership, error: membershipError } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (membershipError || !membership) {
      return new Response(JSON.stringify({ error: 'You are not a member of this organization' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Trello account
    const { data: trelloAccount, error: accountError } = await supabase
      .from('trello_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (accountError || !trelloAccount) {
      return new Response(JSON.stringify({ error: 'Trello account not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!trelloAccount.sync_enabled) {
      return new Response(JSON.stringify({ error: 'Sync disabled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already synced
    const { data: existingMapping } = await supabase
      .from('external_task_mappings')
      .select('*')
      .eq('task_id', taskId)
      .eq('platform', 'trello')
      .single();

    const trelloAuth = `key=${trelloAccount.api_key}&token=${trelloAccount.api_token}`;
    let trelloCard;

    if (existingMapping) {
      // Update existing card
      const updateResponse = await fetch(
        `https://api.trello.com/1/cards/${existingMapping.external_id}?${trelloAuth}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: task.title,
            desc: task.description || '',
            closed: task.status === 'completed',
          }),
        }
      );
      trelloCard = await updateResponse.json();
    } else {
      // Determine which list to use
      const targetListId = listId || (trelloAccount.list_mapping as Record<string, string>)?.default;
      
      if (!targetListId) {
        return new Response(JSON.stringify({ error: 'No list configured' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create new card in Trello
      const createResponse = await fetch(
        `https://api.trello.com/1/cards?${trelloAuth}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: task.title,
            desc: task.description || '',
            idList: targetListId,
          }),
        }
      );
      trelloCard = await createResponse.json();

      if (trelloCard.id) {
        // Save mapping
        await supabase.from('external_task_mappings').insert({
          task_id: taskId,
          organization_id: organizationId,
          platform: 'trello',
          external_id: trelloCard.id,
          external_url: trelloCard.shortUrl,
        });
      }
    }

    // Update sync status
    await supabase
      .from('trello_accounts')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
      })
      .eq('id', trelloAccount.id);

    return new Response(JSON.stringify({ success: true, trelloCard }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Trello sync error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
