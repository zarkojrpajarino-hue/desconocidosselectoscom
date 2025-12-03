-- ============================================
-- TABLA PRINCIPAL: Análisis de Escalabilidad
-- ============================================
CREATE TABLE IF NOT EXISTS scalability_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  overall_score integer CHECK (overall_score >= 0 AND overall_score <= 100),
  people_score integer CHECK (people_score >= 0 AND people_score <= 100),
  process_score integer CHECK (process_score >= 0 AND process_score <= 100),
  product_score integer CHECK (product_score >= 0 AND product_score <= 100),
  financial_score integer CHECK (financial_score >= 0 AND financial_score <= 100),
  
  score_reasoning text,
  analysis_date timestamptz DEFAULT now(),
  data_snapshot jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLA: Bottlenecks (Cuellos de Botella)
-- ============================================
CREATE TABLE IF NOT EXISTS scalability_bottlenecks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES scalability_analyses(id) ON DELETE CASCADE NOT NULL,
  
  type text CHECK (type IN ('people', 'process', 'product', 'capital')) NOT NULL,
  severity text CHECK (severity IN ('critical', 'high', 'medium', 'low')) NOT NULL,
  
  title text NOT NULL,
  description text NOT NULL,
  impact_description text,
  
  recommendation_title text NOT NULL,
  recommendation_description text NOT NULL,
  estimated_impact text,
  implementation_effort text,
  priority_score integer CHECK (priority_score >= 0 AND priority_score <= 100),
  
  tools_recommended jsonb DEFAULT '[]'::jsonb,
  estimated_cost_range text,
  
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLA: Dependencies (Dependencias críticas)
-- ============================================
CREATE TABLE IF NOT EXISTS scalability_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES scalability_analyses(id) ON DELETE CASCADE NOT NULL,
  
  person_id uuid REFERENCES users(id) ON DELETE SET NULL,
  person_name text NOT NULL,
  
  dependent_tasks jsonb DEFAULT '[]'::jsonb,
  dependent_processes jsonb DEFAULT '[]'::jsonb,
  
  risk_level text CHECK (risk_level IN ('critical', 'high', 'medium', 'low')) NOT NULL,
  risk_description text,
  
  mitigation_recommendations jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLA: Automation Opportunities
-- ============================================
CREATE TABLE IF NOT EXISTS automation_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES scalability_analyses(id) ON DELETE CASCADE NOT NULL,
  
  process_name text NOT NULL,
  current_time_hours_month decimal(10,2),
  automated_time_hours_month decimal(10,2),
  time_saved_hours_month decimal(10,2),
  
  tools_recommended jsonb DEFAULT '[]'::jsonb,
  implementation_steps jsonb DEFAULT '[]'::jsonb,
  estimated_cost text,
  roi_months integer,
  
  priority integer CHECK (priority >= 1 AND priority <= 10),
  
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_scalability_analyses_org ON scalability_analyses(organization_id);
CREATE INDEX IF NOT EXISTS idx_scalability_analyses_date ON scalability_analyses(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_bottlenecks_analysis ON scalability_bottlenecks(analysis_id);
CREATE INDEX IF NOT EXISTS idx_bottlenecks_severity ON scalability_bottlenecks(severity);
CREATE INDEX IF NOT EXISTS idx_dependencies_analysis ON scalability_dependencies(analysis_id);
CREATE INDEX IF NOT EXISTS idx_automation_analysis ON automation_opportunities(analysis_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE scalability_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE scalability_bottlenecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scalability_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_opportunities ENABLE ROW LEVEL SECURITY;

-- Policies para scalability_analyses
CREATE POLICY "Users can view analyses for their org"
  ON scalability_analyses FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert analyses for their org"
  ON scalability_analyses FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

-- Policies para bottlenecks
CREATE POLICY "Users can view bottlenecks for their org"
  ON scalability_bottlenecks FOR SELECT
  USING (analysis_id IN (SELECT id FROM scalability_analyses WHERE organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert bottlenecks for their org"
  ON scalability_bottlenecks FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM scalability_analyses WHERE organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())));

-- Policies para dependencies
CREATE POLICY "Users can view dependencies for their org"
  ON scalability_dependencies FOR SELECT
  USING (analysis_id IN (SELECT id FROM scalability_analyses WHERE organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert dependencies for their org"
  ON scalability_dependencies FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM scalability_analyses WHERE organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())));

-- Policies para automation_opportunities
CREATE POLICY "Users can view automation for their org"
  ON automation_opportunities FOR SELECT
  USING (analysis_id IN (SELECT id FROM scalability_analyses WHERE organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert automation for their org"
  ON automation_opportunities FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM scalability_analyses WHERE organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())));

-- ============================================
-- TRIGGER updated_at
-- ============================================
CREATE TRIGGER update_scalability_analyses_updated_at
  BEFORE UPDATE ON scalability_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();