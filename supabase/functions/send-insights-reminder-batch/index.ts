import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener todas las tareas completadas que necesitan insights
    const { data: completions } = await supabaseAdmin
      .from('task_completions')
      .select(`
        id,
        user_id,
        task_id,
        leader_evaluation,
        collaborator_feedback,
        user_insights,
        tasks:task_id (
          title,
          leader_id,
          user_id
        )
      `)
      .or('and(leader_evaluation.not.is.null,user_insights.is.null),and(collaborator_feedback.not.is.null,user_insights.is.null)');

    if (!completions || completions.length === 0) {
      console.log('No pending insights found');
      return new Response(
        JSON.stringify({ message: 'No pending insights' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${completions.length} completions needing insights`);

    // Enviar recordatorio a cada usuario
    const results = await Promise.allSettled(
      completions.map(async (completion: any) => {
        const task = completion.tasks;
        const isLeader = task.leader_id === completion.user_id;
        
        // Llamar a la función de envío de recordatorio individual
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-insights-reminder`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify({
              userId: completion.user_id,
              taskId: completion.task_id,
              completionId: completion.id,
              isLeader,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to send reminder for completion ${completion.id}`);
        }

        return { completionId: completion.id, status: 'sent' };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Insights reminders sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total: completions.length,
        successful,
        failed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-insights-reminder-batch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
