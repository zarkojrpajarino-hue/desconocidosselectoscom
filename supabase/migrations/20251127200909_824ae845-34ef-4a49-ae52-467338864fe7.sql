-- Trigger para enviar notificación cuando líder da feedback a colaboradores
CREATE OR REPLACE FUNCTION public.send_leader_feedback_notification_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo si se añade feedback de líder a colaboradores
  IF (NEW.collaborator_feedback IS NOT NULL AND (OLD.collaborator_feedback IS NULL OR NEW.collaborator_feedback != OLD.collaborator_feedback)) THEN
    PERFORM net.http_post(
      url := 'https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/send-leader-feedback-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc3J6ZnF0empyeHJ2cXl5cGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTc4MjcsImV4cCI6MjA3OTgzMzgyN30.EZrcIJZypke_7D1_355zMbWgG9FR8JygdXQ1L5X0EcE'
      ),
      body := jsonb_build_object(
        'collaboratorId', NEW.user_id,
        'taskId', NEW.task_id,
        'leaderId', (SELECT leader_id FROM tasks WHERE id = NEW.task_id),
        'completionId', NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para enviar email de celebración cuando tarea se completa al 100%
CREATE OR REPLACE FUNCTION public.send_celebration_notification_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo cuando se marca como validada por líder y hay tarea compartida
  IF (NEW.validated_by_leader = true AND OLD.validated_by_leader = false) THEN
    DECLARE
      task_leader_id uuid;
    BEGIN
      SELECT leader_id INTO task_leader_id FROM tasks WHERE id = NEW.task_id;
      
      -- Solo enviar si es tarea compartida (tiene líder)
      IF task_leader_id IS NOT NULL THEN
        PERFORM net.http_post(
          url := 'https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/send-task-completed-celebration',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc3J6ZnF0empyeHJ2cXl5cGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTc4MjcsImV4cCI6MjA3OTgzMzgyN30.EZrcIJZypke_7D1_355zMbWgG9FR8JygdXQ1L5X0EcE'
          ),
          body := jsonb_build_object(
            'collaboratorId', NEW.user_id,
            'taskId', NEW.task_id,
            'leaderId', task_leader_id,
            'completionId', NEW.id
          )
        );
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- Crear triggers
DROP TRIGGER IF EXISTS on_leader_feedback_added ON task_completions;
CREATE TRIGGER on_leader_feedback_added
  AFTER UPDATE ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION send_leader_feedback_notification_trigger();

DROP TRIGGER IF EXISTS on_task_celebration ON task_completions;
CREATE TRIGGER on_task_celebration
  AFTER UPDATE ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION send_celebration_notification_trigger();