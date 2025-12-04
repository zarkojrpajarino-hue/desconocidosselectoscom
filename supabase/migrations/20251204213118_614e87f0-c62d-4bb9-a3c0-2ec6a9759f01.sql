-- Fix overly permissive RLS policy on okr_task_links table
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can manage OKR-task links" ON okr_task_links;
DROP POLICY IF EXISTS "Users can manage OKR links in their organization" ON okr_task_links;

-- Create organization-scoped RLS policies for okr_task_links
-- SELECT: Users can view links for OKRs in their organization
CREATE POLICY "Users can view OKR links in their organization"
ON okr_task_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM key_results kr
    JOIN objectives o ON o.id = kr.objective_id
    WHERE kr.id = okr_task_links.key_result_id
    AND o.organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);

-- INSERT: Users can create links for OKRs in their organization
CREATE POLICY "Users can insert OKR links in their organization"
ON okr_task_links FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM key_results kr
    JOIN objectives o ON o.id = kr.objective_id
    WHERE kr.id = okr_task_links.key_result_id
    AND o.organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);

-- UPDATE: Users can update links for OKRs in their organization
CREATE POLICY "Users can update OKR links in their organization"
ON okr_task_links FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM key_results kr
    JOIN objectives o ON o.id = kr.objective_id
    WHERE kr.id = okr_task_links.key_result_id
    AND o.organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);

-- DELETE: Users can delete links for OKRs in their organization
CREATE POLICY "Users can delete OKR links in their organization"
ON okr_task_links FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM key_results kr
    JOIN objectives o ON o.id = kr.objective_id
    WHERE kr.id = okr_task_links.key_result_id
    AND o.organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);