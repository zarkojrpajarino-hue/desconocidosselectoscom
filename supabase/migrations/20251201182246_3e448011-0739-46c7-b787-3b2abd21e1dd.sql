-- Eliminar TODAS las políticas existentes de user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can view all" ON public.user_roles;

-- Crear política super simple SOLO para SELECT basada en auth.uid()
-- Sin ningún tipo de JOIN ni subquery
CREATE POLICY "users_select_own_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Permitir INSERT solo si el user_id coincide con el usuario autenticado
CREATE POLICY "users_insert_own_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política administrativa usando security definer function
-- Crear función helper primero
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
$$;

-- Permitir todo al service_role
CREATE POLICY "service_role_all_access"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_service_role())
WITH CHECK (is_service_role());