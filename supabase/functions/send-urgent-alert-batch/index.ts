import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get system config to check deadline
    const { data: config, error: configError } = await supabaseAdmin
      .from('system_config')
      .select('*')
      .single();

    if (configError) throw configError;

    const deadline = new Date(config.week_deadline);
    const now = new Date();
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Only send alerts if less than 24 hours remaining
    if (hoursRemaining > 24 || hoursRemaining < 0) {
      return new Response(
        JSON.stringify({ message: 'Not within alert window', hoursRemaining }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get users with pending tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select(`
        user_id,
        task_completions(completed_by_user)
      `);

    if (tasksError) throw tasksError;

    // Find users with incomplete tasks
    const usersWithPendingTasks = new Set<string>();
    tasks?.forEach(task => {
      const isCompleted = task.task_completions?.some((comp: any) => comp.completed_by_user);
      if (!isCompleted) {
        usersWithPendingTasks.add(task.user_id);
      }
    });

    const results = [];
    
    // Send alerts to users with pending tasks
    for (const userId of usersWithPendingTasks) {
      try {
        const { error } = await supabaseAdmin.functions.invoke('send-urgent-alert', {
          body: { userId }
        });
        
        if (error) {
          console.error(`Error sending alert to ${userId}:`, error);
          results.push({ userId, success: false, error: error.message });
        } else {
          results.push({ userId, success: true });
        }
      } catch (err) {
        console.error(`Failed to send alert to ${userId}:`, err);
        results.push({ userId, success: false, error: String(err) });
      }
    }

    console.log(`Sent ${results.filter(r => r.success).length}/${results.length} urgent alerts`);

    return new Response(
      JSON.stringify({ 
        total: results.length, 
        successful: results.filter(r => r.success).length,
        hoursRemaining: Math.round(hoursRemaining),
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-urgent-alert-batch:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

Deno.serve(handler);
