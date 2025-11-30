-- FIX 1: Eliminar recursión infinita en políticas RLS
-- El problema: users query user_roles, y user_roles query users = infinite loop

-- Eliminar la política problemática de user_roles que causa recursión
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

-- Crear una política más simple que no cause recursión
-- Solo verificar si el usuario tiene rol admin en user_roles (sin consultar users)
CREATE POLICY "Admins can manage user roles v2"
ON user_roles
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- FIX 2: Simplificar la política de SELECT en users para evitar recursión
-- La política actual consulta user_roles, lo que puede causar recursión
DROP POLICY IF EXISTS "users_select_policy" ON users;

-- Nueva política más simple: usuarios pueden ver su propio perfil
-- y perfiles de su organización (pero sin subconsulta que cause recursión)
CREATE POLICY "users_select_policy_v2"
ON users
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  organization_id = get_user_organization(auth.uid())
);

-- FIX 3: CRÍTICO - Eliminar política que permite ver TODOS los roles (qual:true)
DROP POLICY IF EXISTS "Everyone can view user roles" ON user_roles;

-- FIX 4: CRÍTICO - Arreglar política de key_results que permite actualizar cualquier KR
DROP POLICY IF EXISTS "Everyone can update key results" ON key_results;

-- Nueva política: solo usuarios de la misma organización pueden actualizar KRs
CREATE POLICY "Users can update KRs in their organization"
ON key_results
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM objectives o
    WHERE o.id = key_results.objective_id
    AND o.organization_id = get_user_organization(auth.uid())
  )
);

-- FIX 5: Asegurar que las funciones helper no causen recursión
-- La función get_user_organization debe ser eficiente
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organization_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;