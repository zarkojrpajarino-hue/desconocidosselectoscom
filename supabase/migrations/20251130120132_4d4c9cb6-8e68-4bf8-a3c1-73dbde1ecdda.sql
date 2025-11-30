-- Tabla para guardar los onboarding completados
CREATE TABLE onboarding_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Información de contacto
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  
  -- Paso 1: Cuenta
  account_email TEXT NOT NULL,
  account_password_hash TEXT NOT NULL,
  
  -- Paso 2: Información básica empresa
  industry TEXT NOT NULL,
  company_size TEXT NOT NULL,
  annual_revenue_range TEXT,
  
  -- Paso 3: Descripción detallada del negocio (CRÍTICO)
  business_description TEXT NOT NULL, -- Mínimo 300 palabras
  target_customers TEXT NOT NULL,
  value_proposition TEXT NOT NULL,
  
  -- Paso 4: Productos/Servicios
  products_services JSONB NOT NULL, -- Array de {name, price, category, description}
  
  -- Paso 5: Proceso comercial
  sales_process TEXT NOT NULL, -- Descripción paso a paso
  sales_cycle_days INTEGER,
  lead_sources JSONB NOT NULL, -- Array de fuentes
  
  -- Paso 6: Equipo
  team_structure JSONB NOT NULL, -- Array de {role, count, responsibilities}
  
  -- Paso 7: Objetivos
  main_objectives TEXT NOT NULL,
  kpis_to_measure JSONB NOT NULL, -- Array de métricas
  
  -- Problemas actuales
  current_problems TEXT NOT NULL,
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
  
  -- Mega-prompt generado automáticamente
  ai_prompt_generated TEXT,
  
  -- Relación con usuario (si ya está registrado)
  user_id UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_onboarding_email ON onboarding_submissions(contact_email);
CREATE INDEX idx_onboarding_status ON onboarding_submissions(status);
CREATE INDEX idx_onboarding_created ON onboarding_submissions(created_at DESC);

-- RLS Policies
ALTER TABLE onboarding_submissions ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar (proceso de registro público)
CREATE POLICY "Anyone can submit onboarding"
  ON onboarding_submissions
  FOR INSERT
  WITH CHECK (true);

-- Solo admins pueden ver todas las submissions
CREATE POLICY "Admins can view all submissions"
  ON onboarding_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Trigger para actualizar updated_at
CREATE TRIGGER update_onboarding_updated_at
  BEFORE UPDATE ON onboarding_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE onboarding_submissions IS 'Almacena las respuestas del formulario de onboarding de nuevos clientes de OPTIMUS-K';
COMMENT ON COLUMN onboarding_submissions.business_description IS 'Descripción detallada del negocio (mínimo 300 palabras) - CRÍTICO para generar app personalizada';
COMMENT ON COLUMN onboarding_submissions.ai_prompt_generated IS 'Mega-prompt de 5000+ palabras generado automáticamente para usar en Lovable AI';