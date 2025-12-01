-- ============================================
-- MULTI-TENANCY: RLS POLICIES FOR user_roles
-- ============================================

-- 1. Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Users can read their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Policy: Admins can view all roles in their organization
CREATE POLICY "Admins can view all roles in organization"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.organization_id = user_roles.organization_id
    AND ur.role = 'admin'
  )
);

-- 4. Policy: Admins can insert new roles in their organization
CREATE POLICY "Admins can create roles in organization"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.organization_id = organization_id
    AND ur.role = 'admin'
  )
);

-- 5. Policy: Admins can update roles in their organization
CREATE POLICY "Admins can update roles in organization"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.organization_id = user_roles.organization_id
    AND ur.role = 'admin'
  )
);

-- 6. Policy: Admins can delete roles in their organization
CREATE POLICY "Admins can delete roles in organization"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.organization_id = user_roles.organization_id
    AND ur.role = 'admin'
  )
);

-- ============================================
-- ADD organization_id WHERE MISSING
-- ============================================

-- Add organization_id to tasks table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    CREATE INDEX idx_tasks_organization_id ON public.tasks(organization_id);
  END IF;
END $$;

-- Add organization_id to task_schedule if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_schedule' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.task_schedule ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    CREATE INDEX idx_task_schedule_organization_id ON public.task_schedule(organization_id);
  END IF;
END $$;

-- Add organization_id to task_completions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_completions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.task_completions ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    CREATE INDEX idx_task_completions_organization_id ON public.task_completions(organization_id);
  END IF;
END $$;

-- ============================================
-- RLS POLICIES FOR MULTI-TENANT TABLES
-- ============================================

-- LEADS: Only access leads in user's organization
DROP POLICY IF EXISTS "Users can view leads in their organization" ON public.leads;
CREATE POLICY "Users can view leads in their organization"
ON public.leads
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create leads in their organization" ON public.leads;
CREATE POLICY "Users can create leads in their organization"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update leads in their organization" ON public.leads;
CREATE POLICY "Users can update leads in their organization"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete leads in their organization" ON public.leads;
CREATE POLICY "Users can delete leads in their organization"
ON public.leads
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

-- BUSINESS_METRICS: Only access metrics in user's organization
DROP POLICY IF EXISTS "Users can view metrics in their organization" ON public.business_metrics;
CREATE POLICY "Users can view metrics in their organization"
ON public.business_metrics
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create metrics in their organization" ON public.business_metrics;
CREATE POLICY "Users can create metrics in their organization"
ON public.business_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own metrics" ON public.business_metrics;
CREATE POLICY "Users can update their own metrics"
ON public.business_metrics
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() AND
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

-- OBJECTIVES (OKRs): Only access objectives in user's organization
DROP POLICY IF EXISTS "Users can view objectives in their organization" ON public.objectives;
CREATE POLICY "Users can view objectives in their organization"
ON public.objectives
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create objectives in their organization" ON public.objectives;
CREATE POLICY "Users can create objectives in their organization"
ON public.objectives
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update objectives in their organization" ON public.objectives;
CREATE POLICY "Users can update objectives in their organization"
ON public.objectives
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

-- TASKS: Only access tasks in user's organization
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
CREATE POLICY "Users can view tasks in their organization"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create tasks in their organization" ON public.tasks;
CREATE POLICY "Users can create tasks in their organization"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update tasks in their organization" ON public.tasks;
CREATE POLICY "Users can update tasks in their organization"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);