-- Fix vulnerable RLS policy on users table
-- The current policy uses (auth.uid() IS NOT NULL) which is redundant and potentially confusing
-- The fix removes this check and relies solely on ownership/membership validation

-- Drop the existing vulnerable policy
DROP POLICY IF EXISTS "users_select_org_members_authenticated" ON users;

-- Create the corrected policy that properly restricts access
-- Users can only see their own data OR data of users in organizations they belong to
CREATE POLICY "users_select_own_or_org_members"
  ON users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );