-- FIX: trial_email_exposure
-- Restrict admin visibility to own organization only instead of all organizations

DROP POLICY IF EXISTS "Admins can view all trial registrations" ON trial_email_registry;

CREATE POLICY "Admins view org trial registrations only" ON trial_email_registry
  FOR SELECT USING (
    -- Users can see their own trial registration
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Admins can only see registrations from their own organization
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.organization_id = trial_email_registry.organization_id
    )
  );