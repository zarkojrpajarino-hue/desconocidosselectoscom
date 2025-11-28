import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { user_id, action, task_id, metadata } = await req.json();
    
    console.log('Award points:', { user_id, action, task_id });

    if (!user_id || !action) {
      throw new Error('user_id and action are required');
    }
    
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
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Registrar puntos en historial
    await supabase.from('points_history').insert({
      user_id,
      points,
      reason,
      task_id,
    });
    
    // Actualizar o crear achievements del usuario
    const { data: achievement } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user_id)
      .single();
    
    if (achievement) {
      const updates: any = {
        total_points: achievement.total_points + points,
        updated_at: new Date().toISOString()
      };
      
      // Actualizar contadores según acción
      if (action === 'task_completed_individual' || action === 'task_completed_collaborative') {
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
    
    // Verificar y otorgar badges
    await checkAndAwardBadges(supabase, user_id);
    
    return new Response(
      JSON.stringify({ success: true, points, reason }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in award-points:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkAndAwardBadges(supabase: any, userId: string) {
  const { data: achievement } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .single();
  
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
      case 'validator_100':
        shouldAward = achievement.tasks_validated_total >= 100;
        break;
    }
    
    if (shouldAward) {
      await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badge.id,
      });
      
      // Notificación de badge ganado con datos completos para animación
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'badge_earned',
        title: `¡Nuevo badge desbloqueado! ${badge.icon_emoji}`,
        message: `Has ganado el badge "${badge.name}": ${badge.description}`,
        metadata: { 
          badge_code: badge.code,
          badge_data: {
            name: badge.name,
            description: badge.description,
            icon_emoji: badge.icon_emoji,
            rarity: badge.rarity,
          }
        },
      });

      console.log(`✨ Badge awarded: ${badge.name}`);
    }
  }
}
