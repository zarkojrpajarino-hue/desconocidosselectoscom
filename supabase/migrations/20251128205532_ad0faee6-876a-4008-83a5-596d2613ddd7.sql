-- Agregar columna impact_measurement a task_completions
ALTER TABLE public.task_completions
ADD COLUMN IF NOT EXISTS impact_measurement jsonb;

-- Agregar columna ai_questions a task_completions  
ALTER TABLE public.task_completions
ADD COLUMN IF NOT EXISTS ai_questions jsonb;

-- Agregar columna leader_feedback a task_completions
ALTER TABLE public.task_completions
ADD COLUMN IF NOT EXISTS leader_feedback jsonb;