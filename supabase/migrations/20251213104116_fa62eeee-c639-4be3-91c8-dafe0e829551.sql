-- Drop the overly permissive policy on hubspot_sync_queue
DROP POLICY IF EXISTS "System can manage sync queue" ON hubspot_sync_queue;

-- Create a properly scoped policy that requires service_role for all operations
CREATE POLICY "Service role can manage sync queue" ON hubspot_sync_queue
FOR ALL USING (is_service_role())
WITH CHECK (is_service_role());

-- Also allow organization admins to view their sync queue entries for debugging
CREATE POLICY "Org admins can view their sync queue" ON hubspot_sync_queue
FOR SELECT USING (
  hubspot_account_id IN (
    SELECT id FROM hubspot_accounts 
    WHERE organization_id IN (
      SELECT organization_id FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);