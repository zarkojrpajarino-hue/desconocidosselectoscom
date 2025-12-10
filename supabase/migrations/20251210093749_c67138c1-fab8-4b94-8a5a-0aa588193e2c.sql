-- =============================================
-- TIME TRACKING SYSTEM
-- =============================================

-- Add estimated_hours and actual_hours columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2) DEFAULT 0;

-- Create task_time_logs table for tracking time sessions
CREATE TABLE IF NOT EXISTS public.task_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Tracking times
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN ended_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
      ELSE NULL
    END
  ) STORED,
  
  -- Metadata
  notes TEXT,
  was_interrupted BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_logs_task ON public.task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user ON public.task_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_org ON public.task_time_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_active ON public.task_time_logs(user_id) WHERE ended_at IS NULL;

-- Enable RLS
ALTER TABLE public.task_time_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_time_logs
CREATE POLICY "Users can view time logs in their organization"
  ON public.task_time_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own time logs"
  ON public.task_time_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own time logs"
  ON public.task_time_logs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own time logs"
  ON public.task_time_logs FOR DELETE
  USING (user_id = auth.uid());

-- Function to update actual_hours on tasks when time log changes
CREATE OR REPLACE FUNCTION public.update_task_actual_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tasks
  SET actual_hours = (
    SELECT COALESCE(SUM(duration_minutes), 0) / 60.0
    FROM public.task_time_logs
    WHERE task_id = COALESCE(NEW.task_id, OLD.task_id)
    AND ended_at IS NOT NULL
  )
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update actual_hours
DROP TRIGGER IF EXISTS update_task_hours_on_log_change ON public.task_time_logs;
CREATE TRIGGER update_task_hours_on_log_change
  AFTER INSERT OR UPDATE OR DELETE ON public.task_time_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_actual_hours();

-- Function to get active time log for a user
CREATE OR REPLACE FUNCTION public.get_active_time_log(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  task_id UUID,
  started_at TIMESTAMPTZ,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT ttl.id, ttl.task_id, ttl.started_at, ttl.notes
  FROM public.task_time_logs ttl
  WHERE ttl.user_id = p_user_id
  AND ttl.ended_at IS NULL
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- SUBSCRIPTION CANCELLATIONS (for Churn Tracking)
-- =============================================

CREATE TABLE IF NOT EXISTS public.subscription_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID,
  
  -- Subscription info
  plan_type VARCHAR(20) NOT NULL,
  subscription_id VARCHAR(100),
  
  -- Cancellation reason
  cancellation_reason VARCHAR(50) CHECK (
    cancellation_reason IN (
      'too_expensive',
      'missing_features',
      'not_using_enough',
      'switching_competitor',
      'business_closed',
      'technical_issues',
      'poor_support',
      'other'
    )
  ),
  feedback TEXT,
  
  -- Metrics at cancellation time
  days_active INTEGER,
  total_revenue DECIMAL(10,2),
  ltv DECIMAL(10,2),
  last_login_at TIMESTAMPTZ,
  feature_usage_score DECIMAL(5,2),
  
  -- Retention attempt
  retention_attempted BOOLEAN DEFAULT false,
  retention_offer TEXT,
  retention_accepted BOOLEAN,
  
  -- Timestamps
  cancelled_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_cancellations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view cancellations in their organization"
  ON public.subscription_cancellations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own cancellation"
  ON public.subscription_cancellations FOR INSERT
  WITH CHECK (user_id = auth.uid());