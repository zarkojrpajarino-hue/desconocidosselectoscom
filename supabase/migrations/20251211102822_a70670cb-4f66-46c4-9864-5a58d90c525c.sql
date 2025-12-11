-- Fix key_results RLS policy to restrict to organization members only
DROP POLICY IF EXISTS "Key Results are viewable by everyone" ON key_results;

CREATE POLICY "Key results visible to org members" ON key_results
  FOR SELECT USING (
    objective_id IN (
      SELECT id FROM objectives WHERE organization_id IN (
        SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );