-- Tabla de competidores
CREATE TABLE public.competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  description TEXT,
  pricing_info JSONB DEFAULT '{}',
  features JSONB DEFAULT '[]',
  strengths TEXT[],
  weaknesses TEXT[],
  market_position TEXT,
  target_audience TEXT,
  last_analyzed_at TIMESTAMPTZ,
  ai_analysis JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

-- Índices
CREATE INDEX idx_competitors_organization ON public.competitors(organization_id);
CREATE INDEX idx_competitors_name ON public.competitors(name);

-- RLS
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competitors in their organization"
ON public.competitors FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert competitors in their organization"
ON public.competitors FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update competitors in their organization"
ON public.competitors FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete competitors in their organization"
ON public.competitors FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_competitors_updated_at
  BEFORE UPDATE ON public.competitors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();