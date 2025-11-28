import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    console.log('Starting task reminders check...');

    // RECORDATORIO 6: Tarea al 40% por >24h
    const { data: at40Percent } = await supabase
      .from('task_completions')
      .select('*, tasks(*)')
      .not('leader_evaluation', 'is', null)
      .is('impact_measurement', null)
      .lt('created_at', twentyFourHoursAgo.toISOString());

    console.log(`Found ${at40Percent?.length || 0} tasks at 40%`);

    for (const completion of at40Percent || []) {
      await supabase.from('notifications').insert({
        user_id: completion.user_id,
        type: 'reminder_40_percent',
        message: `⏰ Completa la medición de impacto de "${completion.tasks.title}" para llegar al 50%`
      });
    }

    // RECORDATORIO 7: Tarea al 50% esperando validación >48h
    const { data: at50Percent } = await supabase
      .from('task_completions')
      .select('*, tasks(*)')
      .not('leader_evaluation', 'is', null)
      .not('impact_measurement', 'is', null)
      .eq('validated_by_leader', false)
      .lt('created_at', fortyEightHoursAgo.toISOString());

    console.log(`Found ${at50Percent?.length || 0} tasks at 50% waiting validation`);

    for (const completion of at50Percent || []) {
      // Notificar ejecutor
      await supabase.from('notifications').insert({
        user_id: completion.user_id,
        type: 'reminder_waiting_validation',
        message: `⏰ Tu tarea "${completion.tasks.title}" lleva 2 días esperando validación`
      });
      
      // Notificar líder
      if (completion.tasks.leader_id) {
        await supabase.from('notifications').insert({
          user_id: completion.tasks.leader_id,
          type: 'reminder_validate',
          message: `⏰ Recuerda validar la tarea "${completion.tasks.title}"`
        });
      }
    }

    // RECORDATORIO 8: Líder al 90% por >24h
    const { data: leadersAt90 } = await supabase
      .from('task_completions')
      .select('*, tasks(*)')
      .not('collaborator_feedback', 'is', null)
      .is('impact_measurement', null)
      .lt('updated_at', twentyFourHoursAgo.toISOString());

    console.log(`Found ${leadersAt90?.length || 0} leaders at 90%`);

    for (const completion of leadersAt90 || []) {
      await supabase.from('notifications').insert({
        user_id: completion.user_id,
        type: 'reminder_leader_90',
        message: `⏰ Completa tu medición de impacto en "${completion.tasks.title}" para 100%`
      });
    }

    // RECORDATORIO 9: Ejecutor al 80-85% por >24h
    const { data: executorsAt80 } = await supabase
      .from('task_completions')
      .select('*, tasks(*)')
      .eq('validated_by_leader', true)
      .or('leader_evaluation.is.null,impact_measurement.is.null')
      .lt('updated_at', twentyFourHoursAgo.toISOString());

    console.log(`Found ${executorsAt80?.length || 0} executors at 80-85%`);

    for (const completion of executorsAt80 || []) {
      const needsFeedback = !completion.leader_evaluation;
      const needsMeasurement = !completion.impact_measurement;
      
      await supabase.from('notifications').insert({
        user_id: completion.user_id,
        type: 'reminder_executor_80',
        message: `⏰ Falta poco para el 100%. Completa ${needsFeedback ? 'feedback' : 'medición'} en "${completion.tasks.title}"`
      });
    }

    // URGENTE 10: <48h para deadline con <50% completado
    const { data: systemConfig } = await supabase
      .from('system_config')
      .select('week_deadline')
      .single();

    if (systemConfig) {
      const deadline = new Date(systemConfig.week_deadline);
      const hoursToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      console.log(`Hours to deadline: ${hoursToDeadline}`);

      if (hoursToDeadline < 48 && hoursToDeadline > 0) {
        const { data: urgentTasks } = await supabase
          .from('tasks')
          .select('*, task_completions!inner(*)')
          .eq('task_completions.validated_by_leader', false);

        console.log(`Found ${urgentTasks?.length || 0} urgent tasks (<48h)`);

        for (const task of urgentTasks || []) {
          await supabase.from('notifications').insert({
            user_id: task.user_id,
            type: 'urgent_deadline_48',
            message: `🚨 URGENTE: Quedan ${Math.floor(hoursToDeadline)} horas. Tarea "${task.title}" incompleta`
          });
        }
      }

      // CRÍTICO 11: <24h para deadline con <80% completado
      if (hoursToDeadline < 24 && hoursToDeadline > 0) {
        const { data: criticalTasks } = await supabase
          .from('tasks')
          .select('id, title, user_id, task_completions(*)')
          .or('task_completions.is.null,task_completions.validated_by_leader.is.false');

        console.log(`Found ${criticalTasks?.length || 0} critical tasks (<24h)`);

        for (const task of criticalTasks || []) {
          await supabase.from('notifications').insert({
            user_id: task.user_id,
            type: 'critical_deadline_24',
            message: `🚨🚨 CRÍTICO: Quedan ${Math.floor(hoursToDeadline)} horas. Finaliza "${task.title}" YA`
          });
          
          // EMAIL urgente
          await supabase.functions.invoke('send-urgent-email', {
            body: {
              to_user_id: task.user_id,
              task_title: task.title,
              hours_remaining: Math.floor(hoursToDeadline)
            }
          });
        }
      }
    }

    console.log('Task reminders completed successfully');

    return new Response(JSON.stringify({ success: true, timestamp: now.toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in send-task-reminders:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
