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

    const { organizationId, taskId } = await req.json();

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

    // Get Asana account
    const { data: asanaAccount, error: accountError } = await supabase
      .from('asana_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (accountError || !asanaAccount) {
      return new Response(JSON.stringify({ error: 'Asana account not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!asanaAccount.sync_enabled) {
      return new Response(JSON.stringify({ error: 'Sync disabled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*, users!tasks_assigned_to_fkey(full_name, email)')
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
      .eq('platform', 'asana')
      .single();

    let asanaTask;
    const asanaHeaders = {
      'Authorization': `Bearer ${asanaAccount.access_token}`,
      'Content-Type': 'application/json',
    };

    if (existingMapping) {
      // Update existing task
      const updateResponse = await fetch(
        `https://app.asana.com/api/1.0/tasks/${existingMapping.external_id}`,
        {
          method: 'PUT',
          headers: asanaHeaders,
          body: JSON.stringify({
            data: {
              name: task.title,
              notes: task.description || '',
              completed: task.status === 'completed',
            },
          }),
        }
      );
      asanaTask = await updateResponse.json();
    } else {
      // Create new task in Asana
      const createResponse = await fetch(
        'https://app.asana.com/api/1.0/tasks',
        {
          method: 'POST',
          headers: asanaHeaders,
          body: JSON.stringify({
            data: {
              name: task.title,
              notes: task.description || '',
              projects: asanaAccount.project_id ? [asanaAccount.project_id] : [],
              workspace: asanaAccount.workspace_id,
            },
          }),
        }
      );
      asanaTask = await createResponse.json();

      if (asanaTask.data?.gid) {
        // Save mapping
        await supabase.from('external_task_mappings').insert({
          task_id: taskId,
          organization_id: organizationId,
          platform: 'asana',
          external_id: asanaTask.data.gid,
          external_url: `https://app.asana.com/0/${asanaAccount.project_id}/${asanaTask.data.gid}`,
        });
      }
    }

    // Update sync status
    await supabase
      .from('asana_accounts')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
      })
      .eq('id', asanaAccount.id);

    return new Response(JSON.stringify({ success: true, asanaTask }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Asana sync error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
