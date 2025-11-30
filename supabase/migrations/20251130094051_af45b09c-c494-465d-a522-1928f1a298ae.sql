-- =====================================================
-- MIGRACIÓN SEGURA CRM PROFESIONAL - ALTER TABLE
-- Mantiene todos los datos existentes
-- =====================================================

-- Añadir nuevas columnas a la tabla leads existente
ALTER TABLE leads ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type TEXT CHECK (lead_type IN ('cold', 'warm', 'hot', 'mql', 'sql')) DEFAULT 'cold';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score TEXT CHECK (lead_score IN ('A', 'B', 'C', 'D')) DEFAULT 'C';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage TEXT CHECK (pipeline_stage IN ('discovery', 'demo', 'proposal', 'negotiation', 'closed_won', 'closed_lost')) DEFAULT 'discovery';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_type TEXT CHECK (next_action_type IN ('call', 'email', 'meeting', 'whatsapp', 'follow_up', 'demo', 'proposal', 'other'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE leads ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP;

-- Actualizar columna source con más opciones (sin perder datos existentes)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check CHECK (source IN (
  'website', 'referral', 'cold_call', 'linkedin', 'email', 'event', 
  'instagram', 'facebook', 'google_ads', 'google', 'content', 'partner', 
  'phone', 'other'
));

-- Actualizar columna status con más estados
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check;
ALTER TABLE leads ADD CONSTRAINT leads_stage_check CHECK (stage IN (
  'lead', 'new', 'contacted', 'qualified', 'proposal', 
  'negotiation', 'won', 'lost', 'on_hold'
));

-- Actualizar columna priority con todas las opciones
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_priority_check;
ALTER TABLE leads ADD CONSTRAINT leads_priority_check CHECK (priority IN (
  'urgent', 'high', 'medium', 'low'
));

-- Mejorar tabla de interacciones
ALTER TABLE lead_interactions ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE lead_interactions ADD COLUMN IF NOT EXISTS next_steps TEXT;
ALTER TABLE lead_interactions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE lead_interactions ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative'));

-- =====================================================
-- VISTAS PARA ESTADÍSTICAS
-- =====================================================

-- Vista de estadísticas por usuario
CREATE OR REPLACE VIEW user_lead_stats AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.role,
  COUNT(l.id) as total_leads,
  COUNT(CASE WHEN l.stage = 'won' THEN 1 END) as won_leads,
  COUNT(CASE WHEN l.lead_type = 'hot' THEN 1 END) as hot_leads,
  COALESCE(SUM(CASE WHEN l.stage = 'won' THEN l.estimated_value END), 0) as total_won_value,
  COALESCE(SUM(l.estimated_value), 0) as total_pipeline_value
FROM users u
LEFT JOIN leads l ON l.created_by = u.id
GROUP BY u.id, u.full_name, u.role
ORDER BY total_leads DESC;

-- Vista de estadísticas globales
CREATE OR REPLACE VIEW crm_global_stats AS
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN stage IN ('new', 'lead') THEN 1 END) as new_leads,
  COUNT(CASE WHEN lead_type = 'hot' THEN 1 END) as hot_leads,
  COUNT(CASE WHEN stage = 'won' THEN 1 END) as won_leads,
  COUNT(CASE WHEN stage = 'lost' THEN 1 END) as lost_leads,
  COALESCE(SUM(estimated_value), 0) as total_pipeline_value,
  COALESCE(SUM(CASE WHEN stage = 'won' THEN estimated_value END), 0) as total_won_value,
  COALESCE(AVG(CASE WHEN stage = 'won' THEN estimated_value END), 0) as avg_deal_size
FROM leads;

-- =====================================================
-- FUNCIÓN: CALCULAR LEAD SCORE AUTOMÁTICO
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_lead_score(p_lead_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_score INTEGER := 0;
  v_lead RECORD;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  
  -- Puntos por tipo de lead
  v_score := v_score + CASE v_lead.lead_type
    WHEN 'hot' THEN 40
    WHEN 'warm' THEN 30
    WHEN 'mql' THEN 25
    WHEN 'sql' THEN 35
    WHEN 'cold' THEN 10
    ELSE 0
  END;
  
  -- Puntos por valor estimado
  IF v_lead.estimated_value >= 10000 THEN
    v_score := v_score + 30;
  ELSIF v_lead.estimated_value >= 5000 THEN
    v_score := v_score + 20;
  ELSIF v_lead.estimated_value >= 1000 THEN
    v_score := v_score + 10;
  END IF;
  
  -- Puntos por probabilidad
  IF v_lead.probability >= 75 THEN
    v_score := v_score + 20;
  ELSIF v_lead.probability >= 50 THEN
    v_score := v_score + 10;
  END IF;
  
  -- Puntos por actividad reciente
  IF v_lead.last_contact_date IS NOT NULL 
     AND v_lead.last_contact_date > CURRENT_DATE - INTERVAL '7 days' THEN
    v_score := v_score + 10;
  END IF;
  
  -- Convertir score a letra
  IF v_score >= 80 THEN
    RETURN 'A';
  ELSIF v_score >= 60 THEN
    RETURN 'B';
  ELSIF v_score >= 40 THEN
    RETURN 'C';
  ELSE
    RETURN 'D';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_interactions_sentiment ON lead_interactions(sentiment);

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================
COMMENT ON COLUMN leads.lead_type IS 'Tipo de lead: cold (frío), warm (templado), hot (caliente), mql (marketing qualified), sql (sales qualified)';
COMMENT ON COLUMN leads.lead_score IS 'Calificación del lead: A (excelente), B (bueno), C (promedio), D (bajo)';
COMMENT ON COLUMN leads.pipeline_stage IS 'Etapa del pipeline de ventas';
COMMENT ON COLUMN leads.position IS 'Cargo/Posición del contacto';
COMMENT ON COLUMN leads.tags IS 'Etiquetas personalizadas para organizar leads';

-- =====================================================
-- FIN DE LA MIGRACIÓN SEGURA
-- =====================================================