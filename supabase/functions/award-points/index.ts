import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const POINTS = {
  TASK_COMPLETED_INDIVIDUAL: 50,
  TASK_COMPLETED_COLLABORATIVE: 75,
  TASK_VALIDATED_AS_LEADER: 30,
  FEEDBACK_GIVEN: 15,
  PERFECT_WEEK: 500,
  STREAK_WEEK: 100
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { user_id, action, task_id, metadata } = await req.json();
    
    console.log('Award points:', { user_id, action, task_id });
    
    let points = 0;
    let reason = '';
    
    switch (action) {
      case 'task_completed_individual':
        points = POINTS.TASK_COMPLETED_INDIVIDUAL;
        reason = 'Tarea individual completada';
        break;
      case 'task_completed_collaborative':
        points = POINTS.TASK_COMPLETED_COLLABORATIVE;
        reason = 'Tarea colaborativa completada';
        break;
      case 'task_validated':
        points = POINTS.TASK_VALIDATED_AS_LEADER;
        reason = 'Tarea validada como líder';
        break;
      case 'feedback_given':
        points = POINTS.FEEDBACK_GIVEN;
        reason = 'Feedback proporcionado';
        break;
      case 'perfect_week':
        points = POINTS.PERFECT_WEEK;
        reason = '¡Semana perfecta!';
        break;
      case 'streak_week':
        points = POINTS.STREAK_WEEK;
        reason = 'Racha semanal';
        break;
      default:
        throw new Error('Invalid action');
    }
    
    // Registrar puntos en historial
    const { error: historyError } = await supabase.from('points_history').insert({
      user_id,
      points,
      reason,
      task_id
    });
    
    if (historyError) throw historyError;
    
    // Actualizar total de puntos
    const { data: achievement } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();
    
    if (achievement) {
      const updates: any = {
        total_points: achievement.total_points + points,
        updated_at: new Date().toISOString()
      };
      
      // Actualizar contadores según acción
      if (action.includes('task_completed')) {
        updates.tasks_completed_total = achievement.tasks_completed_total + 1;
      }
      if (action === 'task_validated') {
        updates.tasks_validated_total = achievement.tasks_validated_total + 1;
      }
      
      await supabase
        .from('user_achievements')
        .update(updates)
        .eq('user_id', user_id);
    } else {
      // Crear registro inicial
      await supabase.from('user_achievements').insert({
        user_id,
        total_points: points,
        tasks_completed_total: action.includes('task_completed') ? 1 : 0,
        tasks_validated_total: action === 'task_validated' ? 1 : 0
      });
    }
    
    // Verificar badges nuevos
    await checkAndAwardBadges(supabase, user_id);
    
    return new Response(JSON.stringify({ success: true, points }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error awarding points:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function checkAndAwardBadges(supabase: any, userId: string) {
  const { data: achievement } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (!achievement) return;
  
  const { data: badges } = await supabase
    .from('badges')
    .select('*');
  
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);
  
  const earnedBadgeIds = new Set(userBadges?.map((ub: any) => ub.badge_id) || []);
  
  for (const badge of badges || []) {
    if (earnedBadgeIds.has(badge.id)) continue;
    
    let shouldAward = false;
    
    switch (badge.code) {
      case 'first_task':
        shouldAward = achievement.tasks_completed_total >= 1;
        break;
      case 'task_master_10':
        shouldAward = achievement.tasks_completed_total >= 10;
        break;
      case 'task_legend_50':
        shouldAward = achievement.tasks_completed_total >= 50;
        break;
      case 'task_god_100':
        shouldAward = achievement.tasks_completed_total >= 100;
        break;
      case 'streak_3':
        shouldAward = achievement.current_streak >= 3;
        break;
      case 'streak_5':
        shouldAward = achievement.current_streak >= 5;
        break;
      case 'streak_10':
        shouldAward = achievement.current_streak >= 10;
        break;
      case 'streak_20':
        shouldAward = achievement.current_streak >= 20;
        break;
      case 'validator_10':
        shouldAward = achievement.tasks_validated_total >= 10;
        break;
      case 'validator_50':
        shouldAward = achievement.tasks_validated_total >= 50;
        break;
    }
    
    if (shouldAward) {
      console.log('Awarding badge:', badge.code, 'to user:', userId);
      
      await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badge.id
      });
      
      // Notificación
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'badge_earned',
        message: `¡Nuevo badge desbloqueado! ${badge.icon_emoji} ${badge.name}: ${badge.description}`
      });
    }
  }
}
