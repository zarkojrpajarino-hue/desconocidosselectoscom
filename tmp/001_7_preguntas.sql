-- ============================================
-- MIGRACIÓN: 7 PREGUNTAS CRÍTICAS
-- ============================================

-- 1. Agregar business_type a organizations (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name='organizations' AND column_name='business_type') THEN
    ALTER TABLE organizations 
    ADD COLUMN business_type TEXT DEFAULT 'existing' 
    CHECK (business_type IN ('existing', 'startup'));
  END IF;
END $$;

-- 2. Agregar custom_slug y slug_type a organization_invitations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name='organization_invitations' AND column_name='custom_slug') THEN
    ALTER TABLE organization_invitations 
    ADD COLUMN custom_slug TEXT UNIQUE,
    ADD COLUMN slug_type TEXT DEFAULT 'auto' CHECK (slug_type IN ('auto', 'organization_name', 'custom'));
    
    CREATE INDEX idx_invitations_slug ON organization_invitations(custom_slug);
  END IF;
END $$;

-- 3. Crear tabla notifications (si no existe)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- RLS para notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- 4. Función para generar slug desde nombre de organización
CREATE OR REPLACE FUNCTION slugify(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        unaccent(text_input),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Comentarios
COMMENT ON COLUMN organizations.business_type IS 'existing = negocio con datos reales, startup = idea desde cero';
COMMENT ON COLUMN organization_invitations.custom_slug IS 'Slug personalizado para el link de invitación';
COMMENT ON COLUMN organization_invitations.slug_type IS 'auto = código aleatorio, organization_name = nombre de org, custom = personalizado';
COMMENT ON TABLE notifications IS 'Notificaciones por organización para cada usuario';
