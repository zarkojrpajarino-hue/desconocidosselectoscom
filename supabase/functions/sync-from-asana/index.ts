import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AsanaTask {
  gid: string;
  name: string;
  notes?: string;
  completed: boolean;
  due_on?: string;
  assignee?: { gid: string; name: string; email?: string };
  created_at: string;
  modified_at: string;
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

    // Get Asana account
    const { data: asanaAccount } = await supabase
      .from('asana_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (!asanaAccount) {
      return new Response(JSON.stringify({ error: 'Asana not connected' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-from-asana] Starting import for org ${organizationId}`);

    // Fetch tasks from Asana
    const asanaHeaders = {
      'Authorization': `Bearer ${asanaAccount.access_token}`,
      'Content-Type': 'application/json',
    };

    const projectId = asanaAccount.project_id;
    const url = projectId 
      ? `https://app.asana.com/api/1.0/projects/${projectId}/tasks?opt_fields=gid,name,notes,completed,due_on,assignee,created_at,modified_at&limit=${limit}`
      : `https://app.asana.com/api/1.0/workspaces/${asanaAccount.workspace_id}/tasks?opt_fields=gid,name,notes,completed,due_on,assignee,created_at,modified_at&limit=${limit}`;

    const response = await fetch(url, { headers: asanaHeaders });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Asana API error: ${JSON.stringify(errorData)}`);
    }

    const { data: asanaTasks } = await response.json() as { data: AsanaTask[] };
    console.log(`[sync-from-asana] Fetched ${asanaTasks.length} tasks from Asana`);

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const asanaTask of asanaTasks) {
      // Check if already mapped
      const { data: existingMapping } = await supabase
        .from('external_task_mappings')
        .select('*, tasks(*)')
        .eq('external_id', asanaTask.gid)
        .eq('platform', 'asana')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existingMapping?.task_id) {
        // Update existing task if Asana is newer
        const asanaModified = new Date(asanaTask.modified_at);
        const lastSynced = new Date(existingMapping.last_synced_at || 0);

        if (asanaModified > lastSynced) {
          await supabase
            .from('tasks')
            .update({
              title: asanaTask.name,
              description: asanaTask.notes || null,
              status: asanaTask.completed ? 'completed' : 'pending',
              due_date: asanaTask.due_on || null,
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
            title: asanaTask.name,
            description: asanaTask.notes || null,
            status: asanaTask.completed ? 'completed' : 'pending',
            due_date: asanaTask.due_on || null,
            priority: 'medium',
            created_by: user.id
          })
          .select('id')
          .single();

        if (taskError) {
          console.error(`[sync-from-asana] Error creating task:`, taskError);
          continue;
        }

        // Create mapping
        await supabase.from('external_task_mappings').insert({
          task_id: newTask.id,
          organization_id: organizationId,
          platform: 'asana',
          external_id: asanaTask.gid,
          external_url: `https://app.asana.com/0/${projectId}/${asanaTask.gid}`,
          last_synced_at: new Date().toISOString(),
          sync_status: 'active'
        });

        importedCount++;
      }
    }

    // Update account sync status
    await supabase
      .from('asana_accounts')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success'
      })
      .eq('id', asanaAccount.id);

    console.log(`[sync-from-asana] Completed: ${importedCount} imported, ${updatedCount} updated, ${skippedCount} skipped`);

    return new Response(JSON.stringify({
      success: true,
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      total_fetched: asanaTasks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[sync-from-asana] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
