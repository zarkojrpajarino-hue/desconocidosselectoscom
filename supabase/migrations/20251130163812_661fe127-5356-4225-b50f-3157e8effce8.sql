-- =========================================
-- MIGRATION: Multi-Tenant Architecture
-- =========================================

-- 1. CREATE organizations TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  company_size TEXT NOT NULL,
  annual_revenue_range TEXT,
  
  -- Onboarding data
  business_description TEXT NOT NULL,
  target_customers TEXT NOT NULL,
  value_proposition TEXT NOT NULL,
  sales_process TEXT NOT NULL,
  sales_cycle_days INTEGER,
  lead_sources JSONB NOT NULL DEFAULT '[]',
  products_services JSONB NOT NULL DEFAULT '[]',
  team_structure JSONB NOT NULL DEFAULT '[]',
  main_objectives TEXT NOT NULL,
  kpis_to_measure JSONB NOT NULL DEFAULT '[]',
  current_problems TEXT NOT NULL,
  
  -- Contact info
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  
  -- AI Generation
  ai_generation_status TEXT NOT NULL DEFAULT 'pending',
  ai_generation_completed_at TIMESTAMPTZ,
  ai_generation_error TEXT,
  
  -- Subscription
  plan TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ADD organization_id TO users TABLE
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 3. ADD organization_id TO EXISTING TABLES
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.objectives 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.business_metrics 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 4. ENABLE RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR organizations
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own organization"
  ON public.organizations FOR UPDATE
  USING (id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- 6. UPDATE RLS POLICIES FOR EXISTING TABLES
-- Tasks: only see tasks from their organization
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view tasks from their organization"
  ON public.tasks FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

-- Leads: only see leads from their organization
DROP POLICY IF EXISTS "Admins and leaders can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view their assigned leads" ON public.leads;
CREATE POLICY "Users can view leads from their organization"
  ON public.leads FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
    OR assigned_to = auth.uid()
  );

-- Objectives: only see OKRs from their organization
DROP POLICY IF EXISTS "OKRs are viewable by everyone" ON public.objectives;
CREATE POLICY "Users can view OKRs from their organization"
  ON public.objectives FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- 7. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_objectives_organization_id ON public.objectives(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(ai_generation_status);

-- 8. TRIGGER FOR updated_at
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();