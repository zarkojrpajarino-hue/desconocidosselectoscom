-- =====================================================
-- FIX: Add proper user-scoped RLS to onboarding_submissions
-- Table uses user_id (not organization_id) for access control
-- =====================================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Admin can view submissions" ON public.onboarding_submissions;
DROP POLICY IF EXISTS "onboarding_submissions_org" ON public.onboarding_submissions;
DROP POLICY IF EXISTS "onboarding_submissions_select" ON public.onboarding_submissions;
DROP POLICY IF EXISTS "Public insert" ON public.onboarding_submissions;

-- Create user-scoped SELECT policy
-- Users can only view their own onboarding submission
CREATE POLICY "onboarding_submissions_own_select" ON public.onboarding_submissions
FOR SELECT USING (
  user_id = auth.uid()
);

-- Service role and admin can view all (for admin dashboards)
CREATE POLICY "onboarding_submissions_admin_select" ON public.onboarding_submissions
FOR SELECT USING (
  public.is_service_role() OR public.is_admin_or_leader(auth.uid())
);

-- Public INSERT for onboarding (needed during signup flow before user is authenticated)
CREATE POLICY "onboarding_submissions_public_insert" ON public.onboarding_submissions
FOR INSERT WITH CHECK (true);

-- Users can only update their own submission
CREATE POLICY "onboarding_submissions_own_update" ON public.onboarding_submissions
FOR UPDATE USING (user_id = auth.uid());