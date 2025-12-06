-- =====================================================
-- FASE 6: Asana/Trello Integration Tables
-- =====================================================

-- Asana accounts table
CREATE TABLE public.asana_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  workspace_id TEXT,
  workspace_name TEXT,
  project_id TEXT,
  project_name TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- Trello accounts table
CREATE TABLE public.trello_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  api_token TEXT NOT NULL,
  board_id TEXT,
  board_name TEXT,
  list_mapping JSONB DEFAULT '{}',
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- Task sync mappings for both platforms
CREATE TABLE public.external_task_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('asana', 'trello')),
  external_id TEXT NOT NULL,
  external_url TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  sync_status TEXT DEFAULT 'synced',
  UNIQUE(task_id, platform)
);

-- Enable RLS
ALTER TABLE public.asana_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trello_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_task_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for asana_accounts
CREATE POLICY "Users can view their org asana account"
ON public.asana_accounts FOR SELECT
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage asana accounts"
ON public.asana_accounts FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
))
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS policies for trello_accounts
CREATE POLICY "Users can view their org trello account"
ON public.trello_accounts FOR SELECT
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage trello accounts"
ON public.trello_accounts FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
))
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS policies for external_task_mappings
CREATE POLICY "Users can view their org task mappings"
ON public.external_task_mappings FOR SELECT
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Service can manage task mappings"
ON public.external_task_mappings FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
))
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
));

-- Indexes
CREATE INDEX idx_asana_accounts_org ON public.asana_accounts(organization_id);
CREATE INDEX idx_trello_accounts_org ON public.trello_accounts(organization_id);
CREATE INDEX idx_external_task_mappings_task ON public.external_task_mappings(task_id);
CREATE INDEX idx_external_task_mappings_org ON public.external_task_mappings(organization_id);

-- Triggers for updated_at
CREATE TRIGGER update_asana_accounts_updated_at
  BEFORE UPDATE ON public.asana_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trello_accounts_updated_at
  BEFORE UPDATE ON public.trello_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();