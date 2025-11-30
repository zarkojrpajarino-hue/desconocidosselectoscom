-- Arreglar recursión infinita en RLS de users
-- El problema es que las políticas de users causan recursión cuando se hacen JOINs desde leads

-- Primero, eliminar políticas existentes que causan recursión
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view organization members" ON public.users;
DROP POLICY IF EXISTS "Users can view all users" ON public.users;

-- Crear política simple para SELECT que evita recursión
-- Permitir que usuarios autenticados vean otros usuarios de su organización
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    organization_id IN (
      SELECT organization_id 
      FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
  );

-- Permitir que usuarios actualicen solo sus propios datos
CREATE POLICY "users_update_own_policy" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permitir inserción solo si el ID coincide con el usuario autenticado
CREATE POLICY "users_insert_own_policy" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);