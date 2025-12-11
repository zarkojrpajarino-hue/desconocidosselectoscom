-- Cohort Analysis System
-- Track user cohorts for retention and behavior analysis

CREATE TABLE IF NOT EXISTS public.user_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_month TEXT NOT NULL, -- Format: 'YYYY-MM'
  cohort_type TEXT NOT NULL DEFAULT 'signup' CHECK (cohort_type IN ('signup', 'first_purchase', 'plan_upgrade', 'custom')),
  first_action_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_action_at TIMESTAMPTZ,
  total_actions INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  is_churned BOOLEAN DEFAULT false,
  churned_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id, cohort_type)
);

-- Cohort metrics snapshots (calculated periodically)
CREATE TABLE IF NOT EXISTS public.cohort_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cohort_month TEXT NOT NULL,
  cohort_type TEXT NOT NULL DEFAULT 'signup',
  period_month TEXT NOT NULL, -- The month being measured
  period_number INTEGER NOT NULL, -- 0 = first month, 1 = second month, etc.
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  retained_users INTEGER DEFAULT 0,
  churned_users INTEGER DEFAULT 0,
  retention_rate NUMERIC DEFAULT 0,
  avg_revenue_per_user NUMERIC DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, cohort_month, cohort_type, period_month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_cohorts_org ON public.user_cohorts(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_cohorts_cohort ON public.user_cohorts(cohort_month);
CREATE INDEX IF NOT EXISTS idx_user_cohorts_type ON public.user_cohorts(cohort_type);
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_org ON public.cohort_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_cohort ON public.cohort_metrics(cohort_month);

-- RLS Policies
ALTER TABLE public.user_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_metrics ENABLE ROW LEVEL SECURITY;

-- Admins can view cohort data
CREATE POLICY "Admins can view user cohorts"
  ON public.user_cohorts FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- System can manage cohorts
CREATE POLICY "System can manage user cohorts"
  ON public.user_cohorts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view cohort metrics"
  ON public.cohort_metrics FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can manage cohort metrics"
  ON public.cohort_metrics FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to assign user to cohort
CREATE OR REPLACE FUNCTION public.assign_user_to_cohort(
  p_organization_id UUID,
  p_user_id UUID,
  p_cohort_type TEXT DEFAULT 'signup'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort_month TEXT;
  v_cohort_id UUID;
BEGIN
  v_cohort_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  INSERT INTO user_cohorts (organization_id, user_id, cohort_month, cohort_type)
  VALUES (p_organization_id, p_user_id, v_cohort_month, p_cohort_type)
  ON CONFLICT (organization_id, user_id, cohort_type) 
  DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_cohort_id;
  
  RETURN v_cohort_id;
END;
$$;

-- Function to calculate cohort metrics
CREATE OR REPLACE FUNCTION public.calculate_cohort_metrics(p_organization_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  cohort_record RECORD;
  v_period_month TEXT;
  v_period_number INTEGER;
  v_total_users INTEGER;
  v_active_users INTEGER;
BEGIN
  -- Loop through each cohort
  FOR cohort_record IN 
    SELECT DISTINCT cohort_month, cohort_type
    FROM user_cohorts
    WHERE organization_id = p_organization_id
    ORDER BY cohort_month DESC
    LIMIT 12
  LOOP
    -- Get total users in cohort
    SELECT COUNT(*) INTO v_total_users
    FROM user_cohorts
    WHERE organization_id = p_organization_id
    AND cohort_month = cohort_record.cohort_month
    AND cohort_type = cohort_record.cohort_type;
    
    -- Calculate metrics for each period (up to 12 months)
    FOR v_period_number IN 0..11 LOOP
      v_period_month := TO_CHAR(
        TO_DATE(cohort_record.cohort_month || '-01', 'YYYY-MM-DD') + (v_period_number || ' months')::INTERVAL,
        'YYYY-MM'
      );
      
      -- Skip future periods
      IF v_period_month > TO_CHAR(NOW(), 'YYYY-MM') THEN
        EXIT;
      END IF;
      
      -- Count active users (simplified - users not churned)
      SELECT COUNT(*) INTO v_active_users
      FROM user_cohorts
      WHERE organization_id = p_organization_id
      AND cohort_month = cohort_record.cohort_month
      AND cohort_type = cohort_record.cohort_type
      AND (is_churned = false OR churned_at > TO_DATE(v_period_month || '-01', 'YYYY-MM-DD'));
      
      -- Insert or update metrics
      INSERT INTO cohort_metrics (
        organization_id, cohort_month, cohort_type, period_month, period_number,
        total_users, active_users, retained_users, retention_rate
      )
      VALUES (
        p_organization_id, cohort_record.cohort_month, cohort_record.cohort_type,
        v_period_month, v_period_number, v_total_users, v_active_users, v_active_users,
        CASE WHEN v_total_users > 0 THEN (v_active_users::NUMERIC / v_total_users) * 100 ELSE 0 END
      )
      ON CONFLICT (organization_id, cohort_month, cohort_type, period_month)
      DO UPDATE SET
        total_users = EXCLUDED.total_users,
        active_users = EXCLUDED.active_users,
        retained_users = EXCLUDED.retained_users,
        retention_rate = EXCLUDED.retention_rate,
        calculated_at = NOW();
      
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- Triggers
CREATE TRIGGER trigger_user_cohorts_updated_at
  BEFORE UPDATE ON public.user_cohorts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();