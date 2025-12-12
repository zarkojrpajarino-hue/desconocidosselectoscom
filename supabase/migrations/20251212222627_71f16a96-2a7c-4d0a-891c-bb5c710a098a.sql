-- =====================================================
-- FIX SECURITY ISSUES: Tighten RLS Policies
-- =====================================================

-- 1. FIX: users table - restrict to organization members only
-- Drop overly permissive policies first
DROP POLICY IF EXISTS "Authenticated users can view users" ON public.users;
DROP POLICY IF EXISTS "Users can view users" ON public.users;
DROP POLICY IF EXISTS "Public read access" ON public.users;
DROP POLICY IF EXISTS "users_select_org" ON public.users;

-- Create restrictive policy: users can only see themselves or organization members
CREATE POLICY "users_select_org_members" ON public.users
FOR SELECT USING (
  id = auth.uid() OR
  id IN (
    SELECT ur.user_id FROM public.user_roles ur 
    WHERE ur.organization_id IN (
      SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- 2. FIX: integration_tokens - restrict to owner only
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.integration_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.integration_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.integration_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.integration_tokens;
DROP POLICY IF EXISTS "tokens_owner_only" ON public.integration_tokens;

CREATE POLICY "integration_tokens_owner_only" ON public.integration_tokens
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. FIX: google_calendar_tokens - restrict to owner only
DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "google_tokens_owner_only" ON public.google_calendar_tokens;

CREATE POLICY "google_calendar_tokens_owner_only" ON public.google_calendar_tokens
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. FIX: hubspot_accounts - restrict to organization admins only
DROP POLICY IF EXISTS "Organization admins can manage HubSpot" ON public.hubspot_accounts;
DROP POLICY IF EXISTS "hubspot_admin_only" ON public.hubspot_accounts;

CREATE POLICY "hubspot_accounts_org_admin_only" ON public.hubspot_accounts
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 5. FIX: asana_accounts - restrict to organization admins only
DROP POLICY IF EXISTS "Organization admins can manage Asana" ON public.asana_accounts;
DROP POLICY IF EXISTS "asana_admin_only" ON public.asana_accounts;

CREATE POLICY "asana_accounts_org_admin_only" ON public.asana_accounts
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 6. FIX: outlook_accounts - restrict to owner only
DROP POLICY IF EXISTS "Users can manage their own Outlook account" ON public.outlook_accounts;
DROP POLICY IF EXISTS "outlook_owner_only" ON public.outlook_accounts;

CREATE POLICY "outlook_accounts_owner_only" ON public.outlook_accounts
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());