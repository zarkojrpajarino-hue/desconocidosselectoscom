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

interface Achievement {
  total_points: number;
  tasks_completed_total: number;
  tasks_validated_total: number;
  current_streak: number;
}

interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon_emoji: string;
  rarity: string;
}

interface UserBadge {
  badge_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Extract and validate the authenticated user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's JWT to get their identity
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, task_id, target_user_id } = await req.json();
    
    // Determine which user to award points to
    // By default, award to the authenticated user (caller)
    // Only allow awarding to others if caller has permission (admin/leader)
    let userId = user.id;
    
    if (target_user_id && target_user_id !== user.id) {
      // Verify caller has permission to award points to others
      const { data: callerRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'leader'])
        .single();
      
      if (!callerRole) {
        return new Response(
          JSON.stringify({ error: 'Permission denied: cannot award points to other users' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      userId = target_user_id;
    }
    
    console.log('Award points:', { userId, action, task_id, calledBy: user.id });

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    // Registrar puntos en historial
    await supabase.from('points_history').insert({
      user_id: userId,
      points,
      reason,
      task_id,
    });
    
    // Actualizar o crear achievements del usuario
    const { data: achievementData } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const achievement = achievementData as Achievement | null;
    
    if (achievement) {
      const updates: Record<string, unknown> = {
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
        .eq('user_id', userId);
    } else {
      // Crear registro inicial
      await supabase.from('user_achievements').insert({
        user_id: userId,
        total_points: points,
        tasks_completed_total: action.includes('task_completed') ? 1 : 0,
        tasks_validated_total: action === 'task_validated' ? 1 : 0
      });
    }
    
    // Verificar y otorgar badges
    await checkAndAwardBadges(supabase, userId);
    
    return new Response(
      JSON.stringify({ success: true, points, reason }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in award-points:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// deno-lint-ignore no-explicit-any
async function checkAndAwardBadges(supabase: any, userId: string) {
  const { data: achievementData } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  const achievement = achievementData as Achievement | null;
  if (!achievement) return;
  
  const { data: badgesData } = await supabase
    .from('badges')
    .select('*');
  
  const { data: userBadgesData } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);
  
  const badges = badgesData as Badge[] | null;
  const userBadges = userBadgesData as UserBadge[] | null;
  const earnedBadgeIds = new Set(userBadges?.map((ub) => ub.badge_id) || []);
  
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
      
      // Alerta de badge ganado con datos completos para animación
      await supabase.from('smart_alerts').insert({
        alert_type: 'badge_earned',
        severity: 'celebration',
        title: `¡Nuevo badge desbloqueado! ${badge.icon_emoji}`,
        message: `Has ganado el badge "${badge.name}": ${badge.description}`,
        source: 'gamification',
        category: 'achievement',
        target_user_id: userId,
        actionable: false,
        context: { 
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
