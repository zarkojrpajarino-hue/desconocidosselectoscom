-- =====================================================
-- MIGRACIÓN: Triggers de Notificaciones
-- Solo agrega triggers (tabla notifications ya existe)
-- =====================================================

-- =====================================================
-- FUNCIÓN: Notificar cuando se asigna una tarea
-- =====================================================
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  assigner_name text;
  task_title text;
  task_org_id uuid;
BEGIN
  -- Solo notificar si es una nueva asignación
  IF (TG_OP = 'UPDATE' AND OLD.user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  -- No notificar si no hay usuario asignado
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener nombre del asignador
  SELECT full_name INTO assigner_name
  FROM users
  WHERE id = auth.uid()
  LIMIT 1;

  -- Obtener título de la tarea y organización
  SELECT title, organization_id INTO task_title, task_org_id
  FROM tasks
  WHERE id = NEW.id
  LIMIT 1;

  -- No notificar si el asignador es el mismo que el asignado
  IF auth.uid() = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Crear notificación
  INSERT INTO notifications (
    organization_id,
    user_id,
    type,
    title,
    message,
    related_id
  ) VALUES (
    task_org_id,
    NEW.user_id,
    'task_assigned',
    'Nueva tarea asignada',
    COALESCE(assigner_name, 'Alguien') || ' te ha asignado: ' || COALESCE(task_title, 'Nueva tarea'),
    NEW.id
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación task_assigned: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- FUNCIÓN: Notificar cuando se completa una tarea
-- =====================================================
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  completer_name text;
  task_title text;
  task_org_id uuid;
  task_leader_id uuid;
BEGIN
  -- Solo cuando se marca como completada
  IF NEW.completed_by_user = true AND (OLD.completed_by_user IS NULL OR OLD.completed_by_user = false) THEN
    
    -- Obtener nombre del completador
    SELECT full_name INTO completer_name
    FROM users
    WHERE id = NEW.user_id
    LIMIT 1;

    -- Obtener datos de la tarea
    SELECT t.title, t.organization_id, t.leader_id 
    INTO task_title, task_org_id, task_leader_id
    FROM tasks t
    WHERE t.id = NEW.task_id
    LIMIT 1;

    -- Notificar al líder si existe y es diferente al completador
    IF task_leader_id IS NOT NULL AND task_leader_id != NEW.user_id THEN
      INSERT INTO notifications (
        organization_id,
        user_id,
        type,
        title,
        message,
        related_id
      ) VALUES (
        task_org_id,
        task_leader_id,
        'task_completed',
        'Tarea completada',
        COALESCE(completer_name, 'Alguien') || ' ha completado: ' || COALESCE(task_title, 'una tarea'),
        NEW.task_id
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación task_completed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para asignación de tareas (en task_schedule)
DROP TRIGGER IF EXISTS trigger_notify_task_assigned ON task_schedule;
CREATE TRIGGER trigger_notify_task_assigned
AFTER INSERT OR UPDATE OF user_id ON task_schedule
FOR EACH ROW
EXECUTE FUNCTION notify_task_assigned();

-- Trigger para tareas completadas
DROP TRIGGER IF EXISTS trigger_notify_task_completed ON task_completions;
CREATE TRIGGER trigger_notify_task_completed
AFTER INSERT OR UPDATE OF completed_by_user ON task_completions
FOR EACH ROW
EXECUTE FUNCTION notify_task_completed();

-- =====================================================
-- FUNCIONES HELPER
-- =====================================================

-- Marcar notificación como leída
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = true, updated_at = NOW()
  WHERE id = notification_id
  AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Marcar todas como leídas para el usuario actual
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = true, updated_at = NOW()
  WHERE user_id = auth.uid()
  AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Obtener conteo de no leídas
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS integer AS $$
DECLARE
  count_result integer;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM notifications
  WHERE user_id = auth.uid()
  AND read = false;
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;