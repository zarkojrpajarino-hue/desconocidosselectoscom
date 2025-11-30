-- ============================================
-- SISTEMA COMPLETO DE ALERTAS INTELIGENTES
-- ============================================

-- 1. CRM: Próximas acciones del día
CREATE OR REPLACE FUNCTION public.check_crm_daily_actions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  lead_record RECORD;
BEGIN
  FOR lead_record IN
    SELECT l.id, l.name, l.company, l.next_action, l.next_action_date,
           l.next_action_type, l.assigned_to, l.estimated_value
    FROM leads l
    WHERE l.next_action_date = CURRENT_DATE
    AND l.stage NOT IN ('won', 'lost')
  LOOP
    IF NOT EXISTS(
      SELECT 1 FROM smart_alerts 
      WHERE alert_type = 'crm_daily_action'
      AND dismissed = false
      AND context->>'lead_id' = lead_record.id::TEXT
      AND DATE(created_at) = CURRENT_DATE
    ) THEN
      INSERT INTO smart_alerts (
        alert_type, severity, title, message, context, source, category,
        actionable, action_label, action_url, target_user_id
      ) VALUES (
        'crm_daily_action',
        'info',
        format('📅 Acción Hoy: %s', COALESCE(lead_record.company, lead_record.name)),
        format('%s programada para hoy. %s',
          COALESCE(lead_record.next_action_type, 'Acción'),
          COALESCE(lead_record.next_action, '')
        ),
        jsonb_build_object(
          'lead_id', lead_record.id,
          'action_type', lead_record.next_action_type,
          'estimated_value', lead_record.estimated_value
        ),
        'crm',
        'reminder',
        true,
        'Ver Lead',
        '/crm',
        lead_record.assigned_to
      );
    END IF;
  END LOOP;
END;
$$;

-- 2. CRM: Oportunidades estancadas por etapa
CREATE OR REPLACE FUNCTION public.check_stagnant_opportunities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  lead_record RECORD;
  days_in_stage INTEGER;
  max_days_by_stage INTEGER;
BEGIN
  FOR lead_record IN
    SELECT l.id, l.name, l.company, l.stage, l.updated_at,
           l.assigned_to, l.estimated_value, l.probability
    FROM leads l
    WHERE l.stage IN ('qualified', 'proposal', 'negotiation')
  LOOP
    days_in_stage := CURRENT_DATE - lead_record.updated_at::DATE;
    
    max_days_by_stage := CASE lead_record.stage
      WHEN 'qualified' THEN 14
      WHEN 'proposal' THEN 21
      WHEN 'negotiation' THEN 30
      ELSE 30
    END;
    
    IF days_in_stage > max_days_by_stage THEN
      IF NOT EXISTS(
        SELECT 1 FROM smart_alerts 
        WHERE alert_type = 'crm_stagnant'
        AND dismissed = false
        AND context->>'lead_id' = lead_record.id::TEXT
        AND created_at > NOW() - INTERVAL '7 days'
      ) THEN
        INSERT INTO smart_alerts (
          alert_type, severity, title, message, context, source, category,
          actionable, action_label, action_url, target_user_id
        ) VALUES (
          'crm_stagnant',
          'important',
          format('⏸️ Oportunidad Estancada: %s', COALESCE(lead_record.company, lead_record.name)),
          format('Lleva %s días en etapa "%s". Riesgo de pérdida. Valor: €%s.',
            days_in_stage,
            lead_record.stage,
            ROUND(lead_record.estimated_value)
          ),
          jsonb_build_object(
            'lead_id', lead_record.id,
            'days_in_stage', days_in_stage,
            'stage', lead_record.stage,
            'estimated_value', lead_record.estimated_value
          ),
          'crm',
          'risk',
          true,
          'Reactivar Lead',
          '/crm',
          lead_record.assigned_to
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- 3. MÉTRICAS: KPIs sin actualizar
CREATE OR REPLACE FUNCTION public.check_stale_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  days_since_update INTEGER;
BEGIN
  FOR user_record IN
    SELECT u.id, u.full_name, MAX(bm.metric_date) as last_metric_date
    FROM users u
    LEFT JOIN business_metrics bm ON bm.user_id = u.id
    WHERE u.role != 'admin'
    GROUP BY u.id, u.full_name
  LOOP
    IF user_record.last_metric_date IS NULL THEN
      days_since_update := 999;
    ELSE
      days_since_update := CURRENT_DATE - user_record.last_metric_date;
    END IF;
    
    IF days_since_update >= 7 THEN
      IF NOT EXISTS(
        SELECT 1 FROM smart_alerts 
        WHERE alert_type = 'metrics_stale'
        AND dismissed = false
        AND target_user_id = user_record.id
        AND created_at > NOW() - INTERVAL '5 days'
      ) THEN
        INSERT INTO smart_alerts (
          alert_type, severity, title, message, context, source, category,
          actionable, action_label, action_url, target_user_id
        ) VALUES (
          'metrics_stale',
          'important',
          '📊 Actualiza tus Métricas',
          format('No has registrado KPIs en %s días. Mantén visibilidad del negocio.',
            CASE WHEN days_since_update > 90 THEN 'más de 90' ELSE days_since_update::TEXT END
          ),
          jsonb_build_object(
            'days_since_update', days_since_update,
            'last_update', user_record.last_metric_date
          ),
          'metrics',
          'reminder',
          true,
          'Registrar KPIs',
          '/metrics-hub',
          user_record.id
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- 4. MÉTRICAS: Rendimiento en caída
CREATE OR REPLACE FUNCTION public.check_performance_drop()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  current_week_tasks INTEGER;
  last_week_tasks INTEGER;
  drop_percentage NUMERIC;
BEGIN
  FOR user_record IN
    SELECT u.id, u.full_name
    FROM users u
    WHERE u.role != 'admin'
  LOOP
    -- Tareas validadas esta semana
    SELECT COUNT(*) INTO current_week_tasks
    FROM task_completions tc
    JOIN task_schedule ts ON ts.task_id = tc.task_id
    WHERE tc.user_id = user_record.id
    AND tc.validated_by_leader = true
    AND ts.week_start = DATE_TRUNC('week', CURRENT_DATE)::DATE;
    
    -- Tareas validadas semana pasada
    SELECT COUNT(*) INTO last_week_tasks
    FROM task_completions tc
    JOIN task_schedule ts ON ts.task_id = tc.task_id
    WHERE tc.user_id = user_record.id
    AND tc.validated_by_leader = true
    AND ts.week_start = (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days')::DATE;
    
    IF last_week_tasks > 0 AND current_week_tasks < last_week_tasks * 0.6 THEN
      drop_percentage := ((last_week_tasks - current_week_tasks)::NUMERIC / last_week_tasks) * 100;
      
      IF NOT EXISTS(
        SELECT 1 FROM smart_alerts 
        WHERE alert_type = 'performance_drop'
        AND dismissed = false
        AND target_user_id = user_record.id
        AND created_at > NOW() - INTERVAL '7 days'
      ) THEN
        INSERT INTO smart_alerts (
          alert_type, severity, title, message, context, source, category,
          actionable, action_label, action_url, target_user_id
        ) VALUES (
          'performance_drop',
          'important',
          '📉 Caída de Rendimiento Detectada',
          format('Tu ejecución bajó %s%% vs semana pasada (%s → %s tareas). ¿Necesitas apoyo?',
            ROUND(drop_percentage),
            last_week_tasks,
            current_week_tasks
          ),
          jsonb_build_object(
            'current_week', current_week_tasks,
            'last_week', last_week_tasks,
            'drop_percentage', drop_percentage
          ),
          'performance',
          'insight',
          true,
          'Ver Dashboard',
          '/dashboard',
          user_record.id
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- 5. COLABORACIÓN: Aprobaciones pendientes para líderes
CREATE OR REPLACE FUNCTION public.check_pending_validations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  leader_record RECORD;
  pending_count INTEGER;
BEGIN
  FOR leader_record IN
    SELECT DISTINCT t.leader_id, u.full_name
    FROM tasks t
    JOIN users u ON u.id = t.leader_id
    WHERE t.leader_id IS NOT NULL
  LOOP
    SELECT COUNT(*) INTO pending_count
    FROM task_completions tc
    JOIN tasks t ON t.id = tc.task_id
    WHERE t.leader_id = leader_record.leader_id
    AND tc.completed_by_user = true
    AND (tc.validated_by_leader = false OR tc.validated_by_leader IS NULL);
    
    IF pending_count >= 3 THEN
      IF NOT EXISTS(
        SELECT 1 FROM smart_alerts 
        WHERE alert_type = 'validation_pending'
        AND dismissed = false
        AND target_user_id = leader_record.leader_id
        AND created_at > NOW() - INTERVAL '2 days'
      ) THEN
        INSERT INTO smart_alerts (
          alert_type, severity, title, message, context, source, category,
          actionable, action_label, action_url, target_user_id
        ) VALUES (
          'validation_pending',
          'info',
          '✅ Validaciones Pendientes',
          format('Tienes %s tareas esperando tu validación de líder.',
            pending_count
          ),
          jsonb_build_object(
            'pending_count', pending_count
          ),
          'collaboration',
          'reminder',
          true,
          'Validar Tareas',
          '/dashboard',
          leader_record.leader_id
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- 6. COLABORACIÓN: Tareas colaborativas pendientes
CREATE OR REPLACE FUNCTION public.check_collaborative_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  collab_record RECORD;
BEGIN
  FOR collab_record IN
    SELECT ts.collaborator_user_id, u.full_name, COUNT(*) as pending_count
    FROM task_schedule ts
    JOIN users u ON u.id = ts.collaborator_user_id
    WHERE ts.is_collaborative = true
    AND ts.status = 'pending'
    AND ts.week_start >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY ts.collaborator_user_id, u.full_name
    HAVING COUNT(*) > 0
  LOOP
    IF NOT EXISTS(
      SELECT 1 FROM smart_alerts 
      WHERE alert_type = 'collab_pending'
      AND dismissed = false
      AND target_user_id = collab_record.collaborator_user_id
      AND created_at > NOW() - INTERVAL '3 days'
    ) THEN
      INSERT INTO smart_alerts (
        alert_type, severity, title, message, context, source, category,
        actionable, action_label, action_url, target_user_id
      ) VALUES (
        'collab_pending',
        'info',
        '🤝 Colaboraciones Pendientes',
        format('Tienes %s tarea(s) colaborativa(s) esperando tu aceptación.',
          collab_record.pending_count
        ),
        jsonb_build_object(
          'pending_count', collab_record.pending_count
        ),
        'collaboration',
        'reminder',
        true,
        'Ver Agenda',
        '/dashboard/agenda',
        collab_record.collaborator_user_id
      );
    END IF;
  END LOOP;
END;
$$;

-- 7. GAMIFICACIÓN: Rachas en peligro
CREATE OR REPLACE FUNCTION public.check_streak_at_risk()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  tasks_today INTEGER;
BEGIN
  FOR user_record IN
    SELECT u.id, u.full_name, ua.current_streak
    FROM users u
    JOIN user_achievements ua ON ua.user_id = u.id
    WHERE ua.current_streak >= 3
    AND u.role != 'admin'
  LOOP
    -- Verificar si tiene tareas completadas hoy
    SELECT COUNT(*) INTO tasks_today
    FROM task_completions tc
    WHERE tc.user_id = user_record.id
    AND DATE(tc.completed_at) = CURRENT_DATE;
    
    IF tasks_today = 0 AND EXTRACT(HOUR FROM NOW()) >= 18 THEN
      IF NOT EXISTS(
        SELECT 1 FROM smart_alerts 
        WHERE alert_type = 'streak_risk'
        AND dismissed = false
        AND target_user_id = user_record.id
        AND DATE(created_at) = CURRENT_DATE
      ) THEN
        INSERT INTO smart_alerts (
          alert_type, severity, title, message, context, source, category,
          actionable, action_label, action_url, target_user_id
        ) VALUES (
          'streak_risk',
          'info',
          '🔥 ¡Mantén tu Racha!',
          format('Llevas %s días consecutivos. Completa 1 tarea hoy para no perderla.',
            user_record.current_streak
          ),
          jsonb_build_object(
            'current_streak', user_record.current_streak
          ),
          'gamification',
          'celebration',
          true,
          'Ver Tareas',
          '/dashboard',
          user_record.id
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- 8. GAMIFICACIÓN: Cerca de desbloquear insignia
CREATE OR REPLACE FUNCTION public.check_badge_proximity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  badge_record RECORD;
  points_needed INTEGER;
BEGIN
  FOR user_record IN
    SELECT u.id, u.full_name, ua.total_points
    FROM users u
    JOIN user_achievements ua ON ua.user_id = u.id
    WHERE u.role != 'admin'
  LOOP
    FOR badge_record IN
      SELECT b.id, b.name, b.points_required, b.icon_emoji
      FROM badges b
      WHERE b.points_required IS NOT NULL
      AND b.points_required > user_record.total_points
      AND NOT EXISTS(
        SELECT 1 FROM user_badges ub 
        WHERE ub.user_id = user_record.id 
        AND ub.badge_id = b.id
      )
      ORDER BY b.points_required
      LIMIT 1
    LOOP
      points_needed := badge_record.points_required - user_record.total_points;
      
      IF points_needed <= 50 AND points_needed > 0 THEN
        IF NOT EXISTS(
          SELECT 1 FROM smart_alerts 
          WHERE alert_type = 'badge_proximity'
          AND dismissed = false
          AND target_user_id = user_record.id
          AND context->>'badge_id' = badge_record.id::TEXT
          AND created_at > NOW() - INTERVAL '3 days'
        ) THEN
          INSERT INTO smart_alerts (
            alert_type, severity, title, message, context, source, category,
            actionable, action_label, action_url, target_user_id
          ) VALUES (
            'badge_proximity',
            'opportunity',
            format('%s ¡Cerca de Desbloquear!', badge_record.icon_emoji),
            format('Te faltan solo %s puntos para "%s". ¡Completa más tareas!',
              points_needed,
              badge_record.name
            ),
            jsonb_build_object(
              'badge_id', badge_record.id,
              'badge_name', badge_record.name,
              'points_needed', points_needed
            ),
            'gamification',
            'opportunity',
            true,
            'Ver Gamificación',
            '/dashboard/gamification',
            user_record.id
          );
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 9. FINANCIERO: CAC creciente
CREATE OR REPLACE FUNCTION public.check_rising_cac()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_cac NUMERIC;
  previous_cac NUMERIC;
  increase_pct NUMERIC;
BEGIN
  SELECT AVG(cac) INTO current_cac
  FROM business_metrics
  WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
  AND cac IS NOT NULL;
  
  SELECT AVG(cac) INTO previous_cac
  FROM business_metrics
  WHERE metric_date >= CURRENT_DATE - INTERVAL '60 days'
  AND metric_date < CURRENT_DATE - INTERVAL '30 days'
  AND cac IS NOT NULL;
  
  IF current_cac IS NOT NULL AND previous_cac IS NOT NULL AND previous_cac > 0 THEN
    increase_pct := ((current_cac - previous_cac) / previous_cac) * 100;
    
    IF increase_pct > 20 THEN
      IF NOT EXISTS(
        SELECT 1 FROM smart_alerts 
        WHERE alert_type = 'cac_rising'
        AND dismissed = false
        AND created_at > NOW() - INTERVAL '14 days'
      ) THEN
        INSERT INTO smart_alerts (
          alert_type, severity, title, message, context, source, category,
          actionable, action_label, action_url, target_role
        ) VALUES (
          'cac_rising',
          'important',
          '📈 CAC en Aumento',
          format('Tu costo de adquisición subió %s%% (€%s → €%s). Revisa eficiencia de marketing.',
            ROUND(increase_pct),
            ROUND(previous_cac),
            ROUND(current_cac)
          ),
          jsonb_build_object(
            'current_cac', current_cac,
            'previous_cac', previous_cac,
            'increase_percentage', increase_pct
          ),
          'financial',
          'insight',
          true,
          'Analizar Marketing',
          '/metrics-hub',
          'admin'
        );
      END IF;
    END IF;
  END IF;
END;
$$;

-- 10. PRODUCTIVIDAD: Disponibilidad no completada
CREATE OR REPLACE FUNCTION public.check_availability_reminder()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  next_week DATE;
  hours_to_deadline NUMERIC;
BEGIN
  next_week := get_next_week_start();
  
  SELECT EXTRACT(EPOCH FROM (next_week + INTERVAL '5 days 13 hours' - NOW())) / 3600 
  INTO hours_to_deadline;
  
  IF hours_to_deadline > 0 AND hours_to_deadline <= 48 THEN
    FOR user_record IN
      SELECT u.id, u.full_name
      FROM users u
      WHERE u.role != 'admin'
      AND NOT EXISTS(
        SELECT 1 FROM user_weekly_availability uwa
        WHERE uwa.user_id = u.id
        AND uwa.week_start = next_week
        AND uwa.submitted_at IS NOT NULL
      )
    LOOP
      IF NOT EXISTS(
        SELECT 1 FROM smart_alerts 
        WHERE alert_type = 'availability_reminder'
        AND dismissed = false
        AND target_user_id = user_record.id
        AND week_group = next_week
      ) THEN
        INSERT INTO smart_alerts (
          alert_type, severity, title, message, context, source, category,
          actionable, action_label, action_url, target_user_id, week_group
        ) VALUES (
          'availability_reminder',
          CASE WHEN hours_to_deadline <= 12 THEN 'urgent' ELSE 'important' END,
          '⏰ Completa tu Disponibilidad',
          format('Quedan %s horas para el deadline. Define tu horario para la próxima semana.',
            ROUND(hours_to_deadline)
          ),
          jsonb_build_object(
            'hours_remaining', hours_to_deadline,
            'next_week_start', next_week
          ),
          'productivity',
          'reminder',
          true,
          'Completar Ahora',
          '/dashboard',
          user_record.id,
          next_week
        );
      END IF;
    END LOOP;
  END IF;
END;
$$;

-- ACTUALIZAR FUNCIÓN PRINCIPAL para incluir todas las nuevas
CREATE OR REPLACE FUNCTION public.generate_all_smart_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  alerts_before INTEGER;
  alerts_after INTEGER;
BEGIN
  SELECT COUNT(*) INTO alerts_before FROM smart_alerts WHERE dismissed = false;
  
  -- Financiero
  PERFORM check_financial_risks();
  PERFORM check_rising_cac();
  
  -- OKRs
  PERFORM check_okr_risks();
  
  -- Tareas y Productividad
  PERFORM check_urgent_tasks();
  PERFORM check_availability_reminder();
  
  -- CRM
  PERFORM check_stale_leads();
  PERFORM check_crm_daily_actions();
  PERFORM check_stagnant_opportunities();
  
  -- Métricas
  PERFORM check_stale_metrics();
  PERFORM check_performance_drop();
  
  -- Colaboración
  PERFORM check_pending_validations();
  PERFORM check_collaborative_tasks();
  
  -- Gamificación
  PERFORM check_streak_at_risk();
  PERFORM check_badge_proximity();
  
  -- Limpiar alertas expiradas
  UPDATE smart_alerts 
  SET dismissed = true, dismissed_at = NOW()
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW()
  AND dismissed = false;
  
  SELECT COUNT(*) INTO alerts_after FROM smart_alerts WHERE dismissed = false;
  
  RETURN alerts_after - alerts_before;
END;
$$;