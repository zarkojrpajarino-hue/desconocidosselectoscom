
-- Eliminar triggers con nombres exactos
DROP TRIGGER IF EXISTS on_task_evaluated_send_notification ON task_completions;
DROP TRIGGER IF EXISTS on_task_swapped_send_confirmation ON task_swaps;

-- Ahora eliminar las funciones (sin CASCADE para evitar el trigger de welcome que se mantiene)
DROP FUNCTION IF EXISTS send_evaluation_notification_trigger() CASCADE;
DROP FUNCTION IF EXISTS send_swap_confirmation_trigger() CASCADE;
DROP FUNCTION IF EXISTS send_leader_feedback_notification_trigger() CASCADE;
DROP FUNCTION IF EXISTS send_celebration_notification_trigger() CASCADE;

-- Eliminar tabla notifications antigua
DROP TABLE IF EXISTS notifications CASCADE;

-- Crear índices para optimizar smart_alerts
CREATE INDEX IF NOT EXISTS idx_smart_alerts_target_user ON smart_alerts(target_user_id) WHERE dismissed = false;
CREATE INDEX IF NOT EXISTS idx_smart_alerts_severity ON smart_alerts(severity) WHERE dismissed = false;
CREATE INDEX IF NOT EXISTS idx_smart_alerts_created_at ON smart_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_alerts_week_group ON smart_alerts(week_group) WHERE dismissed = false;
