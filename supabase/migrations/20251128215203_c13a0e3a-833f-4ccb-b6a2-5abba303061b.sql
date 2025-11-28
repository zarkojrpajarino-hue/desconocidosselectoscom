-- =====================================================
-- SISTEMA DE AGENDA INTELIGENTE
-- =====================================================

-- 1. TABLA DE DISPONIBILIDAD SEMANAL
CREATE TABLE IF NOT EXISTS user_weekly_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  
  -- Disponibilidad por día
  monday_available boolean DEFAULT false,
  monday_start time,
  monday_end time,
  
  tuesday_available boolean DEFAULT false,
  tuesday_start time,
  tuesday_end time,
  
  wednesday_available boolean DEFAULT false,
  wednesday_start time,
  wednesday_end time,
  
  thursday_available boolean DEFAULT false,
  thursday_start time,
  thursday_end time,
  
  friday_available boolean DEFAULT false,
  friday_start time,
  friday_end time,
  
  saturday_available boolean DEFAULT false,
  saturday_start time,
  saturday_end time,
  
  sunday_available boolean DEFAULT false,
  sunday_start time,
  sunday_end time,
  
  -- Preferencias generales
  preferred_hours_per_day int DEFAULT 4,
  preferred_time_of_day varchar(20), -- 'morning', 'afternoon', 'evening', 'flexible'
  
  -- Estado
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, week_start)
);

-- 2. TABLA DE AGENDA GENERADA (SCHEDULE)
CREATE TABLE IF NOT EXISTS task_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  
  -- Horario asignado
  scheduled_date date NOT NULL,
  scheduled_start time NOT NULL,
  scheduled_end time NOT NULL,
  
  -- Estado de aceptación
  status varchar(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rescheduling', 'locked'
  accepted_at timestamptz,
  
  -- Metadata
  is_collaborative boolean DEFAULT false,
  collaborator_user_id uuid REFERENCES users(id),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. TABLA DE CONFIGURACIÓN DE SEMANA
CREATE TABLE IF NOT EXISTS week_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL UNIQUE,
  
  -- Deadlines
  availability_deadline timestamptz NOT NULL, -- Lunes 13:00
  week_start_time timestamptz NOT NULL,       -- Miércoles 13:30
  
  -- Estado
  agendas_generated boolean DEFAULT false,
  generated_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_availability_user_week ON user_weekly_availability(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_schedule_user_week ON task_schedule(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_schedule_date ON task_schedule(scheduled_date);

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

ALTER TABLE user_weekly_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_config ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver/editar su propia disponibilidad
CREATE POLICY "Users can manage their own availability" ON user_weekly_availability
  FOR ALL USING (auth.uid() = user_id);

-- Usuarios pueden ver su propio schedule
CREATE POLICY "Users can view their own schedule" ON task_schedule
  FOR SELECT USING (auth.uid() = user_id);

-- Usuarios pueden actualizar su schedule (aceptar/cambiar)
CREATE POLICY "Users can update their own schedule" ON task_schedule
  FOR UPDATE USING (auth.uid() = user_id);

-- Todos pueden ver week_config
CREATE POLICY "Anyone can view week config" ON week_config
  FOR SELECT USING (true);

-- =====================================================
-- FUNCIÓN PARA OBTENER LA PRÓXIMA SEMANA
-- =====================================================

CREATE OR REPLACE FUNCTION get_next_week_start()
RETURNS date AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA VERIFICAR SI USUARIO COMPLETÓ DISPONIBILIDAD
-- =====================================================

CREATE OR REPLACE FUNCTION user_completed_availability(p_user_id uuid)
RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql;