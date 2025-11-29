-- Solo reemplazar la función con SET search_path
CREATE OR REPLACE FUNCTION update_week_availability_status()
RETURNS TRIGGER AS $$
DECLARE
  total_users_count integer;
  ready_users_count integer;
  pending_users text[];
BEGIN
  -- Contar total de usuarios activos
  SELECT COUNT(*) INTO total_users_count
  FROM users
  WHERE role != 'admin';

  -- Contar usuarios que ya completaron disponibilidad para esta semana
  SELECT COUNT(*) INTO ready_users_count
  FROM user_weekly_availability
  WHERE week_start = NEW.week_start;

  -- Obtener lista de usuarios pendientes
  SELECT array_agg(full_name) INTO pending_users
  FROM users
  WHERE role != 'admin'
  AND id NOT IN (
    SELECT user_id 
    FROM user_weekly_availability 
    WHERE week_start = NEW.week_start
  );

  -- Actualizar o insertar en week_config
  INSERT INTO week_config (
    week_start,
    week_start_time,
    availability_deadline,
    total_users,
    ready_count,
    users_pending,
    all_users_ready
  )
  VALUES (
    NEW.week_start,
    (NEW.week_start + interval '13 hours 30 minutes'),
    (NEW.week_start + interval '5 days' + interval '13 hours'),
    total_users_count,
    ready_users_count,
    COALESCE(pending_users, '{}'),
    (ready_users_count >= total_users_count)
  )
  ON CONFLICT (week_start) 
  DO UPDATE SET
    ready_count = ready_users_count,
    users_pending = COALESCE(pending_users, '{}'),
    all_users_ready = (ready_users_count >= total_users_count),
    total_users = total_users_count;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';