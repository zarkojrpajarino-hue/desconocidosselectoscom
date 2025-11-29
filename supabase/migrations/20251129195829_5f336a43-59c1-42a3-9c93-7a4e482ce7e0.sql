-- Añadir campo phase a objectives
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS phase integer;

-- Actualizar objetivos existentes con fase según su título
UPDATE objectives SET phase = 1 WHERE title LIKE '%Fase 1%' OR title LIKE '%Validar%';
UPDATE objectives SET phase = 2 WHERE title LIKE '%Fase 2%' OR title LIKE '%Escalar%';
UPDATE objectives SET phase = 3 WHERE title LIKE '%Fase 3%' OR title LIKE '%Optimizar%';
UPDATE objectives SET phase = 4 WHERE title LIKE '%Fase 4%' OR title LIKE '%Expandir%';

-- Función para calcular progreso de KR basado en tareas vinculadas completadas
CREATE OR REPLACE FUNCTION calculate_kr_progress_from_tasks(kr_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
  validated_tasks integer;
  progress numeric;
BEGIN
  -- Contar total de tareas vinculadas a este KR
  SELECT COUNT(*) INTO total_tasks
  FROM okr_task_links
  WHERE key_result_id = kr_id;
  
  -- Si no hay tareas vinculadas, usar el progreso manual
  IF total_tasks = 0 THEN
    SELECT calculate_kr_progress(kr_id) INTO progress;
    RETURN progress;
  END IF;
  
  -- Contar tareas completadas y validadas
  SELECT COUNT(DISTINCT otl.task_id) INTO validated_tasks
  FROM okr_task_links otl
  INNER JOIN task_completions tc ON tc.task_id = otl.task_id
  WHERE otl.key_result_id = kr_id
    AND tc.completed_by_user = true
    AND tc.validated_by_leader = true;
  
  -- Calcular progreso basado en tareas validadas
  progress := (validated_tasks::numeric / total_tasks::numeric) * 100;
  
  RETURN ROUND(progress, 2);
END;
$$;

-- Función mejorada para calcular progreso de objetivo considerando tareas
CREATE OR REPLACE FUNCTION calculate_objective_progress_from_tasks(obj_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_weight numeric;
  weighted_progress numeric;
BEGIN
  SELECT 
    SUM(weight),
    SUM(calculate_kr_progress_from_tasks(id) * weight)
  INTO total_weight, weighted_progress
  FROM key_results
  WHERE objective_id = obj_id;
  
  IF total_weight IS NULL OR total_weight = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(weighted_progress / total_weight, 2);
END;
$$;

-- Trigger para actualizar progreso automáticamente cuando se completa una tarea vinculada
CREATE OR REPLACE FUNCTION update_okr_progress_on_task_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  kr_id uuid;
  obj_id uuid;
  new_kr_progress numeric;
  new_obj_progress numeric;
BEGIN
  -- Solo si se valida la tarea
  IF NEW.validated_by_leader = true AND (OLD.validated_by_leader = false OR OLD.validated_by_leader IS NULL) THEN
    -- Buscar todos los KRs vinculados a esta tarea
    FOR kr_id IN 
      SELECT key_result_id 
      FROM okr_task_links 
      WHERE task_id = NEW.task_id
    LOOP
      -- Calcular nuevo progreso del KR
      new_kr_progress := calculate_kr_progress_from_tasks(kr_id);
      
      -- Actualizar current_value del KR para reflejar el progreso
      UPDATE key_results
      SET current_value = start_value + ((target_value - start_value) * new_kr_progress / 100)
      WHERE id = kr_id;
      
      -- Obtener el objetivo para actualizar su progreso
      SELECT objective_id INTO obj_id
      FROM key_results
      WHERE id = kr_id;
      
      -- Actualizar estado del KR basado en progreso
      UPDATE key_results
      SET status = CASE
        WHEN new_kr_progress >= 100 THEN 'achieved'
        WHEN new_kr_progress >= 70 THEN 'on_track'
        WHEN new_kr_progress >= 40 THEN 'at_risk'
        ELSE 'behind'
      END
      WHERE id = kr_id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para actualización automática
DROP TRIGGER IF EXISTS trigger_update_okr_on_task_completion ON task_completions;
CREATE TRIGGER trigger_update_okr_on_task_completion
  AFTER INSERT OR UPDATE ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_okr_progress_on_task_completion();

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_objectives_phase ON objectives(phase);
CREATE INDEX IF NOT EXISTS idx_okr_task_links_kr ON okr_task_links(key_result_id);
CREATE INDEX IF NOT EXISTS idx_okr_task_links_task ON okr_task_links(task_id);