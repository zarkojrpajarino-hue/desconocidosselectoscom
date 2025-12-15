-- =====================================================
-- FIX: Overly Permissive RLS Policies on Gamification/Analytics Tables
-- =====================================================
-- These policies previously used USING (true) WITH CHECK (true) which allowed
-- any authenticated user to manipulate gamification data. Now restricting to
-- service_role only (for backend operations) or user's own records.

-- First, drop the overly permissive policies

-- user_achievements
DROP POLICY IF EXISTS "System can manage achievements" ON public.user_achievements;

-- user_badges  
DROP POLICY IF EXISTS "System can insert user badges" ON public.user_badges;

-- points_history
DROP POLICY IF EXISTS "System can insert points" ON public.points_history;

-- user_cohorts
DROP POLICY IF EXISTS "System can manage user cohorts" ON public.user_cohorts;

-- cohort_metrics
DROP POLICY IF EXISTS "System can manage cohort metrics" ON public.cohort_metrics;

-- =====================================================
-- Create secure replacement policies
-- =====================================================

-- user_achievements: Users can view their own, only service_role can modify
CREATE POLICY "Users can view own achievements"
ON public.user_achievements FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role manages achievements"
ON public.user_achievements FOR ALL
TO authenticated
USING (public.is_service_role())
WITH CHECK (public.is_service_role());

-- user_badges: Users can view their own, only service_role can insert
CREATE POLICY "Users can view own badges"
ON public.user_badges FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role inserts badges"
ON public.user_badges FOR INSERT
TO authenticated
WITH CHECK (public.is_service_role());

-- points_history: Users can view their own, only service_role can insert
CREATE POLICY "Users can view own points"
ON public.points_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role inserts points"
ON public.points_history FOR INSERT
TO authenticated
WITH CHECK (public.is_service_role());

-- user_cohorts: Only service_role can manage (analytics data)
CREATE POLICY "Service role manages user cohorts"
ON public.user_cohorts FOR ALL
TO authenticated
USING (public.is_service_role())
WITH CHECK (public.is_service_role());

-- cohort_metrics: Org members can view, only service_role can modify
CREATE POLICY "Org members can view cohort metrics"
ON public.cohort_metrics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.organization_id = cohort_metrics.organization_id
  )
);

CREATE POLICY "Service role manages cohort metrics"
ON public.cohort_metrics FOR ALL
TO authenticated
USING (public.is_service_role())
WITH CHECK (public.is_service_role());

-- =====================================================
-- FIX: Third-Party API Keys - Restrict client access to tokens
-- Only allow users to see connection status, not actual tokens
-- =====================================================

-- Update asana_accounts RLS - users can only see non-sensitive fields
DROP POLICY IF EXISTS "Users can view org asana accounts" ON public.asana_accounts;
DROP POLICY IF EXISTS "Users can manage org asana accounts" ON public.asana_accounts;

-- Create function to get connection status without exposing tokens
CREATE OR REPLACE FUNCTION public.get_asana_connection_status(org_id uuid)
RETURNS TABLE(
  id uuid,
  organization_id uuid,
  workspace_id text,
  workspace_name text,
  project_id text,
  project_name text,
  sync_enabled boolean,
  last_sync_at timestamptz,
  last_sync_status text,
  is_connected boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id,
    a.organization_id,
    a.workspace_id,
    a.workspace_name,
    a.project_id,
    a.project_name,
    a.sync_enabled,
    a.last_sync_at,
    a.last_sync_status,
    (a.access_token IS NOT NULL AND a.access_token != '') as is_connected
  FROM public.asana_accounts a
  WHERE a.organization_id = org_id;
$$;

-- Update trello_accounts RLS similarly (using actual columns)
DROP POLICY IF EXISTS "Users can view org trello accounts" ON public.trello_accounts;
DROP POLICY IF EXISTS "Users can manage org trello accounts" ON public.trello_accounts;

CREATE OR REPLACE FUNCTION public.get_trello_connection_status(org_id uuid)
RETURNS TABLE(
  id uuid,
  organization_id uuid,
  board_id text,
  board_name text,
  list_mapping jsonb,
  sync_enabled boolean,
  last_sync_at timestamptz,
  last_sync_status text,
  is_connected boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.organization_id,
    t.board_id,
    t.board_name,
    t.list_mapping,
    t.sync_enabled,
    t.last_sync_at,
    t.last_sync_status,
    (t.api_key IS NOT NULL AND t.api_key != '') as is_connected
  FROM public.trello_accounts t
  WHERE t.organization_id = org_id;
$$;

-- Restrict direct table access to service_role only for token tables
CREATE POLICY "Service role only for asana accounts"
ON public.asana_accounts FOR ALL
TO authenticated
USING (public.is_service_role())
WITH CHECK (public.is_service_role());

CREATE POLICY "Service role only for trello accounts"
ON public.trello_accounts FOR ALL
TO authenticated
USING (public.is_service_role())
WITH CHECK (public.is_service_role());