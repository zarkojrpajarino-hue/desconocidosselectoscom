-- ============================================
-- SISTEMA ENTERPRISE - TABLAS CORREGIDAS
-- ============================================

-- 1. TABLAS PARA ANÁLISIS DE DEALS
CREATE TABLE IF NOT EXISTS deal_velocity_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  stage VARCHAR(50) NOT NULL,
  average_days DECIMAL(10,2),
  deal_count INTEGER,
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, stage)
);

CREATE TABLE IF NOT EXISTS stalled_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  days_in_stage INTEGER,
  excess_days INTEGER,
  recommended_action TEXT,
  detected_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lost_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  reason VARCHAR(100) NOT NULL,
  additional_notes TEXT,
  deal_value DECIMAL(12,2),
  lost_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABLAS PARA LEAD SCORING
CREATE TABLE IF NOT EXISTS lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  total_score INTEGER CHECK (total_score >= 0 AND total_score <= 100),
  source_score INTEGER,
  engagement_score INTEGER,
  fit_score INTEGER,
  urgency_score INTEGER,
  behavior_score INTEGER,
  classification VARCHAR(10) CHECK (classification IN ('hot', 'warm', 'cold')),
  probability_to_close INTEGER,
  next_best_action TEXT,
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(lead_id)
);

CREATE TABLE IF NOT EXISTS lead_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type VARCHAR(50),
  event_data JSONB,
  occurred_at TIMESTAMP DEFAULT NOW()
);

-- 3. TABLAS PARA KPIs
CREATE TABLE IF NOT EXISTS kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  kpi_metric VARCHAR(100) NOT NULL,
  target_value DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2),
  target_date DATE,
  period_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  kpi_metric VARCHAR(100) NOT NULL,
  old_value DECIMAL(12,2),
  new_value DECIMAL(12,2),
  change_percentage DECIMAL(10,2),
  contributing_factors JSONB,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry VARCHAR(100),
  kpi_metric VARCHAR(100),
  average_value DECIMAL(12,2),
  top_25_percentile DECIMAL(12,2),
  top_10_percentile DECIMAL(12,2),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(industry, kpi_metric)
);

-- 4. TABLAS PARA FINANZAS
CREATE TABLE IF NOT EXISTS financial_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  period VARCHAR(50),
  projected_revenue DECIMAL(12,2),
  revenue_from_pipeline DECIMAL(12,2),
  revenue_from_recurring DECIMAL(12,2),
  revenue_from_new_customers DECIMAL(12,2),
  projected_expenses DECIMAL(12,2),
  calculated_cac DECIMAL(12,2),
  calculated_ltv DECIMAL(12,2),
  ltv_cac_ratio DECIMAL(10,2),
  burn_rate DECIMAL(12,2),
  runway_months DECIMAL(10,2),
  confidence_level INTEGER,
  breakdown JSONB,
  alerts JSONB,
  calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_flow_forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  month VARCHAR(20),
  opening_balance DECIMAL(12,2),
  projected_inflows DECIMAL(12,2),
  projected_outflows DECIMAL(12,2),
  net_cash_flow DECIMAL(12,2),
  closing_balance DECIMAL(12,2),
  inflows_breakdown JSONB,
  outflows_breakdown JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  category VARCHAR(100),
  period VARCHAR(50),
  budgeted_amount DECIMAL(12,2),
  actual_amount DECIMAL(12,2),
  variance_amount DECIMAL(12,2),
  variance_percentage DECIMAL(10,2),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_ratios_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  current_ratio DECIMAL(10,2),
  quick_ratio DECIMAL(10,2),
  gross_margin DECIMAL(10,2),
  operating_margin DECIMAL(10,2),
  net_margin DECIMAL(10,2),
  roi DECIMAL(10,2),
  debt_to_equity DECIMAL(10,2),
  working_capital_ratio DECIMAL(10,2),
  cash_conversion_cycle INTEGER,
  revenue_per_employee DECIMAL(12,2),
  calculated_at TIMESTAMP DEFAULT NOW()
);

-- 5. EXTENSIONES A TABLAS EXISTENTES
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_stage_change TIMESTAMP DEFAULT NOW();

ALTER TABLE key_results
ADD COLUMN IF NOT EXISTS linked_kpi VARCHAR(100),
ADD COLUMN IF NOT EXISTS auto_update BOOLEAN DEFAULT false;

-- 6. FUNCIONES DE CÁLCULO
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_days_in_stage ON leads;
CREATE TRIGGER update_days_in_stage
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION calculate_days_in_stage();

CREATE OR REPLACE FUNCTION detect_stalled_deals(org_id UUID)
RETURNS TABLE (
  lead_id UUID,
  deal_name TEXT,
  current_stage VARCHAR,
  days_in_stage INTEGER,
  average_for_stage DECIMAL,
  excess_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH stage_averages AS (
    SELECT 
      l.stage,
      AVG(l.days_in_current_stage) as avg_days
    FROM leads l
    WHERE l.organization_id = org_id
      AND l.stage NOT IN ('won', 'lost', 'closed_won', 'closed_lost')
    GROUP BY l.stage
  )
  SELECT 
    l.id as lead_id,
    l.company as deal_name,
    l.stage as current_stage,
    l.days_in_current_stage as days_in_stage,
    sa.avg_days as average_for_stage,
    (l.days_in_current_stage - sa.avg_days)::INTEGER as excess_days
  FROM leads l
  JOIN stage_averages sa ON l.stage = sa.stage
  WHERE l.organization_id = org_id
    AND l.days_in_current_stage > (sa.avg_days * 1.5)
    AND l.stage NOT IN ('won', 'lost', 'closed_won', 'closed_lost')
  ORDER BY (l.days_in_current_stage - sa.avg_days) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION calculate_deal_velocity(org_id UUID)
RETURNS TABLE (
  stage VARCHAR,
  average_days DECIMAL,
  deal_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.stage as stage,
    AVG(l.days_in_current_stage)::DECIMAL(10,2) as average_days,
    COUNT(*)::BIGINT as deal_count
  FROM leads l
  WHERE l.organization_id = org_id
    AND l.stage NOT IN ('won', 'lost', 'closed_won', 'closed_lost')
  GROUP BY l.stage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION calculate_lead_score_enterprise(p_lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_lead RECORD;
  v_engagement_count INTEGER;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  
  IF v_lead IS NULL THEN
    RETURN 0;
  END IF;
  
  v_score := v_score + CASE v_lead.source
    WHEN 'referral' THEN 20
    WHEN 'organic' THEN 15
    WHEN 'paid' THEN 10
    ELSE 5
  END;
  
  SELECT COUNT(*) INTO v_engagement_count
  FROM lead_engagement
  WHERE lead_id = p_lead_id
    AND occurred_at > NOW() - INTERVAL '30 days';
  
  v_score := v_score + LEAST(v_engagement_count * 5, 25);
  
  IF v_lead.estimated_value IS NOT NULL THEN
    v_score := v_score + CASE
      WHEN v_lead.estimated_value > 10000 THEN 20
      WHEN v_lead.estimated_value > 5000 THEN 15
      WHEN v_lead.estimated_value > 2000 THEN 10
      ELSE 5
    END;
  END IF;
  
  v_score := v_score + CASE v_lead.pipeline_stage
    WHEN 'closing' THEN 15
    WHEN 'negotiation' THEN 12
    WHEN 'proposal' THEN 8
    ELSE 5
  END;
  
  IF v_lead.updated_at > NOW() - INTERVAL '7 days' THEN
    v_score := v_score + 20;
  ELSIF v_lead.updated_at > NOW() - INTERVAL '14 days' THEN
    v_score := v_score + 10;
  ELSE
    v_score := v_score + 5;
  END IF;
  
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. VISTAS
CREATE OR REPLACE VIEW enterprise_pipeline_forecast AS
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

CREATE OR REPLACE VIEW enterprise_lost_reasons_summary AS
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

-- 8. HABILITAR RLS
ALTER TABLE deal_velocity_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE stalled_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ratios_cache ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS RLS COMPLETAS

-- deal_velocity_cache
CREATE POLICY "deal_velocity_cache_select" ON deal_velocity_cache FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "deal_velocity_cache_insert" ON deal_velocity_cache FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "deal_velocity_cache_update" ON deal_velocity_cache FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "deal_velocity_cache_delete" ON deal_velocity_cache FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);

-- stalled_deals
CREATE POLICY "stalled_deals_select" ON stalled_deals FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "stalled_deals_insert" ON stalled_deals FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "stalled_deals_update" ON stalled_deals FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "stalled_deals_delete" ON stalled_deals FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);

-- lost_reasons
CREATE POLICY "lost_reasons_select" ON lost_reasons FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "lost_reasons_insert" ON lost_reasons FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "lost_reasons_update" ON lost_reasons FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "lost_reasons_delete" ON lost_reasons FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);

-- lead_scores
CREATE POLICY "lead_scores_select" ON lead_scores FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "lead_scores_insert" ON lead_scores FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "lead_scores_update" ON lead_scores FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "lead_scores_delete" ON lead_scores FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);

-- lead_engagement
CREATE POLICY "lead_engagement_select" ON lead_engagement FOR SELECT USING (
  lead_id IN (SELECT id FROM leads WHERE organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()))
);
CREATE POLICY "lead_engagement_insert" ON lead_engagement FOR INSERT WITH CHECK (
  lead_id IN (SELECT id FROM leads WHERE organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()))
);

-- kpi_targets
CREATE POLICY "kpi_targets_select" ON kpi_targets FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "kpi_targets_insert" ON kpi_targets FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()) AND is_admin_or_leader(auth.uid())
);
CREATE POLICY "kpi_targets_update" ON kpi_targets FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()) AND is_admin_or_leader(auth.uid())
);
CREATE POLICY "kpi_targets_delete" ON kpi_targets FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()) AND is_admin_or_leader(auth.uid())
);

-- kpi_change_history
CREATE POLICY "kpi_change_history_select" ON kpi_change_history FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "kpi_change_history_insert" ON kpi_change_history FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);

-- financial_projections
CREATE POLICY "financial_projections_select" ON financial_projections FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "financial_projections_insert" ON financial_projections FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "financial_projections_update" ON financial_projections FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);

-- cash_flow_forecast
CREATE POLICY "cash_flow_forecast_select" ON cash_flow_forecast FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "cash_flow_forecast_insert" ON cash_flow_forecast FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "cash_flow_forecast_update" ON cash_flow_forecast FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);

-- budget_items
CREATE POLICY "budget_items_select" ON budget_items FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "budget_items_insert" ON budget_items FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()) AND is_admin_or_leader(auth.uid())
);
CREATE POLICY "budget_items_update" ON budget_items FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()) AND is_admin_or_leader(auth.uid())
);
CREATE POLICY "budget_items_delete" ON budget_items FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()) AND is_admin_or_leader(auth.uid())
);

-- financial_ratios_cache
CREATE POLICY "financial_ratios_cache_select" ON financial_ratios_cache FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "financial_ratios_cache_insert" ON financial_ratios_cache FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "financial_ratios_cache_update" ON financial_ratios_cache FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
);

-- 10. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_leads_org_stage ON leads(organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_days_in_stage ON leads(days_in_current_stage);
CREATE INDEX IF NOT EXISTS idx_lead_scores_lead_id ON lead_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_engagement_lead_id ON lead_engagement(lead_id);
CREATE INDEX IF NOT EXISTS idx_lost_reasons_org ON lost_reasons(organization_id);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_org ON kpi_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_projections_org ON financial_projections(organization_id);

-- 11. DATOS INICIALES
INSERT INTO kpi_benchmarks (industry, kpi_metric, average_value, top_25_percentile, top_10_percentile)
VALUES 
  ('SaaS', 'cac', 150, 100, 80),
  ('SaaS', 'ltv_cac_ratio', 3, 4, 5),
  ('SaaS', 'churn_rate', 7, 3, 1),
  ('SaaS', 'conversion_rate', 2.5, 4, 6),
  ('E-commerce', 'cac', 30, 20, 15),
  ('E-commerce', 'conversion_rate', 2, 3.5, 5),
  ('Retail', 'gross_margin', 35, 45, 55)
ON CONFLICT (industry, kpi_metric) DO NOTHING;