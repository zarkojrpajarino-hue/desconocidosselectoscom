-- Update 13 legacy RLS policies to use has_role() function instead of users.role

-- 1. alert_rules - Only admins can manage alert rules
DROP POLICY IF EXISTS "Only admins can manage alert rules" ON public.alert_rules;
CREATE POLICY "Only admins can manage alert rules" ON public.alert_rules
FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. business_metrics - Admins can view all metrics
DROP POLICY IF EXISTS "Admins can view all metrics" ON public.business_metrics;
CREATE POLICY "Admins can view all metrics" ON public.business_metrics
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. lead_interactions - View interactions based on lead access (with has_role)
DROP POLICY IF EXISTS "View interactions based on lead access" ON public.lead_interactions;
CREATE POLICY "View interactions based on lead access" ON public.lead_interactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM leads l
    WHERE l.id = lead_interactions.lead_id
    AND (
      l.assigned_to = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.is_admin_or_leader(auth.uid())
    )
  )
);

-- 4. leads - Admins and leaders can manage all leads
DROP POLICY IF EXISTS "Admins and leaders can manage all leads" ON public.leads;
CREATE POLICY "Admins and leaders can manage all leads" ON public.leads
FOR ALL USING (public.is_admin_or_leader(auth.uid()));

-- 5. objectives - Admins can manage objectives
DROP POLICY IF EXISTS "Admins can manage objectives" ON public.objectives;
CREATE POLICY "Admins can manage objectives" ON public.objectives
FOR ALL USING (public.is_admin_or_leader(auth.uid()));

-- 6. onboarding_submissions - Admins can view all submissions
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.onboarding_submissions;
CREATE POLICY "Admins can view all submissions" ON public.onboarding_submissions
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. system_config - Admins can update system config
DROP POLICY IF EXISTS "Admins can update system config" ON public.system_config;
CREATE POLICY "Admins can update system config" ON public.system_config
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. task_completions - Admins can view all completions
DROP POLICY IF EXISTS "Admins can view all completions" ON public.task_completions;
CREATE POLICY "Admins can view all completions" ON public.task_completions
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 9. task_financial_impact - Admins can view all task financial impact
DROP POLICY IF EXISTS "Admins can view all task financial impact" ON public.task_financial_impact;
CREATE POLICY "Admins can view all task financial impact" ON public.task_financial_impact
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 10. task_swaps - Admins can view all swaps
DROP POLICY IF EXISTS "Admins can view all swaps" ON public.task_swaps;
CREATE POLICY "Admins can view all swaps" ON public.task_swaps
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 11. tasks - Admins can view all tasks
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;
CREATE POLICY "Admins can view all tasks" ON public.tasks
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 12. user_achievements - Admins can view all achievements
DROP POLICY IF EXISTS "Admins can view all achievements" ON public.user_achievements;
CREATE POLICY "Admins can view all achievements" ON public.user_achievements
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 13. user_weekly_data - Admins can view all weekly data
DROP POLICY IF EXISTS "Admins can view all weekly data" ON public.user_weekly_data;
CREATE POLICY "Admins can view all weekly data" ON public.user_weekly_data
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix okr_evidences: add organization_id and update RLS policy
-- First add organization_id column if not exists
ALTER TABLE public.okr_evidences 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Populate organization_id from the related OKR update's objective's organization
UPDATE public.okr_evidences e
SET organization_id = (
  SELECT o.organization_id 
  FROM okr_updates ou 
  JOIN key_results kr ON kr.id = ou.key_result_id
  JOIN objectives o ON o.id = kr.objective_id
  WHERE ou.id = e.okr_update_id
)
WHERE e.organization_id IS NULL;

-- Update RLS policy for okr_evidences to scope by organization
DROP POLICY IF EXISTS "Everyone can view evidences" ON public.okr_evidences;
CREATE POLICY "Users can view evidences in their organization" ON public.okr_evidences
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);