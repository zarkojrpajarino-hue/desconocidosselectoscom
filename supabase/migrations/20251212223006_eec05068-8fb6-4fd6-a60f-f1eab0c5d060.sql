-- =====================================================
-- FIX: Organizations Table RLS - Use user_roles instead of deprecated users.organization_id
-- =====================================================

-- Drop deprecated policies that reference users.organization_id
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their own organization" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_own" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_own" ON public.organizations;

-- Create correct policies using user_roles table
CREATE POLICY "organizations_select_members" ON public.organizations
FOR SELECT USING (
  id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "organizations_update_admin" ON public.organizations
FOR UPDATE USING (
  id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);