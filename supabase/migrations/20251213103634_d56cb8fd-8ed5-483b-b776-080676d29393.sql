-- Drop the overly permissive SELECT policy on okr_updates
DROP POLICY IF EXISTS "Everyone can view updates" ON okr_updates;

-- Create a properly scoped policy that only allows users to view updates in their organization
CREATE POLICY "Users can view updates in their org" ON okr_updates
FOR SELECT USING (
  key_result_id IN (
    SELECT kr.id FROM key_results kr
    JOIN objectives o ON o.id = kr.objective_id
    WHERE o.organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);