-- ============================================
-- MIGRACIÓN: AGENDA GLOBAL MULTI-ORG
-- ============================================

-- 1. TABLA: user_global_agenda_settings
CREATE TABLE IF NOT EXISTS user_global_agenda_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_organization_ids UUID[] DEFAULT '{}',
  show_personal_tasks BOOLEAN DEFAULT true,
  show_org_tasks BOOLEAN DEFAULT true,
  default_view TEXT CHECK (default_view IN ('week', 'day', 'month')) DEFAULT 'week',
  org_color_map JSONB DEFAULT '{}',
  saved_filters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_global_agenda_user ON user_global_agenda_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_global_agenda_linked_orgs ON user_global_agenda_settings USING GIN(linked_organization_ids);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_user_global_agenda_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_global_agenda_settings ON user_global_agenda_settings;
CREATE TRIGGER trigger_update_global_agenda_settings
  BEFORE UPDATE ON user_global_agenda_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_global_agenda_settings_updated_at();

-- RLS
ALTER TABLE user_global_agenda_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own global agenda settings" ON user_global_agenda_settings;
CREATE POLICY "Users can view their own global agenda settings"
  ON user_global_agenda_settings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own global agenda settings" ON user_global_agenda_settings;
CREATE POLICY "Users can insert their own global agenda settings"
  ON user_global_agenda_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own global agenda settings" ON user_global_agenda_settings;
CREATE POLICY "Users can update their own global agenda settings"
  ON user_global_agenda_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own global agenda settings" ON user_global_agenda_settings;
CREATE POLICY "Users can delete their own global agenda settings"
  ON user_global_agenda_settings FOR DELETE USING (auth.uid() = user_id);

-- 2. COLUMNA is_personal en tasks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'is_personal'
  ) THEN
    ALTER TABLE tasks ADD COLUMN is_personal BOOLEAN DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_personal ON tasks(user_id, is_personal) WHERE is_personal = true;

-- Actualizar tareas existentes sin organización como personales
UPDATE tasks SET is_personal = true WHERE organization_id IS NULL AND is_personal = false;

-- 3. RLS para tareas personales
DROP POLICY IF EXISTS "Users can view their personal tasks" ON tasks;
CREATE POLICY "Users can view their personal tasks"
  ON tasks FOR SELECT USING (user_id = auth.uid() AND is_personal = true);

DROP POLICY IF EXISTS "Users can create personal tasks" ON tasks;
CREATE POLICY "Users can create personal tasks"
  ON tasks FOR INSERT WITH CHECK (user_id = auth.uid() AND is_personal = true AND organization_id IS NULL);

DROP POLICY IF EXISTS "Users can update their personal tasks" ON tasks;
CREATE POLICY "Users can update their personal tasks"
  ON tasks FOR UPDATE USING (user_id = auth.uid() AND is_personal = true) WITH CHECK (user_id = auth.uid() AND is_personal = true);

DROP POLICY IF EXISTS "Users can delete their personal tasks" ON tasks;
CREATE POLICY "Users can delete their personal tasks"
  ON tasks FOR DELETE USING (user_id = auth.uid() AND is_personal = true);

-- 4. FUNCIÓN: Inicializar configuración global
CREATE OR REPLACE FUNCTION initialize_global_agenda_settings(p_user_id UUID)
RETURNS user_global_agenda_settings AS $$
DECLARE
  v_org_ids UUID[];
  v_settings user_global_agenda_settings;
BEGIN
  SELECT ARRAY_AGG(organization_id) INTO v_org_ids
  FROM user_roles WHERE user_id = p_user_id;
  
  INSERT INTO user_global_agenda_settings (user_id, linked_organization_ids, show_personal_tasks, show_org_tasks)
  VALUES (p_user_id, COALESCE(v_org_ids, '{}'), true, true)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
  RETURNING * INTO v_settings;
  
  RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. FUNCIÓN: Estadísticas de agenda global
CREATE OR REPLACE FUNCTION get_global_agenda_stats(p_user_id UUID, p_week_start DATE)
RETURNS TABLE (
  total_tasks INTEGER,
  personal_tasks INTEGER,
  org_tasks INTEGER,
  completed_tasks INTEGER,
  pending_tasks INTEGER,
  collaborative_tasks INTEGER,
  total_hours NUMERIC,
  organizations_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_tasks,
    COUNT(*) FILTER (WHERE t.is_personal = true)::INTEGER as personal_tasks,
    COUNT(*) FILTER (WHERE t.is_personal = false)::INTEGER as org_tasks,
    COUNT(*) FILTER (WHERE ts.status = 'completed')::INTEGER as completed_tasks,
    COUNT(*) FILTER (WHERE ts.status = 'pending')::INTEGER as pending_tasks,
    COUNT(*) FILTER (WHERE ts.is_collaborative = true)::INTEGER as collaborative_tasks,
    COALESCE(SUM(EXTRACT(EPOCH FROM (ts.scheduled_end::time - ts.scheduled_start::time)) / 3600), 0)::NUMERIC(10,2) as total_hours,
    COUNT(DISTINCT ts.organization_id) FILTER (WHERE ts.organization_id IS NOT NULL)::INTEGER as organizations_count
  FROM task_schedule ts
  INNER JOIN tasks t ON t.id = ts.task_id
  WHERE ts.user_id = p_user_id AND ts.week_start = p_week_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. FUNCIÓN: Detectar conflictos de horario
CREATE OR REPLACE FUNCTION check_schedule_conflicts(
  p_user_id UUID,
  p_scheduled_date DATE,
  p_scheduled_start TIME,
  p_scheduled_end TIME,
  p_exclude_task_schedule_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflict_id UUID,
  conflict_task_title TEXT,
  conflict_start TIME,
  conflict_end TIME,
  conflict_organization TEXT,
  is_personal_conflict BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id as conflict_id,
    t.title as conflict_task_title,
    ts.scheduled_start as conflict_start,
    ts.scheduled_end as conflict_end,
    o.name as conflict_organization,
    t.is_personal as is_personal_conflict
  FROM task_schedule ts
  INNER JOIN tasks t ON t.id = ts.task_id
  LEFT JOIN organizations o ON o.id = ts.organization_id
  WHERE ts.user_id = p_user_id
    AND ts.scheduled_date = p_scheduled_date
    AND ts.id != COALESCE(p_exclude_task_schedule_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (p_scheduled_start >= ts.scheduled_start AND p_scheduled_start < ts.scheduled_end)
      OR (p_scheduled_end > ts.scheduled_start AND p_scheduled_end <= ts.scheduled_end)
      OR (p_scheduled_start <= ts.scheduled_start AND p_scheduled_end >= ts.scheduled_end)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Índices adicionales para performance
CREATE INDEX IF NOT EXISTS idx_task_schedule_user_week ON task_schedule(user_id, week_start, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_task_schedule_collaborative ON task_schedule(user_id, is_collaborative) WHERE is_collaborative = true;
CREATE INDEX IF NOT EXISTS idx_task_schedule_date_range ON task_schedule(user_id, scheduled_date, scheduled_start);

-- 8. Inicializar configuración para usuarios existentes
INSERT INTO user_global_agenda_settings (user_id, linked_organization_ids)
SELECT u.id, COALESCE(ARRAY_AGG(ur.organization_id), '{}')
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE NOT EXISTS (SELECT 1 FROM user_global_agenda_settings WHERE user_id = u.id)
GROUP BY u.id
ON CONFLICT (user_id) DO NOTHING;