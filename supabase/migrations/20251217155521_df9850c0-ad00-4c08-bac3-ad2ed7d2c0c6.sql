-- Crear tabla okr_dependencies para relaciones entre objetivos
CREATE TABLE public.okr_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  target_objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'blocks', -- 'blocks', 'enables', 'relates_to'
  description TEXT,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Evitar duplicados y auto-referencias
  CONSTRAINT no_self_dependency CHECK (source_objective_id != target_objective_id),
  CONSTRAINT unique_dependency UNIQUE (source_objective_id, target_objective_id)
);

-- Índices para rendimiento
CREATE INDEX idx_okr_dependencies_source ON public.okr_dependencies(source_objective_id);
CREATE INDEX idx_okr_dependencies_target ON public.okr_dependencies(target_objective_id);
CREATE INDEX idx_okr_dependencies_org ON public.okr_dependencies(organization_id);

-- Habilitar RLS
ALTER TABLE public.okr_dependencies ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view dependencies in their organization"
ON public.okr_dependencies FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage dependencies"
ON public.okr_dependencies FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND organization_id = okr_dependencies.organization_id 
    AND role = 'admin'
  )
);

-- Comentarios
COMMENT ON TABLE public.okr_dependencies IS 'Relaciones de dependencia entre objetivos OKR';
COMMENT ON COLUMN public.okr_dependencies.dependency_type IS 'Tipo: blocks (bloquea), enables (habilita), relates_to (relacionado)';