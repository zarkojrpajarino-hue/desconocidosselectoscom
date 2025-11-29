-- ============================================
-- SCHEMA: SISTEMA DE OKRs - CORREGIDO
-- ============================================

-- FUNCIÓN: Actualizar updated_at (necesaria para los triggers)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TABLA: objectives (Objetivos)
CREATE TABLE IF NOT EXISTS objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  quarter TEXT NOT NULL,
  year INTEGER NOT NULL,
  owner_user_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active',
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- TABLA: key_results (Resultados Clave)
CREATE TABLE IF NOT EXISTS key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  metric_type TEXT NOT NULL,
  start_value NUMERIC DEFAULT 0,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  status TEXT NOT NULL DEFAULT 'on_track',
  weight NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: okr_updates (Actualizaciones de progreso)
CREATE TABLE IF NOT EXISTS okr_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
  previous_value NUMERIC,
  new_value NUMERIC NOT NULL,
  comment TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: okr_task_links (Vinculación de tareas con Key Results)
CREATE TABLE IF NOT EXISTS okr_task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  contribution_weight NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key_result_id, task_id)
);

-- ÍNDICES para optimización
CREATE INDEX IF NOT EXISTS idx_objectives_quarter ON objectives(quarter, year);
CREATE INDEX IF NOT EXISTS idx_objectives_status ON objectives(status);
CREATE INDEX IF NOT EXISTS idx_objectives_owner ON objectives(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_key_results_objective ON key_results(objective_id);
CREATE INDEX IF NOT EXISTS idx_key_results_status ON key_results(status);
CREATE INDEX IF NOT EXISTS idx_okr_updates_kr ON okr_updates(key_result_id);
CREATE INDEX IF NOT EXISTS idx_okr_task_links_kr ON okr_task_links(key_result_id);
CREATE INDEX IF NOT EXISTS idx_okr_task_links_task ON okr_task_links(task_id);

-- FUNCIÓN: Calcular progreso de un Key Result
CREATE OR REPLACE FUNCTION calculate_kr_progress(kr_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  kr_record RECORD;
  progress NUMERIC;
BEGIN
  SELECT start_value, target_value, current_value 
  INTO kr_record
  FROM key_results 
  WHERE id = kr_id;
  
  IF kr_record.target_value = kr_record.start_value THEN
    RETURN 0;
  END IF;
  
  progress := ((kr_record.current_value - kr_record.start_value) / 
               (kr_record.target_value - kr_record.start_value)) * 100;
  
  progress := GREATEST(0, LEAST(100, progress));
  
  RETURN ROUND(progress, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- FUNCIÓN: Calcular progreso de un Objetivo
CREATE OR REPLACE FUNCTION calculate_objective_progress(obj_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_weight NUMERIC;
  weighted_progress NUMERIC;
BEGIN
  SELECT 
    SUM(weight),
    SUM(calculate_kr_progress(id) * weight)
  INTO total_weight, weighted_progress
  FROM key_results
  WHERE objective_id = obj_id;
  
  IF total_weight IS NULL OR total_weight = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(weighted_progress / total_weight, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- FUNCIÓN: Actualizar estado de KR
CREATE OR REPLACE FUNCTION update_kr_status()
RETURNS TRIGGER AS $$
DECLARE
  progress NUMERIC;
  expected_progress NUMERIC;
BEGIN
  progress := calculate_kr_progress(NEW.id);
  
  SELECT 
    CASE 
      WHEN o.target_date <= CURRENT_DATE THEN 100
      WHEN o.created_at >= CURRENT_DATE THEN 0
      ELSE ((EXTRACT(DAY FROM (CURRENT_DATE - o.created_at)) / 
             EXTRACT(DAY FROM (o.target_date - o.created_at))) * 100)
    END
  INTO expected_progress
  FROM objectives o
  JOIN key_results kr ON kr.objective_id = o.id
  WHERE kr.id = NEW.id;
  
  IF progress >= 100 THEN
    NEW.status := 'achieved';
  ELSIF progress >= expected_progress * 0.9 THEN
    NEW.status := 'on_track';
  ELSIF progress >= expected_progress * 0.7 THEN
    NEW.status := 'at_risk';
  ELSE
    NEW.status := 'behind';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- TRIGGER: Actualizar estado cuando cambia current_value
DROP TRIGGER IF EXISTS trigger_update_kr_status ON key_results;
CREATE TRIGGER trigger_update_kr_status
BEFORE UPDATE OF current_value ON key_results
FOR EACH ROW
EXECUTE FUNCTION update_kr_status();

-- TRIGGER: Actualizar updated_at
DROP TRIGGER IF EXISTS update_objectives_updated_at ON objectives;
CREATE TRIGGER update_objectives_updated_at
BEFORE UPDATE ON objectives
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_key_results_updated_at ON key_results;
CREATE TRIGGER update_key_results_updated_at
BEFORE UPDATE ON key_results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- VIEW: Vista completa de OKRs
CREATE OR REPLACE VIEW okrs_with_progress AS
SELECT 
  o.id as objective_id,
  o.title as objective_title,
  o.description as objective_description,
  o.quarter,
  o.year,
  o.status as objective_status,
  o.target_date,
  o.owner_user_id,
  u.full_name as owner_name,
  calculate_objective_progress(o.id) as objective_progress,
  COUNT(DISTINCT kr.id) as total_key_results,
  COUNT(DISTINCT CASE WHEN kr.status = 'achieved' THEN kr.id END) as achieved_krs,
  COUNT(DISTINCT CASE WHEN kr.status = 'on_track' THEN kr.id END) as on_track_krs,
  COUNT(DISTINCT CASE WHEN kr.status = 'at_risk' THEN kr.id END) as at_risk_krs,
  COUNT(DISTINCT CASE WHEN kr.status = 'behind' THEN kr.id END) as behind_krs,
  COUNT(DISTINCT otl.task_id) as linked_tasks,
  o.created_at,
  o.updated_at
FROM objectives o
LEFT JOIN users u ON o.owner_user_id = u.id
LEFT JOIN key_results kr ON kr.objective_id = o.id
LEFT JOIN okr_task_links otl ON otl.key_result_id = kr.id
GROUP BY o.id, u.full_name;

-- RLS
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_task_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "OKRs are viewable by everyone" ON objectives;
CREATE POLICY "OKRs are viewable by everyone"
  ON objectives FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Key Results are viewable by everyone" ON key_results;
CREATE POLICY "Key Results are viewable by everyone"
  ON key_results FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage objectives" ON objectives;
CREATE POLICY "Admins can manage objectives"
  ON objectives FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'leader')
    )
  );

DROP POLICY IF EXISTS "Everyone can update KR progress" ON okr_updates;
CREATE POLICY "Everyone can update KR progress"
  ON okr_updates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Everyone can view updates" ON okr_updates;
CREATE POLICY "Everyone can view updates"
  ON okr_updates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Everyone can link tasks to OKRs" ON okr_task_links;
CREATE POLICY "Everyone can link tasks to OKRs"
  ON okr_task_links FOR ALL
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Everyone can update key results" ON key_results;
CREATE POLICY "Everyone can update key results"
  ON key_results FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage key results" ON key_results;
CREATE POLICY "Admins can manage key results"
  ON key_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'leader')
    )
  );

-- DATOS DE EJEMPLO
INSERT INTO objectives (title, description, quarter, year, status, target_date, created_by)
SELECT 
  'Alcanzar 100 cestas/mes', 
  'Objetivo de crecimiento Q4: Llegar a 100 cestas mensuales con foco en personalizadas y premium',
  'Q4',
  2025,
  'active',
  '2025-12-31',
  id
FROM users WHERE role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO key_results (objective_id, title, metric_type, start_value, target_value, current_value, unit, weight)
SELECT 
  o.id,
  'Vender 50 cestas premium',
  'number',
  35,
  50,
  50,
  'cestas',
  0.3
FROM objectives o 
WHERE o.title = 'Alcanzar 100 cestas/mes'
ON CONFLICT DO NOTHING;

INSERT INTO key_results (objective_id, title, metric_type, start_value, target_value, current_value, unit, weight)
SELECT 
  o.id,
  'Vender 30 cestas personalizadas',
  'number',
  15,
  30,
  18,
  'cestas',
  0.4
FROM objectives o 
WHERE o.title = 'Alcanzar 100 cestas/mes'
ON CONFLICT DO NOTHING;

INSERT INTO key_results (objective_id, title, metric_type, start_value, target_value, current_value, unit, weight)
SELECT 
  o.id,
  'Conseguir 20 clientes corporativos',
  'number',
  0,
  20,
  4,
  'clientes',
  0.3
FROM objectives o 
WHERE o.title = 'Alcanzar 100 cestas/mes'
ON CONFLICT DO NOTHING;