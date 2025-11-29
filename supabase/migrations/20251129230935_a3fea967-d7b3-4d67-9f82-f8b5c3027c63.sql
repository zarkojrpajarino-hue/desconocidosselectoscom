-- ============================================
-- CRM Y PIPELINE DE VENTAS - OPTIMIZADO
-- ============================================

-- TABLA: leads (Sin ENUMs, más flexible)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información básica
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  company TEXT,
  email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT,
  
  -- Pipeline (TEXT con CHECK constraint)
  stage TEXT NOT NULL DEFAULT 'lead' 
    CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Valor y probabilidad
  estimated_value NUMERIC DEFAULT 0 CHECK (estimated_value >= 0),
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_revenue NUMERIC GENERATED ALWAYS AS (estimated_value * probability / 100) STORED,
  
  -- Seguimiento
  source TEXT CHECK (source IN ('instagram', 'facebook', 'google', 'referral', 'email', 'phone', 'website', 'event', 'other')),
  assigned_to UUID REFERENCES users(id),
  next_action TEXT,
  next_action_date DATE,
  last_contact_date DATE,
  
  -- Productos de interés
  interested_products TEXT[],
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Cerrado
  won_date DATE,
  lost_date DATE,
  lost_reason TEXT,
  
  -- Conversion tracking
  converted_to_customer BOOLEAN DEFAULT false,
  revenue_entry_id UUID -- Link al revenue entry creado
);

-- TABLA: lead_interactions
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Tipo de interacción
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'call', 'email', 'meeting', 'whatsapp', 'instagram_dm',
    'proposal_sent', 'follow_up', 'note', 'stage_change'
  )),
  
  -- Contenido
  subject TEXT NOT NULL CHECK (length(trim(subject)) > 0),
  description TEXT,
  outcome TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- TABLA: sales_targets
CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL UNIQUE,
  
  -- Targets
  target_revenue NUMERIC DEFAULT 0,
  target_deals INTEGER DEFAULT 0,
  target_new_customers INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage) WHERE stage NOT IN ('won', 'lost');
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_next_action_date ON leads(next_action_date) WHERE next_action_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_last_contact ON leads(last_contact_date) WHERE last_contact_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created ON lead_interactions(created_at DESC);

-- FUNCIÓN: Actualizar updated_at
CREATE OR REPLACE FUNCTION update_lead_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_updated_at();

-- FUNCIÓN: Log de cambio de etapa
CREATE OR REPLACE FUNCTION log_lead_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO lead_interactions (
      lead_id, interaction_type, subject, description, created_by
    ) VALUES (
      NEW.id,
      'stage_change',
      format('Cambio de etapa: %s → %s', OLD.stage, NEW.stage),
      format('Lead movido de "%s" a "%s"', OLD.stage, NEW.stage),
      COALESCE(NEW.assigned_to, NEW.created_by)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_lead_stage_change
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_stage_change();

-- FUNCIÓN: Alertas de leads sin contacto
CREATE OR REPLACE FUNCTION check_stale_leads()
RETURNS VOID AS $$
DECLARE
  lead_record RECORD;
  days_since_contact INTEGER;
BEGIN
  FOR lead_record IN
    SELECT 
      l.id, l.name, l.company, l.estimated_value, l.stage,
      l.assigned_to, l.last_contact_date
    FROM leads l
    WHERE l.stage IN ('lead', 'qualified', 'proposal', 'negotiation')
    AND l.last_contact_date IS NOT NULL
  LOOP
    days_since_contact := CURRENT_DATE - lead_record.last_contact_date;
    
    IF days_since_contact >= 3 THEN
      IF NOT EXISTS(
        SELECT 1 FROM smart_alerts 
        WHERE alert_type = 'sales_follow_up'
        AND dismissed = false
        AND context->>'lead_id' = lead_record.id::TEXT
        AND created_at > NOW() - INTERVAL '5 days'
      ) THEN
        INSERT INTO smart_alerts (
          alert_type, severity, title, message, context, source, category,
          actionable, action_label, action_url, target_user_id
        ) VALUES (
          'sales_follow_up',
          CASE 
            WHEN days_since_contact >= 7 THEN 'urgent'
            WHEN days_since_contact >= 5 THEN 'important'
            ELSE 'info'
          END,
          format('📞 Follow-up: %s', COALESCE(lead_record.company, lead_record.name)),
          format('Lead sin contacto hace %s días. Valor: €%s. Etapa: %s.',
            days_since_contact,
            ROUND(lead_record.estimated_value),
            lead_record.stage
          ),
          jsonb_build_object(
            'lead_id', lead_record.id,
            'lead_name', lead_record.name,
            'days_since_contact', days_since_contact,
            'estimated_value', lead_record.estimated_value,
            'stage', lead_record.stage
          ),
          'crm',
          'sales',
          true,
          'Contactar Lead',
          '/crm',
          lead_record.assigned_to
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- FUNCIÓN: Conversión de deal ganado a revenue (CON PREVENCIÓN DE DUPLICADOS)
CREATE OR REPLACE FUNCTION convert_won_deal_to_revenue()
RETURNS TRIGGER AS $$
DECLARE
  new_revenue_id UUID;
BEGIN
  IF NEW.stage = 'won' AND (OLD.stage IS NULL OR OLD.stage != 'won') THEN
    -- Solo si no se ha convertido ya
    IF NEW.converted_to_customer = false THEN
      INSERT INTO revenue_entries (
        date, amount, product_category, product_name,
        customer_name, customer_type, notes, created_by
      ) VALUES (
        COALESCE(NEW.won_date, CURRENT_DATE),
        NEW.estimated_value,
        CASE 
          WHEN 'premium' = ANY(NEW.interested_products) THEN 'premium'
          WHEN 'personalizadas' = ANY(NEW.interested_products) THEN 'personalizadas'
          WHEN 'corporativas' = ANY(NEW.interested_products) THEN 'corporativas'
          ELSE 'estandar'
        END,
        format('CRM Deal: %s', COALESCE(NEW.company, NEW.name)),
        COALESCE(NEW.company, NEW.name),
        CASE WHEN NEW.company IS NOT NULL THEN 'corporativo' ELSE 'individual' END,
        format('Auto-generado desde CRM. Lead ID: %s', NEW.id),
        COALESCE(NEW.created_by, NEW.assigned_to)
      )
      RETURNING id INTO new_revenue_id;
      
      NEW.converted_to_customer = true;
      NEW.revenue_entry_id = new_revenue_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_convert_won_deal
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION convert_won_deal_to_revenue();

-- VISTA: Pipeline overview
CREATE OR REPLACE VIEW pipeline_overview AS
SELECT 
  stage,
  COUNT(*) as count,
  SUM(estimated_value) as total_value,
  SUM(expected_revenue) as total_expected,
  AVG(estimated_value) as avg_value,
  AVG(probability) as avg_probability
FROM leads
WHERE stage NOT IN ('won', 'lost')
GROUP BY stage
ORDER BY 
  CASE stage
    WHEN 'lead' THEN 1
    WHEN 'qualified' THEN 2
    WHEN 'proposal' THEN 3
    WHEN 'negotiation' THEN 4
  END;

-- RLS POLÍTICAS (MÁS RESTRICTIVAS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;

-- Solo admin y leaders pueden ver todos los leads
CREATE POLICY "Admins and leaders can view all leads"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'leader')
    )
  );

-- Usuarios pueden ver leads asignados a ellos
CREATE POLICY "Users can view their assigned leads"
  ON leads FOR SELECT
  USING (assigned_to = auth.uid());

-- Admin y leaders pueden gestionar todos los leads
CREATE POLICY "Admins and leaders can manage all leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'leader')
    )
  );

-- Usuarios pueden actualizar leads asignados
CREATE POLICY "Users can update their assigned leads"
  ON leads FOR UPDATE
  USING (assigned_to = auth.uid());

-- Todos pueden crear interacciones
CREATE POLICY "Everyone can create interactions"
  ON lead_interactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Ver interacciones según acceso al lead
CREATE POLICY "View interactions based on lead access"
  ON lead_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = lead_interactions.lead_id
      AND (
        l.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('admin', 'leader')
        )
      )
    )
  );

-- Admin y leaders gestionan targets
CREATE POLICY "Admins and leaders manage sales targets"
  ON sales_targets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'leader')
    )
  );

-- DATOS DE EJEMPLO
INSERT INTO leads (
  name, company, email, phone, stage, priority, estimated_value, 
  probability, source, interested_products, notes, last_contact_date, assigned_to
)
SELECT 
  'María González',
  'Hotel Boutique Sol y Mar',
  'maria@solmar.com',
  '+34 666 123 456',
  'qualified',
  'high',
  2400,
  75,
  'instagram',
  ARRAY['premium', 'corporativas'],
  'Interesada en cestas personalizadas para eventos del hotel.',
  CURRENT_DATE - INTERVAL '2 days',
  u.id
FROM users u WHERE u.role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

-- Actualizar generate_all_smart_alerts para incluir check_stale_leads
CREATE OR REPLACE FUNCTION generate_all_smart_alerts()
RETURNS INTEGER AS $$
DECLARE
  alerts_before INTEGER;
  alerts_after INTEGER;
BEGIN
  SELECT COUNT(*) INTO alerts_before FROM smart_alerts WHERE dismissed = false;
  
  PERFORM check_financial_risks();
  PERFORM check_okr_risks();
  PERFORM check_urgent_tasks();
  PERFORM check_stale_leads();
  
  UPDATE smart_alerts 
  SET dismissed = true, dismissed_at = NOW()
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW()
  AND dismissed = false;
  
  SELECT COUNT(*) INTO alerts_after FROM smart_alerts WHERE dismissed = false;
  
  RETURN alerts_after - alerts_before;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON TABLE leads IS 'CRM: Leads y oportunidades de venta';
COMMENT ON TABLE lead_interactions IS 'CRM: Historial de interacciones con leads';
COMMENT ON FUNCTION check_stale_leads() IS 'CRM: Detecta leads sin contacto >3 días';
COMMENT ON FUNCTION convert_won_deal_to_revenue() IS 'CRM: Convierte deal ganado en ingreso (sin duplicados)';