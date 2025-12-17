-- Drop old policy that uses users.organization_id
DROP POLICY IF EXISTS "Users can view pipeline stages from their organization" ON public.pipeline_stages;

-- Create new policy using user_roles for multi-org support
CREATE POLICY "Users can view pipeline stages in their organization"
ON public.pipeline_stages
FOR SELECT
USING (
  organization_id IN (
    SELECT ur.organization_id 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

-- Add INSERT policy for admins
CREATE POLICY "Admins can create pipeline stages"
ON public.pipeline_stages
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT ur.organization_id 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Add UPDATE policy for admins
CREATE POLICY "Admins can update pipeline stages"
ON public.pipeline_stages
FOR UPDATE
USING (
  organization_id IN (
    SELECT ur.organization_id 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Add DELETE policy for admins
CREATE POLICY "Admins can delete pipeline stages"
ON public.pipeline_stages
FOR DELETE
USING (
  organization_id IN (
    SELECT ur.organization_id 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);