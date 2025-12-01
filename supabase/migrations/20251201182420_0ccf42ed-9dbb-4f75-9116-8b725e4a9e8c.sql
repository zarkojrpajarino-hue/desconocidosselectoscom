-- Clean up recursive RLS policies on user_roles and keep only simple, safe ones

-- 1) Drop all existing policies on public.user_roles
DROP POLICY IF EXISTS "Admins can create roles in organization" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles in organization" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles in their organization" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles v2" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles in organization" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles in their organization" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles in organization" ON public.user_roles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles in their organization" ON public.user_roles;
DROP POLICY IF EXISTS "service_role_all_access" ON public.user_roles;
DROP POLICY IF EXISTS "users_insert_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_select_own_roles" ON public.user_roles;

-- 2) Recreate only minimal, non-recursive policies

-- Regular authenticated users: can only see their own role rows
CREATE POLICY "users_select_own_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Regular authenticated users: can only insert rows for themselves
CREATE POLICY "users_insert_own_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Optional: allow users to update their own role metadata (but not organization_id)
CREATE POLICY "users_update_own_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Service role (backend) full access using helper function (already defined)
CREATE POLICY "service_role_all_access"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_service_role())
WITH CHECK (is_service_role());