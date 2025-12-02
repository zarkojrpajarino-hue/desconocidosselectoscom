-- ============================================
-- TABLA PARA ANÁLISIS IA V2.0
-- ============================================

-- Crear tabla para almacenar resultados de análisis
CREATE TABLE IF NOT EXISTS public.ai_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  analysis_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_ai_analysis_org ON public.ai_analysis_results(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_generated_at ON public.ai_analysis_results(generated_at DESC);

-- RLS Policies
ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver análisis de su organización
CREATE POLICY "Users can view their organization analysis"
  ON public.ai_analysis_results
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Solo admins pueden insertar análisis
CREATE POLICY "Only admins can insert analysis"
  ON public.ai_analysis_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND organization_id = ai_analysis_results.organization_id
      AND role = 'admin'
    )
  );

-- Comentarios
COMMENT ON TABLE public.ai_analysis_results IS 'Almacena los resultados de análisis con IA v2.0';
COMMENT ON COLUMN public.ai_analysis_results.analysis_data IS 'JSON con toda la estructura del análisis (financial, team, growth, etc.)';