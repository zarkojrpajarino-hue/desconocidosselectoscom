-- =====================================================
-- GOOGLE CALENDAR INTEGRATION
-- =====================================================

-- Tabla para guardar tokens de Google OAuth
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  calendar_id text, -- ID del calendario principal del usuario
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla para mapear tareas con eventos de Google Calendar
CREATE TABLE IF NOT EXISTS calendar_event_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_schedule_id uuid REFERENCES task_schedule(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  google_event_id text NOT NULL,
  calendar_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_schedule_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_calendar_tokens_user ON google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_mappings_schedule ON calendar_event_mappings(task_schedule_id);

-- RLS
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar tokens" ON google_calendar_tokens
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own calendar mappings" ON calendar_event_mappings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy adicional para que el sistema pueda insertar mappings
CREATE POLICY "System can insert calendar mappings" ON calendar_event_mappings
  FOR INSERT WITH CHECK (true);