-- ================================================
-- MEDIA FEATURES 10-12: Webhooks, Integration Tokens, Calendar Sync
-- ================================================

-- 10. WEBHOOKS SYSTEM
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  retry_enabled BOOLEAN DEFAULT TRUE,
  max_retries INTEGER DEFAULT 3,
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  last_delivery_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'failed')),
  http_status_code INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);

-- 11. INTEGRATION TOKENS
CREATE TABLE IF NOT EXISTS integration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT,
  metadata JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id, integration_type)
);

CREATE INDEX IF NOT EXISTS idx_integration_tokens_user ON integration_tokens(user_id, integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_tokens_org ON integration_tokens(organization_id, integration_type);

-- 12. CALENDAR SYNC EVENTS  
CREATE TABLE IF NOT EXISTS calendar_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  google_event_id TEXT UNIQUE,
  event_title TEXT NOT NULL,
  event_start TIMESTAMPTZ NOT NULL,
  event_end TIMESTAMPTZ NOT NULL,
  event_description TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_user ON calendar_sync_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_task ON calendar_sync_events(task_id);

-- RLS POLICIES
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_events ENABLE ROW LEVEL SECURITY;

-- Webhooks: Admins only
CREATE POLICY "Admins manage webhooks" ON webhooks FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Webhook Deliveries: Admins via webhook
CREATE POLICY "Admins view webhook deliveries" ON webhook_deliveries FOR SELECT
  USING (webhook_id IN (
    SELECT id FROM webhooks WHERE organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  ));

-- Integration Tokens: Users manage own
CREATE POLICY "Users manage own integration tokens" ON integration_tokens FOR ALL
  USING (user_id = auth.uid());

-- Calendar Sync: Users manage own
CREATE POLICY "Users manage own calendar events" ON calendar_sync_events FOR ALL
  USING (user_id = auth.uid());