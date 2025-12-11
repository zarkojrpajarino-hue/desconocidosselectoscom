-- Feature Flags System
-- Granular feature control per organization

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization-specific feature flag overrides
CREATE TABLE IF NOT EXISTS public.organization_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_flag_id UUID NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_by UUID REFERENCES auth.users(id),
  enabled_at TIMESTAMPTZ,
  disabled_by UUID REFERENCES auth.users(id),
  disabled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, feature_flag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_feature_flags_org ON public.organization_feature_flags(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_feature_flags_flag ON public.organization_feature_flags(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON public.feature_flags(name);

-- RLS Policies
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature flags (needed for client-side checks)
CREATE POLICY "Feature flags are readable by authenticated users"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Only super admins can manage feature flags
CREATE POLICY "Only service role can manage feature flags"
  ON public.feature_flags FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Organization admins can view their feature flag overrides
CREATE POLICY "Users can view their organization feature flags"
  ON public.organization_feature_flags FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- Only admins can modify organization feature flags
CREATE POLICY "Admins can modify organization feature flags"
  ON public.organization_feature_flags FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Function to check if a feature is enabled for an organization
CREATE OR REPLACE FUNCTION public.is_feature_enabled(
  p_organization_id UUID,
  p_feature_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_enabled BOOLEAN;
  v_org_enabled BOOLEAN;
BEGIN
  -- Get default value
  SELECT default_enabled INTO v_default_enabled
  FROM feature_flags
  WHERE name = p_feature_name;
  
  -- If feature doesn't exist, return false
  IF v_default_enabled IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check for organization override
  SELECT off.enabled INTO v_org_enabled
  FROM organization_feature_flags off
  JOIN feature_flags ff ON ff.id = off.feature_flag_id
  WHERE off.organization_id = p_organization_id
  AND ff.name = p_feature_name;
  
  -- Return override if exists, otherwise default
  RETURN COALESCE(v_org_enabled, v_default_enabled);
END;
$$;

-- Seed some default feature flags
INSERT INTO public.feature_flags (name, description, default_enabled) VALUES
  ('ai_analysis', 'AI-powered business analysis', true),
  ('competitive_intelligence', 'Competitive intelligence features', false),
  ('advanced_exports', 'PDF and Excel export capabilities', true),
  ('time_tracking', 'Task time tracking feature', true),
  ('okr_check_ins', 'OKR check-in functionality', true),
  ('financial_anomalies', 'Financial anomaly detection', false),
  ('cohort_analysis', 'Cohort analytics dashboard', false),
  ('nps_surveys', 'NPS survey collection', false),
  ('automated_reports', 'Automated report generation', false),
  ('slack_integration', 'Slack notifications', false),
  ('hubspot_integration', 'HubSpot CRM sync', false),
  ('zapier_integration', 'Zapier webhooks', false)
ON CONFLICT (name) DO NOTHING;

-- Trigger to update updated_at
CREATE TRIGGER trigger_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_org_feature_flags_updated_at
  BEFORE UPDATE ON public.organization_feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();