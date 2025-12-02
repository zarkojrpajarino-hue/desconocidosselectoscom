-- Tabla para registro de emails que ya usaron trial
-- Esto previene que el mismo email cree múltiples trials

CREATE TABLE IF NOT EXISTS public.trial_email_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_trial_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_trial_email_registry_email ON public.trial_email_registry(email);
CREATE INDEX IF NOT EXISTS idx_trial_email_registry_user_id ON public.trial_email_registry(user_id);

-- Enable RLS
ALTER TABLE public.trial_email_registry ENABLE ROW LEVEL SECURITY;

-- Solo el sistema puede insertar (desde edge functions)
CREATE POLICY "System can insert trial registry" ON public.trial_email_registry
  FOR INSERT WITH CHECK (true);

-- Solo admins pueden leer
CREATE POLICY "Admins can view trial registry" ON public.trial_email_registry
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

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
  -- Buscar si el email ya usó trial
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

-- Función para registrar un nuevo trial
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
  
  -- Insertar nuevo registro
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

-- Trigger para registrar automáticamente al crear organización en trial/free
CREATE OR REPLACE FUNCTION public.auto_register_trial_on_org_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Solo registrar si el plan es trial o free
  IF NEW.plan IN ('trial', 'free') THEN
    -- Obtener email del usuario que creó la org
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.created_by;
    
    IF user_email IS NOT NULL THEN
      -- Registrar el email (ignorar si ya existe)
      INSERT INTO trial_email_registry (email, organization_id, user_id)
      VALUES (LOWER(user_email), NEW.id, NEW.created_by)
      ON CONFLICT (email) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger solo si no existe
DROP TRIGGER IF EXISTS trigger_auto_register_trial ON public.organizations;
CREATE TRIGGER trigger_auto_register_trial
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_register_trial_on_org_create();