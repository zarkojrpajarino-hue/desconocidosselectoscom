-- Migration: Email System Tables
-- Crear tablas para logs de emails y unsubscribes

-- ═══════════════════════════════════════════════════════════════
-- TABLA: email_logs
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN (
    'welcome',
    'weekly-summary',
    'alert',
    'password-reset',
    'team-invite',
    'other'
  )),
  email_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_id ON email_logs(email_id) WHERE email_id IS NOT NULL;

-- RLS para email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON email_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all email logs
CREATE POLICY "Service role can manage email logs"
  ON email_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- TABLA: email_unsubscribes
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL,
  unsubscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para email_unsubscribes
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_user_id ON email_unsubscribes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email_type ON email_unsubscribes(email_type);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_unsubscribed_at ON email_unsubscribes(unsubscribed_at DESC);

-- Constraint: No duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_unsubscribes_unique 
  ON email_unsubscribes(user_id, email_type);

-- RLS para email_unsubscribes
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Users can view their own unsubscribes
CREATE POLICY "Users can view own unsubscribes"
  ON email_unsubscribes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all unsubscribes
CREATE POLICY "Service role can manage unsubscribes"
  ON email_unsubscribes
  FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- FUNCIÓN HELPER: Check si user está unsubscribed
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_user_unsubscribed(
  p_user_id UUID,
  p_email_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_unsubscribed BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM email_unsubscribes
    WHERE user_id = p_user_id
    AND (email_type = 'all' OR email_type = p_email_type)
  ) INTO v_unsubscribed;
  
  RETURN v_unsubscribed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ═══════════════════════════════════════════════════════════════
-- COMENTARIOS
-- ═══════════════════════════════════════════════════════════════

COMMENT ON TABLE email_logs IS 'Registro de todos los emails enviados';
COMMENT ON TABLE email_unsubscribes IS 'Registro de usuarios que se dieron de baja';
COMMENT ON FUNCTION is_user_unsubscribed IS 'Verifica si un usuario está dado de baja de un tipo de email';