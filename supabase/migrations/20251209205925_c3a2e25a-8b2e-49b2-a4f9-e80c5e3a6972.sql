-- =====================================================
-- MIGRACIÓN: 5 CAMBIOS CRÍTICOS OPTIMUS-K
-- Fecha: 9 Diciembre 2024
-- =====================================================

-- =====================================================
-- 1. AUDIT LOG - Compliance (GDPR/SOC2/ISO27001)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Qué cambió
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  
  -- Valores
  old_values JSONB,
  new_values JSONB,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  endpoint TEXT,
  http_method VARCHAR(10),
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver logs de su org
CREATE POLICY "Admins can view org audit logs"
  ON audit_log FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Sistema puede insertar (vía triggers)
CREATE POLICY "System can insert audit logs"
  ON audit_log FOR INSERT
  WITH CHECK (true);

-- Función para crear audit log
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action VARCHAR(100),
  p_resource_type VARCHAR(50),
  p_resource_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_log (
    user_id,
    organization_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    p_organization_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function para auditar cambios automáticamente
CREATE OR REPLACE FUNCTION public.audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    organization_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.organization_id, OLD.organization_id),
    TG_OP || '.' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('DELETE', 'UPDATE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplicar triggers a tablas críticas
DROP TRIGGER IF EXISTS audit_leads ON leads;
CREATE TRIGGER audit_leads
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION audit_changes();

DROP TRIGGER IF EXISTS audit_tasks ON tasks;
CREATE TRIGGER audit_tasks
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION audit_changes();

DROP TRIGGER IF EXISTS audit_objectives ON objectives;
CREATE TRIGGER audit_objectives
  AFTER INSERT OR UPDATE OR DELETE ON objectives
  FOR EACH ROW EXECUTE FUNCTION audit_changes();

DROP TRIGGER IF EXISTS audit_key_results ON key_results;
CREATE TRIGGER audit_key_results
  AFTER INSERT OR UPDATE OR DELETE ON key_results
  FOR EACH ROW EXECUTE FUNCTION audit_changes();

-- =====================================================
-- 2. NOTIFICATION PREFERENCES - GDPR Compliance
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Canales
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,
  
  -- Tipos de notificaciones - Tareas
  task_assigned BOOLEAN DEFAULT true,
  task_due_soon BOOLEAN DEFAULT true,
  task_completed BOOLEAN DEFAULT true,
  task_overdue BOOLEAN DEFAULT true,
  
  -- OKRs
  okr_update BOOLEAN DEFAULT true,
  okr_at_risk BOOLEAN DEFAULT true,
  
  -- Leads
  lead_assigned BOOLEAN DEFAULT true,
  lead_status_change BOOLEAN DEFAULT true,
  
  -- Team
  team_invite BOOLEAN DEFAULT true,
  role_changed BOOLEAN DEFAULT true,
  
  -- Resúmenes
  milestone_reached BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,
  monthly_report BOOLEAN DEFAULT false,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone VARCHAR(50) DEFAULT 'Europe/Madrid',
  
  -- Digest
  daily_digest BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON user_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON user_notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_notification_prefs_updated_at ON user_notification_preferences;
CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. OKR CHECK-INS ESTRUCTURADOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.okr_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID NOT NULL REFERENCES public.key_results(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Fecha
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Valores cuantitativos
  previous_value DECIMAL(12,2),
  new_value DECIMAL(12,2) NOT NULL,
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  
  -- Estado
  status VARCHAR(20) CHECK (status IN ('on_track', 'at_risk', 'blocked', 'achieved')),
  
  -- Contexto cualitativo
  progress_update TEXT NOT NULL,
  blockers TEXT,
  next_steps TEXT,
  learnings TEXT,
  
  -- Adjuntos
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_okr_check_ins_kr ON okr_check_ins(key_result_id);
CREATE INDEX IF NOT EXISTS idx_okr_check_ins_user ON okr_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_okr_check_ins_org ON okr_check_ins(organization_id);
CREATE INDEX IF NOT EXISTS idx_okr_check_ins_date ON okr_check_ins(check_in_date DESC);

-- RLS
ALTER TABLE okr_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view check-ins in their org"
  ON okr_check_ins FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create check-ins"
  ON okr_check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins"
  ON okr_check_ins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own check-ins"
  ON okr_check_ins FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_okr_check_ins_updated_at ON okr_check_ins;
CREATE TRIGGER update_okr_check_ins_updated_at
  BEFORE UPDATE ON okr_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar key_result automáticamente al hacer check-in
CREATE OR REPLACE FUNCTION public.update_key_result_on_checkin()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE key_results
  SET 
    current_value = NEW.new_value,
    status = NEW.status,
    updated_at = now()
  WHERE id = NEW.key_result_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_kr_value_on_checkin ON okr_check_ins;
CREATE TRIGGER update_kr_value_on_checkin
  AFTER INSERT ON okr_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_key_result_on_checkin();

-- =====================================================
-- 4. AI GENERATIONS HISTORY (ALTA prioridad incluida)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_generations_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Input/Output
  prompt TEXT,
  input_data JSONB,
  response JSONB NOT NULL,
  
  -- Métricas
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  response_time_ms INTEGER,
  
  -- Estado
  was_successful BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Feedback
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  was_useful BOOLEAN,
  feedback_text TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_history_tool ON ai_generations_history(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_history_user ON ai_generations_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_history_org ON ai_generations_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_history_created ON ai_generations_history(created_at DESC);

-- RLS
ALTER TABLE ai_generations_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI history in their org"
  ON ai_generations_history FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert AI history"
  ON ai_generations_history FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own AI history feedback"
  ON ai_generations_history FOR UPDATE
  USING (auth.uid() = user_id);