-- ============================================
-- SCHEMA: SISTEMA DE ALERTAS INTELIGENTES
-- Sustituye completamente el sistema de notificaciones actual
-- ============================================

-- TABLA: smart_alerts (Alertas generadas automáticamente)
CREATE TABLE IF NOT EXISTS smart_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de alerta (UNIFICA todos los tipos anteriores)
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    -- Alertas financieras
    'financial_risk', 'financial_opportunity', 'burn_rate_high', 'margin_low', 'runway_short',
    -- Alertas de OKRs
    'okr_at_risk', 'okr_achieved', 'okr_behind',
    -- Alertas de tareas (sustituye notificaciones actuales)
    'task_completed', 'task_validated', 'task_urgent', 'task_changed', 'task_swapped',
    'feedback_received', 'insights_pending', 'validation_pending',
    -- Alertas de equipo
    'burnout_prediction', 'team_overload', 'week_summary',
    -- Alertas de negocio
    'business_opportunity', 'sales_opportunity', 'marketing_roi_high',
    -- Alertas IA
    'ai_recommendation', 'ai_prediction'
  )),
  
  -- Severidad (determina si envía email o solo in-app)
  severity TEXT NOT NULL CHECK (severity IN ('urgent', 'important', 'opportunity', 'celebration', 'info')),
  
  -- Contenido
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB, -- Datos adicionales estructurados
  
  -- Metadata
  source TEXT NOT NULL, -- 'financial', 'okrs', 'tasks', 'ai_analysis', 'marketing', 'system'
  category TEXT, -- Para agrupar en dashboard
  
  -- Acciones
  actionable BOOLEAN DEFAULT false,
  action_label TEXT,
  action_url TEXT,
  
  -- Targeting
  target_user_id UUID REFERENCES users(id), -- Alerta personal
  target_role TEXT, -- Si es para un rol específico: 'admin', 'leader', 'member'
  
  -- Estado
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES users(id),
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  
  -- Email (SOLO para alertas críticas)
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  
  -- Temporalidad
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Auto-dismiss después de esta fecha
  
  -- Agrupación (para resumen semanal)
  week_group DATE, -- Semana a la que pertenece
  included_in_summary BOOLEAN DEFAULT false
);

-- TABLA: alert_actions (Acciones tomadas sobre alertas)
CREATE TABLE IF NOT EXISTS alert_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES smart_alerts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'viewed', 'dismissed', 'action_taken', 'snoozed'
  user_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: alert_rules (Reglas para generación automática)
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'threshold', 'trend', 'prediction', 'anomaly'
  source_table TEXT NOT NULL,
  condition JSONB NOT NULL, -- Condición a evaluar
  alert_template JSONB NOT NULL, -- Template de alerta a generar
  enabled BOOLEAN DEFAULT true,
  check_frequency TEXT DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily', 'weekly'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES para optimización
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON smart_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON smart_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_dismissed ON smart_alerts(dismissed);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON smart_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_target_user ON smart_alerts(target_user_id);
CREATE INDEX IF NOT EXISTS idx_alert_actions_alert ON alert_actions(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_actions_user ON alert_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled);

-- FUNCIÓN: Crear alerta de riesgo financiero
CREATE OR REPLACE FUNCTION check_financial_risks()
RETURNS VOID AS $$
DECLARE
  latest_metrics RECORD;
  alert_exists BOOLEAN;
BEGIN
  SELECT * INTO latest_metrics
  FROM financial_metrics
  ORDER BY month DESC
  LIMIT 1;
  
  IF latest_metrics IS NULL THEN
    RETURN;
  END IF;
  
  -- ALERTA 1: Margen muy bajo (<5%)
  IF latest_metrics.margin_percentage < 5 THEN
    SELECT EXISTS(
      SELECT 1 FROM smart_alerts 
      WHERE alert_type = 'margin_low' 
      AND dismissed = false
      AND created_at > NOW() - INTERVAL '7 days'
    ) INTO alert_exists;
    
    IF NOT alert_exists THEN
      INSERT INTO smart_alerts (
        alert_type, severity, title, message, context, source, category,
        actionable, action_label, action_url, target_role, email_sent
      ) VALUES (
        'margin_low',
        'urgent',
        '🔴 Margen Crítico Detectado',
        format('Tu margen neto es solo %s%% (€%s). Riesgo financiero alto. Se requiere acción inmediata.', 
          ROUND(latest_metrics.margin_percentage, 1),
          ROUND(latest_metrics.gross_margin)
        ),
        jsonb_build_object(
          'margin_percentage', latest_metrics.margin_percentage,
          'gross_margin', latest_metrics.gross_margin,
          'month', latest_metrics.month
        ),
        'financial',
        'risk',
        true,
        'Ver Recomendaciones',
        '/financial',
        'admin',
        true
      );
    END IF;
  END IF;
  
  -- ALERTA 2: Burn rate alto (>90% ingresos)
  IF latest_metrics.total_revenue > 0 AND 
     (latest_metrics.total_expenses / latest_metrics.total_revenue) > 0.9 THEN
    
    SELECT EXISTS(
      SELECT 1 FROM smart_alerts 
      WHERE alert_type = 'burn_rate_high' 
      AND dismissed = false
      AND created_at > NOW() - INTERVAL '7 days'
    ) INTO alert_exists;
    
    IF NOT alert_exists THEN
      INSERT INTO smart_alerts (
        alert_type, severity, title, message, context, source, category,
        actionable, action_label, action_url, target_role, email_sent
      ) VALUES (
        'burn_rate_high',
        'urgent',
        '⚠️ Burn Rate Alto',
        format('Gastos al %s%% de ingresos. Runway: %s meses. Optimizar gastos urgentemente.', 
          ROUND((latest_metrics.total_expenses / latest_metrics.total_revenue) * 100),
          ROUND(latest_metrics.runway_months, 1)
        ),
        jsonb_build_object(
          'burn_rate_percentage', (latest_metrics.total_expenses / latest_metrics.total_revenue) * 100,
          'runway_months', latest_metrics.runway_months,
          'total_expenses', latest_metrics.total_expenses
        ),
        'financial',
        'risk',
        true,
        'Analizar Gastos',
        '/financial',
        'admin',
        true
      );
    END IF;
  END IF;
  
  -- ALERTA 3: Runway corto (<6 meses)
  IF latest_metrics.runway_months IS NOT NULL AND latest_metrics.runway_months < 6 THEN
    SELECT EXISTS(
      SELECT 1 FROM smart_alerts 
      WHERE alert_type = 'runway_short' 
      AND dismissed = false
      AND created_at > NOW() - INTERVAL '14 days'
    ) INTO alert_exists;
    
    IF NOT alert_exists THEN
      INSERT INTO smart_alerts (
        alert_type, severity, title, message, context, source, category,
        actionable, action_label, action_url, target_role
      ) VALUES (
        'runway_short',
        'important',
        '⏰ Runway Corto',
        format('Solo %s meses de runway restantes. Planificar estrategia de financiación o reducción de costos.', 
          ROUND(latest_metrics.runway_months, 1)
        ),
        jsonb_build_object(
          'runway_months', latest_metrics.runway_months,
          'burn_rate', latest_metrics.burn_rate
        ),
        'financial',
        'risk',
        true,
        'Ver Plan de Acción',
        '/financial',
        'admin'
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- FUNCIÓN: Detectar OKRs en riesgo
CREATE OR REPLACE FUNCTION check_okr_risks()
RETURNS VOID AS $$
DECLARE
  okr_record RECORD;
  alert_exists BOOLEAN;
  days_remaining INTEGER;
  expected_progress NUMERIC;
BEGIN
  FOR okr_record IN 
    SELECT 
      o.id,
      o.title,
      o.target_date,
      o.owner_user_id,
      calculate_objective_progress(o.id) as current_progress
    FROM objectives o
    WHERE o.status = 'active'
  LOOP
    -- Calcular días restantes (la resta de dos fechas da un entero directamente)
    days_remaining := okr_record.target_date - CURRENT_DATE;
    expected_progress := 100 - ((days_remaining::NUMERIC / 90) * 100);
    
    IF okr_record.current_progress < (expected_progress - 20) AND days_remaining > 0 THEN
      SELECT EXISTS(
        SELECT 1 FROM smart_alerts 
        WHERE alert_type = 'okr_at_risk' 
        AND dismissed = false
        AND context->>'objective_id' = okr_record.id::TEXT
        AND created_at > NOW() - INTERVAL '7 days'
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO smart_alerts (
          alert_type, severity, title, message, context, source, category,
          actionable, action_label, action_url, target_user_id
        ) VALUES (
          'okr_at_risk',
          'important',
          format('🎯 OKR en Riesgo: %s', okr_record.title),
          format('Progreso actual: %s%%. Esperado: %s%%. Quedan %s días. Acelerar ejecución.',
            ROUND(okr_record.current_progress),
            ROUND(expected_progress),
            days_remaining
          ),
          jsonb_build_object(
            'objective_id', okr_record.id,
            'current_progress', okr_record.current_progress,
            'expected_progress', expected_progress,
            'days_remaining', days_remaining
          ),
          'okrs',
          'risk',
          true,
          'Ver OKR',
          '/okrs',
          okr_record.owner_user_id
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- FUNCIÓN: Detectar tareas urgentes
CREATE OR REPLACE FUNCTION check_urgent_tasks()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  pending_count INTEGER;
  hours_remaining NUMERIC;
BEGIN
  FOR user_record IN
    SELECT 
      u.id,
      u.full_name,
      uwd.week_start::DATE as week_start_date,
      uwd.task_limit as tasks_this_week,
      COALESCE((
        SELECT COUNT(*) 
        FROM task_schedule ts
        JOIN tasks t ON t.id = ts.task_id
        JOIN task_completions tc ON tc.task_id = t.id
        WHERE ts.user_id = u.id 
        AND ts.week_start = uwd.week_start::DATE
        AND tc.validated_by_leader = true
      ), 0) as completed_this_week,
      uwd.task_limit - COALESCE((
        SELECT COUNT(*) 
        FROM task_schedule ts
        JOIN tasks t ON t.id = ts.task_id
        JOIN task_completions tc ON tc.task_id = t.id
        WHERE ts.user_id = u.id 
        AND ts.week_start = uwd.week_start::DATE
        AND tc.validated_by_leader = true
      ), 0) as pending_this_week
    FROM users u
    JOIN user_weekly_data uwd ON uwd.user_id = u.id
    WHERE uwd.week_start::DATE = DATE_TRUNC('week', CURRENT_DATE)::DATE
  LOOP
    pending_count := user_record.pending_this_week;
    hours_remaining := EXTRACT(EPOCH FROM (user_record.week_start_date + INTERVAL '7 days' - NOW())) / 3600;
    
    IF hours_remaining < 24 AND hours_remaining > 0 AND 
       user_record.tasks_this_week > 0 AND
       pending_count::NUMERIC / user_record.tasks_this_week > 0.5 THEN
      
      IF NOT EXISTS(
        SELECT 1 FROM smart_alerts 
        WHERE alert_type = 'task_urgent'
        AND target_user_id = user_record.id
        AND week_group = user_record.week_start_date
      ) THEN
        INSERT INTO smart_alerts (
          alert_type, severity, title, message, context, source, category,
          actionable, action_label, action_url, target_user_id, week_group, email_sent
        ) VALUES (
          'task_urgent',
          'urgent',
          format('🚨 URGENTE: Quedan %s horas', ROUND(hours_remaining)),
          format('Tienes %s tareas pendientes (%s%%). Prioriza las 3 más importantes.',
            pending_count,
            ROUND((pending_count::NUMERIC / user_record.tasks_this_week) * 100)
          ),
          jsonb_build_object(
            'hours_remaining', hours_remaining,
            'pending_count', pending_count,
            'total_tasks', user_record.tasks_this_week,
            'percentage_pending', (pending_count::NUMERIC / user_record.tasks_this_week) * 100
          ),
          'tasks',
          'urgent',
          true,
          'Ver Tareas',
          '/dashboard',
          user_record.id,
          user_record.week_start_date,
          true
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- FUNCIÓN PRINCIPAL: Generar todas las alertas
CREATE OR REPLACE FUNCTION generate_all_smart_alerts()
RETURNS INTEGER AS $$
DECLARE
  alerts_before INTEGER;
  alerts_after INTEGER;
BEGIN
  SELECT COUNT(*) INTO alerts_before FROM smart_alerts WHERE dismissed = false;
  
  PERFORM check_financial_risks();
  PERFORM check_okr_risks();
  PERFORM check_urgent_tasks();
  
  UPDATE smart_alerts 
  SET dismissed = true, dismissed_at = NOW()
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW()
  AND dismissed = false;
  
  SELECT COUNT(*) INTO alerts_after FROM smart_alerts WHERE dismissed = false;
  
  RETURN alerts_after - alerts_before;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Políticas de seguridad (RLS)
ALTER TABLE smart_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant alerts"
  ON smart_alerts FOR SELECT
  USING (target_user_id IS NULL OR target_user_id = auth.uid());

CREATE POLICY "Users can update their alerts"
  ON smart_alerts FOR UPDATE
  USING (target_user_id IS NULL OR target_user_id = auth.uid());

CREATE POLICY "Users can log alert actions"
  ON alert_actions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their actions"
  ON alert_actions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage alert rules"
  ON alert_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE smart_alerts;

SELECT generate_all_smart_alerts();

COMMENT ON TABLE smart_alerts IS 'Sistema de alertas inteligentes - reemplaza notificaciones por email';
COMMENT ON FUNCTION generate_all_smart_alerts() IS 'Genera todas las alertas - ejecutar cada hora via cron';