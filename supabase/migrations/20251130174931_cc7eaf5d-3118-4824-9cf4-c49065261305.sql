-- Tabla para contenidos de herramientas personalizados
CREATE TABLE IF NOT EXISTS public.tool_contents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL, -- 'buyer_persona', 'customer_journey', 'growth_model', 'lead_scoring'
  content JSONB NOT NULL, -- Contenido estructurado generado por IA
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, tool_type)
);

-- Habilitar RLS
ALTER TABLE public.tool_contents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view tools from their organization"
  ON public.tool_contents
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert tools for their organization"
  ON public.tool_contents
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update tools from their organization"
  ON public.tool_contents
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete tools from their organization"
  ON public.tool_contents
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_tool_contents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tool_contents_updated_at
  BEFORE UPDATE ON public.tool_contents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tool_contents_updated_at();

-- Índice para mejorar rendimiento
CREATE INDEX idx_tool_contents_org_type ON public.tool_contents(organization_id, tool_type);