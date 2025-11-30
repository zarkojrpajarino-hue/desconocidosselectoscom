-- Remove old recursive RLS policy on users table that causes "infinite recursion" errors
DROP POLICY IF EXISTS "Users can view users from their organization" ON public.users;