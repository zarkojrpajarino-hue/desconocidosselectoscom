-- Función mejorada para verificar si usuario pertenece a una organización
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- Actualizar política RLS de user_roles para soportar múltiples organizaciones
DROP POLICY IF EXISTS "Users can view roles in their organization" ON public.user_roles;

CREATE POLICY "Users can view roles in their organizations"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  public.user_belongs_to_organization(auth.uid(), organization_id)
);

-- Actualizar política para admins para insertar
DROP POLICY IF EXISTS "Admins can insert roles in their organization" ON public.user_roles;

CREATE POLICY "Admins can insert roles in their organizations"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  public.user_belongs_to_organization(auth.uid(), organization_id)
  AND (
    public.has_role(auth.uid(), 'admin')
    OR NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.organization_id = user_roles.organization_id)
  )
);

-- Actualizar política para admins para actualizar
DROP POLICY IF EXISTS "Admins can update roles in their organization" ON public.user_roles;

CREATE POLICY "Admins can update roles in their organizations"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  public.user_belongs_to_organization(auth.uid(), organization_id)
  AND public.has_role(auth.uid(), 'admin')
);