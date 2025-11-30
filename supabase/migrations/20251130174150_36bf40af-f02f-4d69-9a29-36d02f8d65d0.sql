-- =====================================================
-- SISTEMA DE ROLES Y INVITACIONES
-- =====================================================

-- Crear enum para roles predefinidos (extensible)
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'marketing',
  'ventas',
  'finanzas',
  'operaciones',
  'producto',
  'rrhh',
  'legal',
  'soporte',
  'custom'
);

-- Tabla de roles de usuario (segura con RLS)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  role_name TEXT, -- Nombre personalizado para roles custom
  role_description TEXT, -- Descripción del rol custom
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Habilitar RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función segura para verificar rol (SECURITY DEFINER evita recursión en RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Función para obtener organización del usuario
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Función para contar usuarios en organización
CREATE OR REPLACE FUNCTION public.count_organization_users(_org_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT user_id)::INTEGER
  FROM public.user_roles
  WHERE organization_id = _org_id
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Users can view roles in their organization"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_organization(auth.uid())
);

CREATE POLICY "Admins can insert roles in their organization"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.get_user_organization(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin')
    OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE organization_id = user_roles.organization_id)
  )
);

CREATE POLICY "Admins can update roles in their organization"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  organization_id = public.get_user_organization(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- Tabla de invitaciones
CREATE TABLE public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(organization_id)
);

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations in their organization"
ON public.organization_invitations FOR ALL
TO authenticated
USING (
  organization_id = public.get_user_organization(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view active invitations by token"
ON public.organization_invitations FOR SELECT
TO authenticated
USING (is_active = true);

-- Agregar campos a organizations para restricciones de IA
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS ai_analysis_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_ai_analysis_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');

-- Agregar organization_id a users si no existe
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Función para verificar si puede hacer análisis IA
CREATE OR REPLACE FUNCTION public.can_use_ai_analysis(_user_id UUID)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org_id UUID;
  org_record RECORD;
  is_admin BOOLEAN;
  days_since_last INTEGER;
BEGIN
  -- Obtener organización del usuario
  SELECT organization_id INTO user_org_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  IF user_org_id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'No tienes una organización asignada'
    );
  END IF;
  
  -- Verificar si es admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Solo el administrador puede usar el análisis con IA'
    );
  END IF;
  
  -- Obtener datos de la organización
  SELECT * INTO org_record
  FROM public.organizations
  WHERE id = user_org_id;
  
  -- Si está en plan de pago, permitir siempre
  IF org_record.plan != 'free' THEN
    RETURN jsonb_build_object('allowed', true);
  END IF;
  
  -- Plan gratuito: verificar límites
  IF org_record.ai_analysis_count >= 1 THEN
    -- Verificar si pasó 1 semana desde último análisis
    IF org_record.last_ai_analysis_at IS NOT NULL THEN
      days_since_last := EXTRACT(DAY FROM (NOW() - org_record.last_ai_analysis_at));
      
      IF days_since_last < 7 THEN
        RETURN jsonb_build_object(
          'allowed', false,
          'reason', format('En el plan gratuito solo puedes hacer 1 análisis por semana. Quedan %s días.', 7 - days_since_last),
          'days_remaining', 7 - days_since_last
        );
      END IF;
    END IF;
  END IF;
  
  RETURN jsonb_build_object('allowed', true);
END;
$$;

-- Función para registrar uso de análisis IA
CREATE OR REPLACE FUNCTION public.register_ai_analysis_usage(_user_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org_id UUID;
BEGIN
  SELECT organization_id INTO user_org_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  IF user_org_id IS NOT NULL THEN
    UPDATE public.organizations
    SET 
      ai_analysis_count = ai_analysis_count + 1,
      last_ai_analysis_at = NOW()
    WHERE id = user_org_id;
  END IF;
END;
$$;

-- Trigger para actualizar updated_at en user_roles
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at_trigger
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION update_user_roles_updated_at();

-- Índices para mejor rendimiento
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_organization_id ON public.user_roles(organization_id);
CREATE INDEX idx_organization_invitations_token ON public.organization_invitations(token);
CREATE INDEX idx_organizations_plan ON public.organizations(plan);