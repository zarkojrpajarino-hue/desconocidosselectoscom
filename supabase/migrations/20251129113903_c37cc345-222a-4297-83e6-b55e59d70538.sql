-- Agregar campos para tracking de disponibilidad completa
ALTER TABLE week_config 
ADD COLUMN IF NOT EXISTS all_users_ready boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS users_pending text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ready_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_users integer DEFAULT 0;

-- Crear tabla para preview de agenda y sugerencias de cambios
CREATE TABLE IF NOT EXISTS weekly_schedule_preview (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  week_start date NOT NULL,
  preview_data jsonb NOT NULL,
  submitted_at timestamp with time zone DEFAULT now(),
  can_suggest_changes boolean DEFAULT true,
  priority_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- RLS para preview
ALTER TABLE weekly_schedule_preview ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preview"
ON weekly_schedule_preview FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preview"
ON weekly_schedule_preview FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preview"
ON weekly_schedule_preview FOR UPDATE
USING (auth.uid() = user_id);

-- Tabla para sugerencias de cambios en preview
CREATE TABLE IF NOT EXISTS schedule_change_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  week_start date NOT NULL,
  task_id uuid REFERENCES tasks(id) NOT NULL,
  suggested_date date NOT NULL,
  suggested_start time NOT NULL,
  suggested_end time NOT NULL,
  reason text,
  status text DEFAULT 'pending',
  priority_score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone
);

-- RLS para sugerencias
ALTER TABLE schedule_change_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own suggestions"
ON schedule_change_suggestions FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "System can view all suggestions"
ON schedule_change_suggestions FOR SELECT
USING (true);

-- Función para actualizar estado de week_config cuando usuario completa disponibilidad
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar estado cuando se inserta/actualiza disponibilidad
DROP TRIGGER IF EXISTS trigger_update_week_status ON user_weekly_availability;
CREATE TRIGGER trigger_update_week_status
AFTER INSERT OR UPDATE ON user_weekly_availability
FOR EACH ROW
EXECUTE FUNCTION update_week_availability_status();

-- Agregar índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_preview_week ON weekly_schedule_preview(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_preview_user ON weekly_schedule_preview(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_schedule_suggestions_week ON schedule_change_suggestions(week_start);
CREATE INDEX IF NOT EXISTS idx_schedule_suggestions_status ON schedule_change_suggestions(status);