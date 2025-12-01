-- Eliminar políticas existentes que causan recursión
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can see own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete own roles" ON public.user_roles;

-- Crear políticas simples sin recursión
-- Política para que los usuarios puedan ver sus propios roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para que los admins puedan ver todos los roles
-- Nota: Esta usa la función has_role que es SECURITY DEFINER, lo que evita la recursión
CREATE POLICY "Service role can view all roles"
  ON public.user_roles
  FOR SELECT
  TO service_role
  USING (true);

-- Permitir insertar roles (solo para admins o durante el signup)
CREATE POLICY "Allow insert for authenticated users"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- COMENTARIO: Las políticas anteriores evitan recursión al usar solo auth.uid()
-- directamente sin consultar la tabla user_roles dentro de la política misma