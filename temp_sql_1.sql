-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN COMPLETA - OPTIMUS-K
-- Fix Signup + Multi-Organizaciones + Free Trial
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- PARTE 1: FIX SIGNUP - Política RLS de INSERT
-- ─────────────────────────────────────────────────────────────────────────

-- Permitir que usuarios autenticados creen su propio perfil durante signup
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users during signup"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "Enable insert for authenticated users during signup" ON public.users IS 
'Permite a usuarios autenticados crear su propio perfil durante el signup. Requerido para que el trigger handle_new_user() funcione correctamente.';

-- ─────────────────────────────────────────────────────────────────────────
-- PARTE 2: Mejorar función handle_new_user con mejor manejo de errores
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
BEGIN
  -- Extraer full_name de metadata o usar email
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName', 
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Generar username desde full_name o email
  v_username := LOWER(REGEXP_REPLACE(
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      REGEXP_REPLACE(v_full_name, '[^a-zA-Z0-9]', '_', 'g'),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    '[^a-z0-9_]',
    '_',
    'g'
  ));

  -- Hacer username único agregando sufijo si es necesario
  IF EXISTS (SELECT 1 FROM public.users WHERE username = v_username) THEN
    v_username := v_username || '_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;

  -- Insertar en public.users con todos los campos necesarios
  INSERT INTO public.users (
    id, 
    email, 
    full_name,
    username,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_username,
    'member' -- Rol por defecto
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero no fallar el signup
    RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 
'Crea automáticamente un registro en public.users cuando se crea un usuario en auth.users. Incluye generación automática de username único y manejo de errores para no bloquear el signup si falla.';

-- ─────────────────────────────────────────────────────────────────────────
-- PARTE 3: Asegurar que trigger existe
-- ─────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- PARTE 4: Actualizar tabla organizations para multi-org
-- ─────────────────────────────────────────────────────────────────────────

-- Agregar columnas de Stripe si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN stripe_customer_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN current_period_end TIMESTAMPTZ;
  END IF;
END $$;

-- Actualizar check constraint para incluir nuevos planes
ALTER TABLE public.organizations 
DROP CONSTRAINT IF EXISTS organizations_plan_check;

ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_plan_check 
CHECK (plan IN ('trial', 'free', 'starter', 'professional', 'enterprise'));

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer 
ON public.organizations(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription 
ON public.organizations(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_organizations_created_by 
ON public.organizations(created_by);

COMMENT ON COLUMN public.organizations.stripe_customer_id IS 
'ID del cliente en Stripe. Puede ser compartido entre múltiples organizaciones del mismo usuario.';

COMMENT ON COLUMN public.organizations.stripe_subscription_id IS 
'ID de la suscripción en Stripe. Único por organización. Cada org tiene su propio plan y suscripción.';

COMMENT ON COLUMN public.organizations.subscription_status IS 
'Estado de la suscripción: active, canceled, past_due, incomplete, trialing, inactive';

COMMENT ON COLUMN public.organizations.current_period_end IS 
'Fecha de fin del periodo actual de facturación';

-- ─────────────────────────────────────────────────────────────────────────
-- PARTE 5: Tabla trial_email_registry (si no existe)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.trial_email_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_trial_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trial_email_registry_email 
ON public.trial_email_registry(email);

CREATE INDEX IF NOT EXISTS idx_trial_email_registry_user_id 
ON public.trial_email_registry(user_id);

-- RLS
ALTER TABLE public.trial_email_registry ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver todos los registros
DROP POLICY IF EXISTS "Admins can view all trial registrations" ON public.trial_email_registry;
CREATE POLICY "Admins can view all trial registrations"
  ON public.trial_email_registry
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Usuarios pueden ver su propio registro
DROP POLICY IF EXISTS "Users can view their own trial registration" ON public.trial_email_registry;
CREATE POLICY "Users can view their own trial registration"
  ON public.trial_email_registry
  FOR SELECT
  USING (user_id = auth.uid());

-- Sistema puede insertar
DROP POLICY IF EXISTS "System can insert trial registrations" ON public.trial_email_registry;
CREATE POLICY "System can insert trial registrations"
  ON public.trial_email_registry
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.trial_email_registry IS 
'Registro de emails que han usado el Free Trial. Un email solo puede usar trial UNA VEZ. Sin límite de organizaciones, pero el trial es único por email.';

-- ─────────────────────────────────────────────────────────────────────────
-- PARTE 6: Funciones auxiliares para Free Trial
-- ─────────────────────────────────────────────────────────────────────────

-- Función para verificar si un email puede usar trial
CREATE OR REPLACE FUNCTION public.can_use_trial(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_record trial_email_registry%ROWTYPE;
  result JSON;
BEGIN
  SELECT * INTO existing_record
  FROM trial_email_registry
  WHERE email = LOWER(user_email);
  
  IF existing_record IS NOT NULL THEN
    result := json_build_object(
      'can_use_trial', false,
      'already_used', true,
      'message', 'Este email ya utilizó el periodo de prueba gratuito',
      'used_at', existing_record.first_trial_started_at
    );
  ELSE
    result := json_build_object(
      'can_use_trial', true,
      'already_used', false,
      'message', 'Email válido para trial'
    );
  END IF;
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.can_use_trial(TEXT) IS 
'Verifica si un email puede usar el Free Trial de 14 días. Retorna JSON con can_use_trial (bool), already_used (bool), message (text), y used_at (timestamp si ya se usó).';

-- Función para registrar uso de trial
CREATE OR REPLACE FUNCTION public.register_trial_email(
  user_email TEXT,
  org_id UUID DEFAULT NULL,
  user_id_param UUID DEFAULT NULL,
  ip_addr TEXT DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_record trial_email_registry%ROWTYPE;
  result JSON;
BEGIN
  -- Verificar si ya existe
  IF EXISTS (SELECT 1 FROM trial_email_registry WHERE email = LOWER(user_email)) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Este email ya tiene un trial registrado'
    );
  END IF;
  
  -- Insertar registro
  INSERT INTO trial_email_registry (
    email,
    organization_id,
    user_id,
    ip_address,
    user_agent
  ) VALUES (
    LOWER(user_email),
    org_id,
    user_id_param,
    ip_addr,
    user_agent_param
  )
  RETURNING * INTO new_record;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Trial registrado correctamente',
    'record_id', new_record.id
  );
END;
$$;

COMMENT ON FUNCTION public.register_trial_email IS 
'Registra que un email ha usado su Free Trial. Se llama cuando usuario selecciona plan Trial en /select-plan. Solo permite un registro por email.';

-- ─────────────────────────────────────────────────────────────────────────
-- PARTE 7: Función para obtener organizaciones de un usuario
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_organizations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  plan TEXT,
  subscription_status TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  is_owner BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.plan,
    o.subscription_status,
    o.current_period_end,
    o.created_at,
    (o.created_by = p_user_id) as is_owner
  FROM public.organizations o
  WHERE o.created_by = p_user_id
     OR o.id IN (
       SELECT organization_id 
       FROM public.user_roles 
       WHERE user_id = p_user_id
     )
  ORDER BY o.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_user_organizations IS 
'Retorna todas las organizaciones de un usuario (como owner o miembro). Usado para mostrar dropdown de organizaciones en header.';

-- ─────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN FINAL
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_policy_count INTEGER;
  v_trigger_exists BOOLEAN;
BEGIN
  -- Verificar políticas en users
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'users' AND schemaname = 'public';
  
  RAISE NOTICE 'Políticas en public.users: %', v_policy_count;
  
  -- Verificar trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) INTO v_trigger_exists;
  
  IF v_trigger_exists THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created existe';
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created NO existe';
  END IF;
  
  RAISE NOTICE '✅ Migración completada exitosamente';
END $$;
