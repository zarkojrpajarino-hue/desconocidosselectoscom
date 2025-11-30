-- FASE MEJORA 4: Índices de optimización para queries más rápidas

-- Índice para tasks por user_id y phase (usado en useTasks hook)
CREATE INDEX IF NOT EXISTS idx_tasks_user_phase ON tasks(user_id, phase);

-- Índice para task_completions por user_id y validated_by_leader (usado en stats y validaciones)
CREATE INDEX IF NOT EXISTS idx_task_completions_user_validated ON task_completions(user_id, validated_by_leader);

-- Índice para smart_alerts por user_id, severity y dismissed (usado en NotificationBell)
CREATE INDEX IF NOT EXISTS idx_alerts_user_severity_dismissed ON smart_alerts(target_user_id, severity, dismissed) WHERE dismissed = false;

-- Índice para task_schedule por user_id y week_start (usado en WeeklyAgenda)
CREATE INDEX IF NOT EXISTS idx_task_schedule_user_week ON task_schedule(user_id, week_start);

-- Índice compuesto para business_metrics (usado en BusinessMetricsDashboard)
CREATE INDEX IF NOT EXISTS idx_business_metrics_user_date ON business_metrics(user_id, metric_date DESC);

COMMENT ON INDEX idx_tasks_user_phase IS 'Optimiza queries de tareas por usuario y fase en useTasks hook';
COMMENT ON INDEX idx_task_completions_user_validated IS 'Optimiza queries de completaciones validadas para stats';
COMMENT ON INDEX idx_alerts_user_severity_dismissed IS 'Optimiza queries de alertas activas por usuario';
COMMENT ON INDEX idx_task_schedule_user_week IS 'Optimiza queries de agenda semanal';
COMMENT ON INDEX idx_business_metrics_user_date IS 'Optimiza queries de métricas de negocio por fecha';