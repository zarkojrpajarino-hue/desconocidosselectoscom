-- Crear tabla para registrar cambios de tareas
CREATE TABLE public.task_swaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  old_title TEXT NOT NULL,
  new_title TEXT NOT NULL,
  new_description TEXT,
  week_number INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('conservador', 'moderado', 'agresivo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.task_swaps ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own swaps"
  ON public.task_swaps
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own swaps"
  ON public.task_swaps
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all swaps"
  ON public.task_swaps
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Índices para optimizar consultas
CREATE INDEX idx_task_swaps_user_week ON public.task_swaps(user_id, week_number);
CREATE INDEX idx_task_swaps_created_at ON public.task_swaps(created_at DESC);

-- Función para contar cambios de un usuario en una semana
CREATE OR REPLACE FUNCTION public.count_user_swaps_for_week(
  p_user_id UUID,
  p_week_number INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  swap_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO swap_count
  FROM public.task_swaps
  WHERE user_id = p_user_id
    AND week_number = p_week_number;
    
  RETURN swap_count;
END;
$$;