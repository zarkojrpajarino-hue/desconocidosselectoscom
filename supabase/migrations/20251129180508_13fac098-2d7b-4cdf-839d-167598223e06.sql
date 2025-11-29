-- Tabla para métricas del negocio (actualizadas manualmente por usuarios)
CREATE TABLE public.business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Ventas e ingresos
  revenue DECIMAL(10,2),
  orders_count INTEGER,
  avg_ticket DECIMAL(10,2),
  product_margins JSONB, -- {product_name: margin_percentage}
  
  -- Marketing y leads
  leads_generated INTEGER,
  conversion_rate DECIMAL(5,2),
  cac DECIMAL(10,2), -- Customer Acquisition Cost
  channel_roi JSONB, -- {channel_name: {leads, conversions, cac, roi}}
  engagement_rate DECIMAL(5,2),
  
  -- Operaciones
  production_time DECIMAL(10,2), -- horas
  capacity_used DECIMAL(5,2), -- porcentaje
  error_rate DECIMAL(5,2), -- porcentaje
  operational_costs DECIMAL(10,2),
  
  -- Cliente
  nps_score INTEGER, -- Net Promoter Score
  repeat_rate DECIMAL(5,2), -- porcentaje
  lifetime_value DECIMAL(10,2),
  satisfaction_score DECIMAL(3,2), -- 1-5
  reviews_count INTEGER,
  reviews_avg DECIMAL(3,2),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, metric_date)
);

-- RLS para business_metrics
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics"
  ON public.business_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
  ON public.business_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
  ON public.business_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all metrics"
  ON public.business_metrics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Índices
CREATE INDEX idx_business_metrics_user_date ON public.business_metrics(user_id, metric_date DESC);
CREATE INDEX idx_business_metrics_date ON public.business_metrics(metric_date DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_business_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_metrics_updated_at
  BEFORE UPDATE ON public.business_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_business_metrics_updated_at();

-- Agregar campos estructurados a task_completions para métricas por tarea
ALTER TABLE public.task_completions 
ADD COLUMN IF NOT EXISTS task_metrics JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.task_completions.task_metrics IS 'Métricas específicas capturadas al completar la tarea: {revenue, leads, conversions, time_saved, costs, etc.}';
