-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN - OPTIMUS-K Multi-Organizaciones (Parte 1)
-- ═══════════════════════════════════════════════════════════════════════════

-- PARTE 1: Agregar columna created_by a organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Índice para created_by
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

-- PARTE 2: FIX SIGNUP - Política RLS de INSERT (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Enable insert for authenticated users during signup'
  ) THEN
    CREATE POLICY "Enable insert for authenticated users during signup"
      ON public.users
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- PARTE 3: Mejorar función handle_new_user
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
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName', 
    SPLIT_PART(NEW.email, '@', 1)
  );

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

  IF EXISTS (SELECT 1 FROM public.users WHERE username = v_username) THEN
    v_username := v_username || '_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;

  INSERT INTO public.users (id, email, full_name, username, role)
  VALUES (NEW.id, NEW.email, v_full_name, v_username, 'member')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- PARTE 4: Actualizar constraint de plan
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_plan_check 
CHECK (plan IN ('trial', 'free', 'starter', 'professional', 'enterprise'));

-- PARTE 5: Tabla trial_email_registry
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

CREATE INDEX IF NOT EXISTS idx_trial_email_registry_email ON public.trial_email_registry(email);
CREATE INDEX IF NOT EXISTS idx_trial_email_registry_user_id ON public.trial_email_registry(user_id);

ALTER TABLE public.trial_email_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all trial registrations" ON public.trial_email_registry;
CREATE POLICY "Admins can view all trial registrations"
  ON public.trial_email_registry FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view their own trial registration" ON public.trial_email_registry;
CREATE POLICY "Users can view their own trial registration"
  ON public.trial_email_registry FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert trial registrations" ON public.trial_email_registry;
CREATE POLICY "System can insert trial registrations"
  ON public.trial_email_registry FOR INSERT WITH CHECK (true);

-- PARTE 6: Funciones auxiliares
CREATE OR REPLACE FUNCTION public.can_use_trial(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_record trial_email_registry%ROWTYPE;
BEGIN
  SELECT * INTO existing_record FROM trial_email_registry WHERE email = LOWER(user_email);
  
  IF existing_record IS NOT NULL THEN
    RETURN json_build_object(
      'can_use_trial', false,
      'already_used', true,
      'message', 'Este email ya utilizó el periodo de prueba gratuito',
      'used_at', existing_record.first_trial_started_at
    );
  ELSE
    RETURN json_build_object(
      'can_use_trial', true,
      'already_used', false,
      'message', 'Email válido para trial'
    );
  END IF;
END;
$$;

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
BEGIN
  IF EXISTS (SELECT 1 FROM trial_email_registry WHERE email = LOWER(user_email)) THEN
    RETURN json_build_object('success', false, 'message', 'Este email ya tiene un trial registrado');
  END IF;
  
  INSERT INTO trial_email_registry (email, organization_id, user_id, ip_address, user_agent)
  VALUES (LOWER(user_email), org_id, user_id_param, ip_addr, user_agent_param)
  RETURNING * INTO new_record;
  
  RETURN json_build_object('success', true, 'message', 'Trial registrado correctamente', 'record_id', new_record.id);
END;
$$;

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
    COALESCE(o.name, '')::TEXT as slug,
    o.plan,
    o.subscription_status,
    o.current_period_end,
    o.created_at,
    (o.created_by = p_user_id) as is_owner
  FROM public.organizations o
  WHERE o.created_by = p_user_id
     OR o.id IN (SELECT organization_id FROM public.user_roles WHERE user_id = p_user_id)
  ORDER BY o.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(p_email));
END;
$$;