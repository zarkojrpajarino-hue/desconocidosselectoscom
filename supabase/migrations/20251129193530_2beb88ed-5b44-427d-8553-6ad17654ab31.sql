-- Crear función para sincronizar business_metrics con revenue y expense entries
CREATE OR REPLACE FUNCTION sync_business_metrics_to_financial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  entry_date DATE;
BEGIN
  entry_date := NEW.metric_date;
  
  -- Si hay revenue, crear/actualizar entrada de ingresos
  IF NEW.revenue IS NOT NULL AND NEW.revenue > 0 THEN
    INSERT INTO revenue_entries (
      date,
      amount,
      product_category,
      product_name,
      created_by,
      notes
    ) VALUES (
      entry_date,
      NEW.revenue,
      'kpi_sync',
      'Ingresos desde KPIs',
      NEW.user_id,
      CONCAT('Sincronizado automáticamente desde business_metrics. ', COALESCE(NEW.notes, ''))
    )
    ON CONFLICT (date, product_category, product_name)
    WHERE created_by = NEW.user_id
    DO UPDATE SET
      amount = EXCLUDED.amount,
      notes = EXCLUDED.notes;
  END IF;
  
  -- Si hay operational_costs, crear/actualizar entrada de gastos
  IF NEW.operational_costs IS NOT NULL AND NEW.operational_costs > 0 THEN
    INSERT INTO expense_entries (
      date,
      amount,
      category,
      description,
      created_by,
      notes
    ) VALUES (
      entry_date,
      NEW.operational_costs,
      'operaciones',
      'Costos operacionales desde KPIs',
      NEW.user_id,
      CONCAT('Sincronizado automáticamente desde business_metrics. ', COALESCE(NEW.notes, ''))
    )
    ON CONFLICT (date, category, description)
    WHERE created_by = NEW.user_id
    DO UPDATE SET
      amount = EXCLUDED.amount,
      notes = EXCLUDED.notes;
  END IF;
  
  -- Si hay CAC, crear/actualizar marketing spend
  IF NEW.cac IS NOT NULL AND NEW.cac > 0 AND NEW.leads_generated IS NOT NULL THEN
    INSERT INTO marketing_spend (
      date,
      amount,
      channel,
      leads_generated,
      created_by,
      notes
    ) VALUES (
      entry_date,
      NEW.cac * NEW.leads_generated,
      'kpi_sync',
      NEW.leads_generated,
      NEW.user_id,
      CONCAT('Sincronizado desde CAC en KPIs. ', COALESCE(NEW.notes, ''))
    )
    ON CONFLICT (date, channel)
    WHERE created_by = NEW.user_id
    DO UPDATE SET
      amount = EXCLUDED.amount,
      leads_generated = EXCLUDED.leads_generated,
      notes = EXCLUDED.notes;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para sincronización automática
DROP TRIGGER IF EXISTS trigger_sync_business_metrics ON business_metrics;
CREATE TRIGGER trigger_sync_business_metrics
  AFTER INSERT OR UPDATE ON business_metrics
  FOR EACH ROW
  EXECUTE FUNCTION sync_business_metrics_to_financial();

-- Agregar columnas para vincular tasks con costos
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_cost NUMERIC DEFAULT 0;

-- Agregar columnas para vincular OKRs con impacto financiero
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS budget_allocated NUMERIC DEFAULT 0;
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS revenue_impact NUMERIC DEFAULT 0;
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS cost_savings NUMERIC DEFAULT 0;

-- Crear tabla para registrar el impacto financiero de tasks completadas
CREATE TABLE IF NOT EXISTS task_financial_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completion_id UUID REFERENCES task_completions(id) ON DELETE CASCADE,
  revenue_generated NUMERIC DEFAULT 0,
  cost_incurred NUMERIC DEFAULT 0,
  roi_percentage NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies para task_financial_impact
ALTER TABLE task_financial_impact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view financial impact of their tasks"
  ON task_financial_impact FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_financial_impact.task_id 
      AND (tasks.user_id = auth.uid() OR tasks.leader_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all task financial impact"
  ON task_financial_impact FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can insert financial impact for their completed tasks"
  ON task_financial_impact FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_financial_impact.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Crear vista para ver el impacto financiero de OKRs
CREATE OR REPLACE VIEW okr_financial_summary AS
SELECT 
  o.id as objective_id,
  o.title as objective_title,
  o.budget_allocated,
  o.revenue_impact,
  o.cost_savings,
  COUNT(DISTINCT kr.id) as key_results_count,
  COUNT(DISTINCT otl.task_id) as linked_tasks_count,
  COALESCE(SUM(tfi.revenue_generated), 0) as total_revenue_from_tasks,
  COALESCE(SUM(tfi.cost_incurred), 0) as total_cost_from_tasks,
  CASE 
    WHEN COALESCE(SUM(tfi.cost_incurred), 0) > 0 
    THEN ((COALESCE(SUM(tfi.revenue_generated), 0) - COALESCE(SUM(tfi.cost_incurred), 0)) / COALESCE(SUM(tfi.cost_incurred), 0)) * 100
    ELSE 0
  END as roi_percentage
FROM objectives o
LEFT JOIN key_results kr ON kr.objective_id = o.id
LEFT JOIN okr_task_links otl ON otl.key_result_id = kr.id
LEFT JOIN task_financial_impact tfi ON tfi.task_id = otl.task_id
GROUP BY o.id, o.title, o.budget_allocated, o.revenue_impact, o.cost_savings;

-- RLS para la vista
ALTER VIEW okr_financial_summary SET (security_invoker = true);

COMMENT ON FUNCTION sync_business_metrics_to_financial() IS 'Sincroniza automáticamente business_metrics con revenue_entries, expense_entries y marketing_spend';
COMMENT ON TABLE task_financial_impact IS 'Registra el impacto financiero real de cada tarea completada';
COMMENT ON VIEW okr_financial_summary IS 'Vista agregada del impacto financiero de cada OKR basado en sus tareas vinculadas';