-- NPS Surveys System
-- Net Promoter Score collection and analysis

CREATE TABLE IF NOT EXISTS public.nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  category TEXT NOT NULL GENERATED ALWAYS AS (
    CASE 
      WHEN score >= 9 THEN 'promoter'
      WHEN score >= 7 THEN 'passive'
      ELSE 'detractor'
    END
  ) STORED,
  feedback TEXT,
  improvement_suggestion TEXT,
  would_recommend_reason TEXT,
  follow_up_requested BOOLEAN DEFAULT false,
  follow_up_completed BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  survey_context TEXT, -- e.g., 'monthly_check', 'post_feature', 'post_support'
  feature_ratings JSONB, -- {feature: score} for detailed feedback
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NPS Survey Campaigns (for scheduling surveys)
CREATE TABLE IF NOT EXISTS public.nps_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('scheduled', 'event_based', 'manual')),
  trigger_config JSONB, -- e.g., {schedule: '0 9 1 * *'} or {event: 'subscription_renewal'}
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'active', 'at_risk', 'new')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  total_responded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nps_surveys_org ON public.nps_surveys(organization_id);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_user ON public.nps_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_score ON public.nps_surveys(score);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_category ON public.nps_surveys(category);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_created ON public.nps_surveys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nps_campaigns_org ON public.nps_campaigns(organization_id);

-- RLS Policies
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_campaigns ENABLE ROW LEVEL SECURITY;

-- Users can submit their own NPS surveys
CREATE POLICY "Users can submit NPS surveys"
  ON public.nps_surveys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own surveys, admins can view all in org
CREATE POLICY "Users can view NPS surveys"
  ON public.nps_surveys FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can manage campaigns
CREATE POLICY "Admins can manage NPS campaigns"
  ON public.nps_campaigns FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Function to calculate NPS score
CREATE OR REPLACE FUNCTION public.calculate_nps_score(p_organization_id UUID, p_days INTEGER DEFAULT 90)
RETURNS TABLE (
  nps_score NUMERIC,
  promoters_count INTEGER,
  passives_count INTEGER,
  detractors_count INTEGER,
  total_responses INTEGER,
  promoters_pct NUMERIC,
  detractors_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promoters INTEGER;
  v_passives INTEGER;
  v_detractors INTEGER;
  v_total INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE category = 'promoter'),
    COUNT(*) FILTER (WHERE category = 'passive'),
    COUNT(*) FILTER (WHERE category = 'detractor'),
    COUNT(*)
  INTO v_promoters, v_passives, v_detractors, v_total
  FROM nps_surveys
  WHERE organization_id = p_organization_id
  AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
  
  IF v_total = 0 THEN
    RETURN QUERY SELECT 
      0::NUMERIC, 0, 0, 0, 0, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    ROUND(((v_promoters::NUMERIC / v_total) - (v_detractors::NUMERIC / v_total)) * 100, 1),
    v_promoters,
    v_passives,
    v_detractors,
    v_total,
    ROUND((v_promoters::NUMERIC / v_total) * 100, 1),
    ROUND((v_detractors::NUMERIC / v_total) * 100, 1);
END;
$$;

-- Function to get NPS trends over time
CREATE OR REPLACE FUNCTION public.get_nps_trends(p_organization_id UUID, p_months INTEGER DEFAULT 6)
RETURNS TABLE (
  month TEXT,
  nps_score NUMERIC,
  responses INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH monthly_data AS (
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM') as month,
      COUNT(*) FILTER (WHERE category = 'promoter') as promoters,
      COUNT(*) FILTER (WHERE category = 'detractor') as detractors,
      COUNT(*) as total
    FROM nps_surveys
    WHERE organization_id = p_organization_id
    AND created_at >= NOW() - (p_months || ' months')::INTERVAL
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
  )
  SELECT 
    md.month,
    CASE WHEN md.total > 0 
      THEN ROUND(((md.promoters::NUMERIC / md.total) - (md.detractors::NUMERIC / md.total)) * 100, 1)
      ELSE 0::NUMERIC
    END as nps_score,
    md.total::INTEGER as responses
  FROM monthly_data md
  ORDER BY md.month;
END;
$$;

-- Triggers
CREATE TRIGGER trigger_nps_surveys_updated_at
  BEFORE UPDATE ON public.nps_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_nps_campaigns_updated_at
  BEFORE UPDATE ON public.nps_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();