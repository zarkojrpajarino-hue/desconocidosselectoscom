-- Crear tabla para retrospectivas de OKRs
CREATE TABLE IF NOT EXISTS public.okr_retrospectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Feedback estructurado
  what_went_well TEXT[],
  what_to_improve TEXT[],
  action_items JSONB DEFAULT '[]',
  lessons_learned TEXT,
  
  -- Evaluación
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  would_repeat BOOLEAN,
  
  -- Métricas capturadas al momento
  final_progress INTEGER,
  krs_achieved INTEGER,
  krs_total INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.okr_retrospectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view retrospectives in their org"
  ON public.okr_retrospectives FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create retrospectives for their OKRs"
  ON public.okr_retrospectives FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own retrospectives"
  ON public.okr_retrospectives FOR UPDATE
  USING (user_id = auth.uid());

-- Índices
CREATE INDEX idx_okr_retrospectives_objective ON public.okr_retrospectives(objective_id);
CREATE INDEX idx_okr_retrospectives_org ON public.okr_retrospectives(organization_id);
CREATE INDEX idx_okr_retrospectives_user ON public.okr_retrospectives(user_id);

-- Trigger para updated_at
CREATE TRIGGER update_okr_retrospectives_updated_at
  BEFORE UPDATE ON public.okr_retrospectives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();