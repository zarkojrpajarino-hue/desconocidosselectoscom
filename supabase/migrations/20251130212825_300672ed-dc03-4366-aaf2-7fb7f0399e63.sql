-- =====================================================
-- STRIPE INTEGRATION - DATABASE MIGRATION
-- =====================================================

-- Añadir campos Stripe a organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Crear tabla eventos subscription
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  
  previous_plan TEXT,
  new_plan TEXT,
  previous_status TEXT,
  new_status TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer 
ON organizations(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription 
ON organizations(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_events_org 
ON subscription_events(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe 
ON subscription_events(stripe_event_id);

-- RLS para subscription_events
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their subscription events" ON subscription_events;
CREATE POLICY "Users can view their subscription events"
  ON subscription_events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Comentarios
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe Customer ID';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Stripe Subscription ID';
COMMENT ON COLUMN organizations.subscription_status IS 'trialing, active, past_due, canceled';
COMMENT ON TABLE subscription_events IS 'Logs de eventos de Stripe webhooks';