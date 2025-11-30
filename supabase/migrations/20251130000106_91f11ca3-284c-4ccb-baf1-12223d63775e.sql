-- FASE 1: SEGURIDAD - Security Definer Function para validar límites de swaps
-- Evita infinite recursion en RLS policies

CREATE OR REPLACE FUNCTION public.get_user_swap_limit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mode TEXT;
BEGIN
  SELECT mode INTO v_mode
  FROM user_weekly_data
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN CASE v_mode
    WHEN 'conservador' THEN 5
    WHEN 'moderado' THEN 7
    WHEN 'agresivo' THEN 10
    ELSE 5
  END;
END;
$$;

-- Function para validar si el usuario puede hacer un swap
CREATE OR REPLACE FUNCTION public.can_user_swap(p_user_id UUID, p_week_number INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Contar swaps actuales
  SELECT COUNT(*) INTO v_count
  FROM task_swaps
  WHERE user_id = p_user_id
  AND week_number = p_week_number;
  
  -- Obtener límite
  v_limit := get_user_swap_limit(p_user_id);
  
  RETURN v_count < v_limit;
END;
$$;

-- RLS Policy para validar swaps en backend (evita bypass en cliente)
DROP POLICY IF EXISTS "Users can insert their own swaps" ON task_swaps;

CREATE POLICY "Users can insert their own swaps" ON task_swaps
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND can_user_swap(auth.uid(), week_number)
  );