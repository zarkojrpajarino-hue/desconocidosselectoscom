-- ================================================
-- MEDIA + BAJA PRIORITY - CONSOLIDATED MIGRATION (FIXED)
-- ================================================

-- 1. GDPR COMPLIANCE
CREATE TABLE IF NOT EXISTS gdpr_data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('data_export', 'account_deletion')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  export_data JSONB,
  export_url TEXT,
  deletion_scheduled_at TIMESTAMPTZ,
  deletion_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cookie_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  necessary BOOLEAN DEFAULT TRUE,
  analytics BOOLEAN DEFAULT FALSE,
  marketing BOOLEAN DEFAULT FALSE,
  preferences BOOLEAN DEFAULT FALSE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_exports_user ON gdpr_data_exports(user_id, status);

-- 2. SESSION MANAGEMENT
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  location_country TEXT,
  location_city TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id, is_active);

-- 3. IP ALLOWLISTING
CREATE TABLE IF NOT EXISTS ip_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ip_range CIDR NOT NULL,
  description TEXT,
  applies_to_roles TEXT[] DEFAULT ARRAY['member'],
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SAVED VIEWS
CREATE TABLE IF NOT EXISTS saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  view_type TEXT NOT NULL,
  filters JSONB NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with_users UUID[],
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOM DASHBOARDS
CREATE TABLE IF NOT EXISTS custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  variables TEXT[],
  template_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TEMPLATES SYSTEM
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  category TEXT,
  tags TEXT[],
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. IN-APP CHAT
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  channel_name TEXT,
  related_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments JSONB,
  reactions JSONB DEFAULT '{}',
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- 9. REVENUE FORECASTING
CREATE TABLE IF NOT EXISTS revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  forecast_period TEXT NOT NULL,
  predicted_revenue DECIMAL(15,2) NOT NULL,
  confidence_level DECIMAL(5,2),
  lower_bound DECIMAL(15,2),
  upper_bound DECIMAL(15,2),
  model_type TEXT,
  model_accuracy DECIMAL(5,2),
  insights JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CUSTOM FIELDS
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'dropdown', 'multi_select', 'checkbox', 'url', 'email')),
  options JSONB,
  default_value TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, entity_type, field_key)
);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  custom_field_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(custom_field_id, entity_id)
);

-- 11. WORKFLOW AUTOMATION
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB,
  conditions JSONB,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_data JSONB,
  actions_executed JSONB,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 12. CUSTOM ROLES
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  custom_role_id UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id, custom_role_id)
);

-- 13. WHITE-LABEL
CREATE TABLE IF NOT EXISTS white_label_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#0066FF',
  secondary_color TEXT,
  custom_domain TEXT UNIQUE,
  custom_domain_verified BOOLEAN DEFAULT FALSE,
  hide_powered_by BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE gdpr_data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_settings ENABLE ROW LEVEL SECURITY;

-- GDPR policies
CREATE POLICY "gdpr_select_own" ON gdpr_data_exports FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "gdpr_insert_own" ON gdpr_data_exports FOR INSERT WITH CHECK (user_id = auth.uid());

-- Cookie policies
CREATE POLICY "cookie_manage_own" ON cookie_consents FOR ALL USING (user_id = auth.uid());

-- Session policies
CREATE POLICY "session_manage_own" ON user_sessions FOR ALL USING (user_id = auth.uid());

-- IP Allowlist policies (admin only)
CREATE POLICY "ip_allowlist_admin" ON ip_allowlist FOR ALL
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Saved Views policies
CREATE POLICY "views_select" ON saved_views FOR SELECT
  USING (created_by = auth.uid() OR is_shared = TRUE OR auth.uid() = ANY(shared_with_users));
CREATE POLICY "views_insert" ON saved_views FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "views_update" ON saved_views FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "views_delete" ON saved_views FOR DELETE USING (created_by = auth.uid());

-- Custom Dashboards policies
CREATE POLICY "dashboards_select" ON custom_dashboards FOR SELECT
  USING (created_by = auth.uid() OR is_shared = TRUE);
CREATE POLICY "dashboards_insert" ON custom_dashboards FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "dashboards_update" ON custom_dashboards FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "dashboards_delete" ON custom_dashboards FOR DELETE USING (created_by = auth.uid());

-- Email Templates policies
CREATE POLICY "email_templates_select" ON email_templates FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "email_templates_admin" ON email_templates FOR ALL
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Templates policies
CREATE POLICY "templates_select" ON templates FOR SELECT
  USING (is_public = TRUE OR organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "templates_insert" ON templates FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "templates_update" ON templates FOR UPDATE USING (created_by = auth.uid());

-- Chat policies
CREATE POLICY "chat_channels_select" ON chat_channels FOR SELECT
  USING (id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid()));
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT
  USING (channel_id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid()));
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_members_select" ON chat_channel_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "chat_members_insert" ON chat_channel_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- Revenue Forecasts policies
CREATE POLICY "forecasts_select" ON revenue_forecasts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

-- Custom Fields policies
CREATE POLICY "custom_fields_admin" ON custom_field_definitions FOR ALL
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "custom_values_select" ON custom_field_values FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

-- Workflows policies
CREATE POLICY "workflows_admin" ON workflows FOR ALL
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "workflow_runs_select" ON workflow_runs FOR SELECT
  USING (workflow_id IN (SELECT id FROM workflows WHERE organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())));

-- Custom Roles policies
CREATE POLICY "custom_roles_admin" ON custom_roles FOR ALL
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- User Custom Roles policies
CREATE POLICY "user_custom_roles_admin" ON user_custom_roles FOR ALL
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- White Label policies
CREATE POLICY "white_label_admin" ON white_label_settings FOR ALL
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));