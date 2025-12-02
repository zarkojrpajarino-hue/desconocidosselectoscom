-- Arreglar warnings de seguridad

-- 1. Recrear vistas sin SECURITY DEFINER (usar SECURITY INVOKER que es el default)
DROP VIEW IF EXISTS enterprise_pipeline_forecast;
CREATE VIEW enterprise_pipeline_forecast WITH (security_invoker = true) AS
SELECT 
  l.organization_id,
  l.pipeline_stage as stage,
  COUNT(*) as deal_count,
  AVG(l.estimated_value) as avg_deal_size,
  SUM(l.estimated_value) as total_value,
  SUM(l.estimated_value * 
    CASE l.pipeline_stage
      WHEN 'discovery' THEN 0.10
      WHEN 'qualification' THEN 0.20
      WHEN 'proposal' THEN 0.50
      WHEN 'negotiation' THEN 0.70
      WHEN 'closing' THEN 0.85
      ELSE 0.05
    END
  ) as expected_revenue
FROM leads l
WHERE l.pipeline_stage NOT IN ('won', 'lost')
GROUP BY l.organization_id, l.pipeline_stage;

DROP VIEW IF EXISTS enterprise_lost_reasons_summary;
CREATE VIEW enterprise_lost_reasons_summary WITH (security_invoker = true) AS
SELECT 
  lr.organization_id,
  lr.reason,
  COUNT(*) as count,
  ROUND((COUNT(*)::DECIMAL / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY lr.organization_id), 0) * 100), 1) as percentage,
  SUM(lr.deal_value) as total_value,
  AVG(lr.deal_value) as avg_deal_size
FROM lost_reasons lr
WHERE lr.lost_at > NOW() - INTERVAL '90 days'
GROUP BY lr.organization_id, lr.reason;

-- 2. Arreglar función calculate_days_in_stage con search_path
CREATE OR REPLACE FUNCTION calculate_days_in_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage) OR TG_OP = 'INSERT' THEN
    NEW.days_in_current_stage := 0;
    NEW.last_stage_change := NOW();
  ELSE
    NEW.days_in_current_stage := EXTRACT(DAY FROM (NOW() - COALESCE(NEW.last_stage_change, NOW())));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Habilitar RLS en kpi_benchmarks (es tabla pública pero mejor con RLS)
ALTER TABLE kpi_benchmarks ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan ver benchmarks (son datos públicos de industria)
CREATE POLICY "kpi_benchmarks_public_read" ON kpi_benchmarks FOR SELECT USING (true);

-- Solo admins pueden modificar benchmarks
CREATE POLICY "kpi_benchmarks_admin_write" ON kpi_benchmarks FOR INSERT WITH CHECK (
  is_admin_or_leader(auth.uid())
);
CREATE POLICY "kpi_benchmarks_admin_update" ON kpi_benchmarks FOR UPDATE USING (
  is_admin_or_leader(auth.uid())
);
CREATE POLICY "kpi_benchmarks_admin_delete" ON kpi_benchmarks FOR DELETE USING (
  is_admin_or_leader(auth.uid())
);