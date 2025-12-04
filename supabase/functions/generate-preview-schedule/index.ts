import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract userId from JWT token instead of request body (IDOR fix)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseAuth = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userId = user.id; // Use authenticated user's ID, not from request
    const { weekStart } = await req.json();
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`🔍 Generando preview para usuario ${userId}, semana ${weekStart}`);

    // Obtener disponibilidad del usuario
    const { data: availability } = await supabase
      .from('user_weekly_availability')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single();

    if (!availability) {
      return new Response(
        JSON.stringify({ error: 'Usuario sin disponibilidad' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Obtener tareas del usuario
    const { data: systemConfig } = await supabase
      .from('system_config')
      .select('current_phase')
      .single();

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('phase', systemConfig?.current_phase || 1)
      .limit(5);

    // Generar preview simple usando los primeros días disponibles
    const previewTasks: any[] = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    let taskIndex = 0;

    for (const day of days) {
      const dayAvailable = availability[`${day}_available`];
      if (dayAvailable && tasks && tasks[taskIndex]) {
        const startTime = availability[`${day}_start`];
        const task = tasks[taskIndex];
        
        // Calcular fecha del día
        const weekDate = new Date(weekStart);
        const dayIndex = days.indexOf(day);
        weekDate.setDate(weekDate.getDate() + dayIndex);

        previewTasks.push({
          task_id: task.id,
          task_title: task.title,
          scheduled_date: weekDate.toISOString().split('T')[0],
          scheduled_start: startTime,
          scheduled_end: addHours(startTime, 2),
          is_preview: true
        });

        taskIndex++;
        if (taskIndex >= (tasks?.length || 0)) break;
      }
    }

    // Guardar preview
    await supabase
      .from('weekly_schedule_preview')
      .upsert({
        user_id: userId,
        week_start: weekStart,
        preview_data: { tasks: previewTasks },
        priority_order: Date.now(), // Menor = más prioridad
        can_suggest_changes: true,
      }, { onConflict: 'user_id,week_start' });

    // Verificar usuarios pendientes
    const { data: weekConfig } = await supabase
      .from('week_config')
      .select('users_pending, ready_count, total_users')
      .eq('week_start', weekStart)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        preview: previewTasks,
        pending_users: weekConfig?.users_pending || [],
        ready_count: weekConfig?.ready_count || 0,
        total_users: weekConfig?.total_users || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generando preview:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const newHour = h + hours;
  return `${String(newHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
