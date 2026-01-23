-- =====================================================
-- FIX ERROR-LEVEL SECURITY ISSUES
-- =====================================================

-- 1. FIX: users_table_public_exposure
-- Restrict users table to only show own profile or organization members with proper auth
DROP POLICY IF EXISTS "users_select_own_or_org" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view users in same organization" ON users;
DROP POLICY IF EXISTS "users_select_authenticated_only" ON users;

CREATE POLICY "users_select_authenticated_only" ON users
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_roles ur1
        WHERE ur1.user_id = auth.uid()
        AND ur1.organization_id IN (
          SELECT ur2.organization_id FROM user_roles ur2 WHERE ur2.user_id = users.id
        )
      )
    )
  );

-- 2. FIX: leads_table_contact_exposure
-- Restrict leads to assigned reps, creators, or admins only
DROP POLICY IF EXISTS "leads_select_restricted" ON leads;
DROP POLICY IF EXISTS "Users can view leads in their organization" ON leads;
DROP POLICY IF EXISTS "leads_select_org" ON leads;

CREATE POLICY "leads_select_restricted" ON leads
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      assigned_to = auth.uid() OR
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.organization_id = leads.organization_id
        AND ur.role = 'admin'
      )
    )
  );

-- Update leads INSERT policy
DROP POLICY IF EXISTS "Users can create leads" ON leads;
DROP POLICY IF EXISTS "Users can create leads in their organization" ON leads;

CREATE POLICY "leads_insert_org_member" ON leads
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.organization_id = leads.organization_id
    )
  );

-- Update leads UPDATE policy
DROP POLICY IF EXISTS "Users can update leads" ON leads;
DROP POLICY IF EXISTS "Users can update leads in their organization" ON leads;

CREATE POLICY "leads_update_restricted" ON leads
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      assigned_to = auth.uid() OR
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.organization_id = leads.organization_id
        AND ur.role = 'admin'
      )
    )
  );

-- Update leads DELETE policy
DROP POLICY IF EXISTS "Users can delete leads" ON leads;
DROP POLICY IF EXISTS "Users can delete leads in their organization" ON leads;

CREATE POLICY "leads_delete_restricted" ON leads
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.organization_id = leads.organization_id
        AND ur.role = 'admin'
      )
    )
  );

-- 3. FIX: with_check_true_policies
-- 3a. audit_log - CRITICAL: Restrict to service_role only
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_log;
DROP POLICY IF EXISTS "Service role inserts audit logs" ON audit_log;

CREATE POLICY "audit_log_insert_service_role_only" ON audit_log
  FOR INSERT WITH CHECK (
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- 3b. notifications - Restrict to service_role OR own notifications
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Service role or self insert notifications" ON notifications;

CREATE POLICY "notifications_insert_restricted" ON notifications
  FOR INSERT WITH CHECK (
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- 3c. calendar_event_mappings - Restrict to service_role OR own mappings
DROP POLICY IF EXISTS "System can insert calendar mappings" ON calendar_event_mappings;
DROP POLICY IF EXISTS "calendar_event_mappings_insert_restricted" ON calendar_event_mappings;

CREATE POLICY "calendar_event_mappings_insert_restricted" ON calendar_event_mappings
  FOR INSERT WITH CHECK (
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- 3d. trial_email_registry - Require email validation
DROP POLICY IF EXISTS "System can insert trial registrations" ON trial_email_registry;
DROP POLICY IF EXISTS "trial_email_registry_insert_restricted" ON trial_email_registry;

CREATE POLICY "trial_email_registry_insert_restricted" ON trial_email_registry
  FOR INSERT WITH CHECK (
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR (
      auth.uid() IS NOT NULL 
      AND user_id = auth.uid() 
      AND email IS NOT NULL 
      AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
  );

-- 3e. onboarding_submissions - Add email validation (needed for public signup)
-- Uses contact_email column
DROP POLICY IF EXISTS "onboarding_submissions_public_insert" ON onboarding_submissions;
DROP POLICY IF EXISTS "onboarding_submissions_insert_validated" ON onboarding_submissions;

CREATE POLICY "onboarding_submissions_insert_validated" ON onboarding_submissions
  FOR INSERT WITH CHECK (
    contact_email IS NOT NULL 
    AND contact_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- 3f. tool_suggestions - Restrict to authenticated users only
DROP POLICY IF EXISTS "Users can insert suggestions" ON tool_suggestions;
DROP POLICY IF EXISTS "tool_suggestions_insert_authenticated" ON tool_suggestions;

CREATE POLICY "tool_suggestions_insert_authenticated" ON tool_suggestions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );