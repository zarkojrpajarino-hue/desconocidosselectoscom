-- Add collaborator_feedback field to task_completions
-- This will store feedback that leaders give to collaborators
ALTER TABLE public.task_completions 
ADD COLUMN IF NOT EXISTS collaborator_feedback jsonb;