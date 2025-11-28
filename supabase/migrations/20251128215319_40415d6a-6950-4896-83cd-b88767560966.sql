-- Corregir search_path en funciones creadas

CREATE OR REPLACE FUNCTION get_next_week_start()
RETURNS date 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today date := CURRENT_DATE;
  next_wednesday date;
BEGIN
  -- Encontrar el próximo miércoles
  next_wednesday := today + ((3 - EXTRACT(DOW FROM today)::int + 7) % 7);
  
  -- Si hoy es miércoles y ya pasó la 13:30, usar el siguiente miércoles
  IF EXTRACT(DOW FROM today) = 3 AND CURRENT_TIME > '13:30:00' THEN
    next_wednesday := next_wednesday + 7;
  END IF;
  
  RETURN next_wednesday;
END;
$$;

CREATE OR REPLACE FUNCTION user_completed_availability(p_user_id uuid)
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_week date;
  has_availability boolean;
BEGIN
  next_week := get_next_week_start();
  
  SELECT EXISTS (
    SELECT 1 FROM user_weekly_availability
    WHERE user_id = p_user_id
    AND week_start = next_week
    AND submitted_at IS NOT NULL
  ) INTO has_availability;
  
  RETURN has_availability;
END;
$$;