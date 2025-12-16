-- Add explicit authentication checks to users table SELECT policies
-- This ensures unauthenticated requests cannot read user data

-- Drop existing users SELECT policies
DROP POLICY IF EXISTS "users_select_org_members" ON public.users;
DROP POLICY IF EXISTS "users_select_policy_v2" ON public.users;
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.users;
DROP POLICY IF EXISTS "Users can view users in their organization" ON public.users;

-- Create consolidated users SELECT policy with explicit auth check
CREATE POLICY "users_select_org_members_authenticated" 
  ON public.users 
  FOR SELECT 
  USING (
    -- Explicitly require authentication
    auth.uid() IS NOT NULL
    AND (
      -- User can view their own profile
      id = auth.uid()
      OR
      -- User can view members of their organization(s)
      organization_id IN (
        SELECT ur.organization_id 
        FROM user_roles ur 
        WHERE ur.user_id = auth.uid()
      )
    )
  );