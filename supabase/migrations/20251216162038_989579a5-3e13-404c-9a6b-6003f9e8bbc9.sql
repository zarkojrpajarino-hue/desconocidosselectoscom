
-- =====================================================
-- SISTEMA DE FASES DE NEGOCIO PERSONALIZADAS CON IA
-- =====================================================

-- Tabla principal de fases del negocio
CREATE TABLE IF NOT EXISTS public.business_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Información de la fase
  phase_number INT NOT NULL CHECK (phase_number BETWEEN 1 AND 6),
  phase_name TEXT NOT NULL,
  phase_description TEXT,
  methodology TEXT CHECK (methodology IN ('lean_startup', 'scaling_up', 'hybrid')),
  
  -- Duración y fechas
  duration_weeks INT DEFAULT 6,
  estimated_start DATE,
  estimated_end DATE,
  actual_start DATE,
  actual_end DATE,
  
  -- Objetivos de la fase (vinculados a OKRs existentes)
  objectives JSONB NOT NULL DEFAULT '[]',
  -- Estructura: [{ "name": "15 leads", "metric": "leads", "target": 15, "current": 0, "linked_kr_id": null }]
  
  -- Checklist/Tareas de la fase
  checklist JSONB NOT NULL DEFAULT '[]',
  -- Estructura: [{ "task": "Crear landing", "completed": false, "assigned_to": null, "linked_task_id": null }]
  
  -- Progreso
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
  
  -- Playbooks y recursos
  playbook JSONB DEFAULT '{}',
  -- Estructura: { "title": "", "steps": [], "tips": [], "resources": [] }
  
  -- IA
  generated_by_ai BOOLEAN DEFAULT true,
  ai_context TEXT,
  regeneration_count INT DEFAULT 0,
  last_regenerated_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, phase_number)
);

-- Índices para rendimiento
CREATE INDEX idx_business_phases_org ON business_phases(organization_id);
CREATE INDEX idx_business_phases_status ON business_phases(status);
CREATE INDEX idx_business_phases_org_active ON business_phases(organization_id) WHERE status = 'active';

-- Columnas adicionales para organizations (preguntas nuevas del onboarding)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS business_stage TEXT CHECK (business_stage IN ('startup', 'consolidated')),
ADD COLUMN IF NOT EXISTS startup_stage TEXT,
ADD COLUMN IF NOT EXISTS short_term_goal TEXT,
ADD COLUMN IF NOT EXISTS current_users_count TEXT,
ADD COLUMN IF NOT EXISTS biggest_challenge TEXT,
ADD COLUMN IF NOT EXISTS available_resources TEXT[],
ADD COLUMN IF NOT EXISTS monthly_revenue_range TEXT,
ADD COLUMN IF NOT EXISTS main_goal_6months TEXT,
ADD COLUMN IF NOT EXISTS areas_to_optimize TEXT[];

-- Modificar tabla tasks para vincular con fases
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES business_phases(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS playbook JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS task_category TEXT DEFAULT 'general';

-- Índice para tasks por fase
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase_id);

-- Tabla para historial de retrospectivas de fase
CREATE TABLE IF NOT EXISTS public.phase_retrospectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES business_phases(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Contenido
  what_went_well TEXT[],
  what_to_improve TEXT[],
  action_items JSONB DEFAULT '[]',
  lessons_learned TEXT,
  
  -- Métricas finales
  objectives_achieved INT DEFAULT 0,
  objectives_total INT DEFAULT 0,
  tasks_completed INT DEFAULT 0,
  tasks_total INT DEFAULT 0,
  
  -- IA insights
  ai_insights JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS Policies para business_phases
ALTER TABLE public.business_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view phases in their organization"
ON public.business_phases FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can insert phases"
ON public.business_phases FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can update phases"
ON public.business_phases FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can delete phases"
ON public.business_phases FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS Policies para phase_retrospectives
ALTER TABLE public.phase_retrospectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view retrospectives in their organization"
ON public.phase_retrospectives FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage retrospectives"
ON public.phase_retrospectives FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_business_phases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_business_phases_updated_at
BEFORE UPDATE ON business_phases
FOR EACH ROW
EXECUTE FUNCTION update_business_phases_updated_at();

-- Función para calcular progreso de fase automáticamente
CREATE OR REPLACE FUNCTION calculate_phase_progress(p_phase_id UUID)
RETURNS INT AS $$
DECLARE
  total_items INT := 0;
  completed_items INT := 0;
  obj JSONB;
  task_item JSONB;
  phase_record RECORD;
BEGIN
  SELECT objectives, checklist INTO phase_record
  FROM business_phases WHERE id = p_phase_id;
  
  IF phase_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Contar objetivos
  FOR obj IN SELECT * FROM jsonb_array_elements(phase_record.objectives)
  LOOP
    total_items := total_items + 1;
    IF (obj->>'current')::numeric >= (obj->>'target')::numeric THEN
      completed_items := completed_items + 1;
    END IF;
  END LOOP;
  
  -- Contar checklist
  FOR task_item IN SELECT * FROM jsonb_array_elements(phase_record.checklist)
  LOOP
    total_items := total_items + 1;
    IF (task_item->>'completed')::boolean = true THEN
      completed_items := completed_items + 1;
    END IF;
  END LOOP;
  
  IF total_items = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((completed_items::numeric / total_items::numeric) * 100);
END;
$$ LANGUAGE plpgsql SET search_path = public;
