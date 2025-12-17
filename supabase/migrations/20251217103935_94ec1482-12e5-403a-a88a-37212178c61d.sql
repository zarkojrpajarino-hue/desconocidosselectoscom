-- Función que se invoca cuando una tarea se completa
-- Verifica si todas las tareas de la fase están completadas
CREATE OR REPLACE FUNCTION public.check_phase_completion_on_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_phase_number INTEGER;
  v_total_tasks INTEGER;
  v_completed_tasks INTEGER;
  v_progress INTEGER;
BEGIN
  -- Solo procesar si se marcó como completada
  IF NEW.completed_by_user = true AND (OLD.completed_by_user = false OR OLD.completed_by_user IS NULL) THEN
    
    -- Obtener organización y fase de la tarea
    SELECT t.organization_id, t.phase INTO v_org_id, v_phase_number
    FROM tasks t
    WHERE t.id = NEW.task_id;
    
    IF v_org_id IS NULL OR v_phase_number IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Contar total de tareas en la fase para usuarios de la org
    SELECT COUNT(*) INTO v_total_tasks
    FROM tasks t
    JOIN user_roles ur ON ur.user_id = t.user_id AND ur.organization_id = v_org_id
    WHERE t.organization_id = v_org_id
    AND t.phase = v_phase_number;
    
    -- Contar tareas completadas
    SELECT COUNT(DISTINCT tc.task_id) INTO v_completed_tasks
    FROM task_completions tc
    JOIN tasks t ON t.id = tc.task_id
    WHERE t.organization_id = v_org_id
    AND t.phase = v_phase_number
    AND tc.completed_by_user = true;
    
    -- Calcular progreso
    IF v_total_tasks > 0 THEN
      v_progress := ROUND((v_completed_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100);
      
      -- Actualizar progreso de la fase
      UPDATE business_phases
      SET progress_percentage = v_progress
      WHERE organization_id = v_org_id
      AND phase_number = v_phase_number
      AND status = 'active';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger en task_completions
DROP TRIGGER IF EXISTS trigger_check_phase_completion ON task_completions;
CREATE TRIGGER trigger_check_phase_completion
  AFTER INSERT OR UPDATE ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION check_phase_completion_on_task();

-- Comentario explicativo
COMMENT ON FUNCTION check_phase_completion_on_task IS 'Actualiza el progreso de la fase cuando una tarea se completa';