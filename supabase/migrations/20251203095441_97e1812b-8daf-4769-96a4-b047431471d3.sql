-- ============================================
-- MIGRACIÓN: STARTUP ONBOARDING COMPLETO
-- ============================================

-- Tabla principal de onboardings para startups
CREATE TABLE IF NOT EXISTS startup_onboardings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Paso 1: Visión
  business_name TEXT NOT NULL,
  tagline TEXT,
  problem_statement TEXT NOT NULL,
  solution_description TEXT NOT NULL,
  unique_value_proposition TEXT,
  why_now TEXT,
  inspiration TEXT,
  
  -- Paso 2: Mercado
  ideal_customer_profile TEXT,
  customer_pain_points TEXT[] DEFAULT '{}',
  market_tam TEXT,
  market_sam TEXT,
  market_som TEXT,
  competitors JSONB DEFAULT '[]',
  competitive_advantage TEXT,
  distribution_channels TEXT[] DEFAULT '{}',
  
  -- Paso 3: Modelo de Negocio
  monetization_strategy TEXT CHECK (monetization_strategy IN ('subscription', 'one-time', 'freemium', 'marketplace', 'advertising', 'other')),
  pricing_lowest_tier NUMERIC(10,2),
  pricing_middle_tier NUMERIC(10,2),
  pricing_highest_tier NUMERIC(10,2),
  pricing_currency TEXT DEFAULT 'EUR',
  revenue_streams TEXT[] DEFAULT '{}',
  cost_structure JSONB DEFAULT '[]',
  estimated_cac NUMERIC(10,2),
  estimated_ltv NUMERIC(10,2),
  target_ltv_cac_ratio NUMERIC(5,2) DEFAULT 3,
  
  -- Paso 4: Producto/MVP
  mvp_description TEXT,
  core_features JSONB DEFAULT '[]',
  development_timeline_weeks INTEGER,
  technology_stack TEXT[] DEFAULT '{}',
  technical_challenges TEXT,
  
  -- Paso 5: Go-to-Market
  launch_strategy TEXT CHECK (launch_strategy IN ('stealth', 'beta', 'public', 'gradual')),
  first_100_customers_strategy TEXT,
  initial_marketing_budget NUMERIC(10,2),
  acquisition_channels JSONB DEFAULT '[]',
  content_strategy TEXT,
  partnerships_strategy TEXT,
  
  -- Paso 6: Recursos
  founders JSONB DEFAULT '[]',
  missing_skills TEXT[] DEFAULT '{}',
  current_capital NUMERIC(12,2),
  capital_needed NUMERIC(12,2),
  funding_strategy TEXT CHECK (funding_strategy IN ('bootstrapped', 'friends-family', 'angel', 'vc', 'crowdfunding')),
  runway_goal_months INTEGER,
  
  -- Paso 7: Validación
  critical_hypotheses JSONB DEFAULT '[]',
  prelaunch_metrics TEXT[] DEFAULT '{}',
  postlaunch_kpis TEXT[] DEFAULT '{}',
  pivot_criteria TEXT,
  success_definition TEXT,
  
  -- Paso 8: Timeline
  milestones JSONB DEFAULT '[]',
  three_month_goal TEXT,
  six_month_goal TEXT,
  twelve_month_goal TEXT,
  exit_strategy TEXT,
  
  -- Metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 8),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_startup_onboardings_org ON startup_onboardings(organization_id);
CREATE INDEX IF NOT EXISTS idx_startup_onboardings_status ON startup_onboardings(status);
CREATE INDEX IF NOT EXISTS idx_startup_onboardings_created_by ON startup_onboardings(created_by);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_startup_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_startup_onboarding_timestamp ON startup_onboardings;
CREATE TRIGGER trigger_update_startup_onboarding_timestamp
  BEFORE UPDATE ON startup_onboardings
  FOR EACH ROW
  EXECUTE FUNCTION update_startup_onboarding_updated_at();

-- RLS Policies
ALTER TABLE startup_onboardings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org startup onboardings" ON startup_onboardings;
CREATE POLICY "Users can view org startup onboardings"
  ON startup_onboardings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can create startup onboardings" ON startup_onboardings;
CREATE POLICY "Admins can create startup onboardings"
  ON startup_onboardings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND organization_id = startup_onboardings.organization_id
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update startup onboardings" ON startup_onboardings;
CREATE POLICY "Admins can update startup onboardings"
  ON startup_onboardings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND organization_id = startup_onboardings.organization_id
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete startup onboardings" ON startup_onboardings;
CREATE POLICY "Admins can delete startup onboardings"
  ON startup_onboardings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND organization_id = startup_onboardings.organization_id
      AND role = 'admin'
    )
  );

-- Tabla para proyecciones financieras de startups
CREATE TABLE IF NOT EXISTS startup_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  onboarding_id UUID REFERENCES startup_onboardings(id) ON DELETE CASCADE,
  
  type TEXT DEFAULT 'baseline' CHECK (type IN ('baseline', 'conservative', 'realistic', 'optimistic')),
  
  initial_capital NUMERIC(12,2),
  monthly_burn_rate NUMERIC(10,2),
  runway_months INTEGER,
  
  month_1_signups INTEGER,
  month_3_signups INTEGER,
  month_6_signups INTEGER,
  month_12_signups INTEGER,
  
  month_1_revenue NUMERIC(10,2),
  month_3_revenue NUMERIC(10,2),
  month_6_revenue NUMERIC(10,2),
  month_12_revenue NUMERIC(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_startup_projections_org ON startup_projections(organization_id);
CREATE INDEX IF NOT EXISTS idx_startup_projections_onboarding ON startup_projections(onboarding_id);

ALTER TABLE startup_projections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org projections" ON startup_projections;
CREATE POLICY "Users can view org projections"
  ON startup_projections FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage projections" ON startup_projections;
CREATE POLICY "Admins can manage projections"
  ON startup_projections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND organization_id = startup_projections.organization_id
      AND role = 'admin'
    )
  );

-- Tabla para métricas de validación de startups
CREATE TABLE IF NOT EXISTS startup_validation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  metric_name TEXT NOT NULL,
  metric_type TEXT CHECK (metric_type IN ('prelaunch', 'postlaunch')),
  current_value NUMERIC(12,2) DEFAULT 0,
  target_value NUMERIC(12,2),
  unit TEXT,
  
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_metrics_org ON startup_validation_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_validation_metrics_type ON startup_validation_metrics(metric_type);

ALTER TABLE startup_validation_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org validation metrics" ON startup_validation_metrics;
CREATE POLICY "Users can view org validation metrics"
  ON startup_validation_metrics FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert validation metrics" ON startup_validation_metrics;
CREATE POLICY "Users can insert validation metrics"
  ON startup_validation_metrics FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Agregar campo business_type a organizations si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'business_type'
  ) THEN
    ALTER TABLE organizations ADD COLUMN business_type TEXT DEFAULT 'existing';
  END IF;
END $$;