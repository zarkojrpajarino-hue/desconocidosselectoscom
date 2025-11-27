-- Añadir campos para sistema de completado al 50%
ALTER TABLE public.task_completions 
ADD COLUMN IF NOT EXISTS completed_by_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_insights JSONB DEFAULT NULL;

-- Actualizar registros existentes
UPDATE public.task_completions 
SET completed_by_user = true 
WHERE completed_at IS NOT NULL;

COMMENT ON COLUMN public.task_completions.completed_by_user IS 'Indica si el usuario/colaborador ha marcado la tarea como completada';
COMMENT ON COLUMN public.task_completions.user_insights IS 'Insights y evidencias del usuario al completar la tarea';
COMMENT ON COLUMN public.task_completions.validated_by_leader IS 'Indica si el líder ha validado la tarea (100% completada)';
COMMENT ON COLUMN public.task_completions.leader_evaluation IS 'Feedback del colaborador al líder en tareas compartidas';