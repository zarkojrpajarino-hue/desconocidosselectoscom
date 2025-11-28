-- Añadir campo para el comentario/razón del líder al cambiar una tarea
ALTER TABLE public.task_swaps 
ADD COLUMN leader_comment TEXT;