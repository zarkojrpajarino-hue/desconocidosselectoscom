-- Automated Reports System
-- Supports: Daily digest, Weekly summary, Monthly reports

-- Table for report configurations
CREATE TABLE IF NOT EXISTS public.automated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily_digest', 'weekly_summary', 'monthly_report', 'custom')),
  name TEXT NOT NULL,
  description TEXT,
  schedule_cron TEXT NOT NULL DEFAULT '0 9 * * 1', -- Default: Monday 9am
  recipients JSONB NOT NULL DEFAULT '[]', -- Array of {email, name}
  filters JSONB DEFAULT '{}', -- Optional filters for the report
  sections JSONB NOT NULL DEFAULT '["overview", "tasks", "okrs", "financial"]',
  format TEXT NOT NULL DEFAULT 'email' CHECK (format IN ('email', 'pdf', 'excel', 'slack')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for report execution history
CREATE TABLE IF NOT EXISTS public.report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.automated_reports(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  recipients_count INTEGER DEFAULT 0,
  error_message TEXT,
  report_data JSONB, -- Cached report data
  file_url TEXT, -- If PDF/Excel was generated
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automated_reports_org ON public.automated_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_automated_reports_active ON public.automated_reports(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_executions_report ON public.report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON public.report_executions(status);

-- RLS Policies
ALTER TABLE public.automated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization reports"
  ON public.automated_reports FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create reports for their organization"
  ON public.automated_reports FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own reports"
  ON public.automated_reports FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reports"
  ON public.automated_reports FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view report executions for their org"
  ON public.report_executions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- Function to calculate next scheduled time
CREATE OR REPLACE FUNCTION public.calculate_next_report_schedule(cron_expression TEXT)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Simplified: returns next Monday 9am
  RETURN date_trunc('week', now()) + INTERVAL '7 days' + INTERVAL '9 hours';
END;
$$;

-- Trigger to update next_scheduled_at
CREATE OR REPLACE FUNCTION public.update_report_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.next_scheduled_at := public.calculate_next_report_schedule(NEW.schedule_cron);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_report_schedule
  BEFORE INSERT OR UPDATE ON public.automated_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_report_schedule();