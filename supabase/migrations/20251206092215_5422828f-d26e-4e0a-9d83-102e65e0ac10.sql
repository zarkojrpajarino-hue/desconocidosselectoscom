-- Zapier Subscriptions (when user creates a Zap via webhook)
CREATE TABLE public.zapier_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Zapier webhook URL
  target_url text NOT NULL,
  
  -- Event being subscribed to
  event_type text NOT NULL,
  
  -- Optional filters
  filters jsonb DEFAULT '{}',
  
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id, target_url, event_type)
);

-- Outlook Accounts (one per user)
CREATE TABLE public.outlook_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  
  email text NOT NULL,
  display_name text,
  
  sync_enabled boolean DEFAULT true,
  calendar_id text,
  
  last_sync_at timestamptz,
  last_sync_status text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Outlook Event Mappings
CREATE TABLE public.outlook_event_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlook_account_id uuid REFERENCES public.outlook_accounts(id) ON DELETE CASCADE NOT NULL,
  task_schedule_id uuid REFERENCES public.task_schedule(id) ON DELETE CASCADE NOT NULL,
  
  outlook_event_id text NOT NULL,
  
  last_synced_at timestamptz DEFAULT now(),
  
  UNIQUE(task_schedule_id),
  UNIQUE(outlook_account_id, outlook_event_id)
);

-- Indexes
CREATE INDEX idx_zapier_subs_org ON public.zapier_subscriptions(organization_id);
CREATE INDEX idx_zapier_subs_event ON public.zapier_subscriptions(event_type);
CREATE INDEX idx_outlook_accounts_user ON public.outlook_accounts(user_id);
CREATE INDEX idx_outlook_mappings_account ON public.outlook_event_mappings(outlook_account_id);
CREATE INDEX idx_outlook_mappings_task ON public.outlook_event_mappings(task_schedule_id);

-- Enable RLS
ALTER TABLE public.zapier_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlook_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlook_event_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage Zapier subscriptions"
  ON public.zapier_subscriptions FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage their Outlook account"
  ON public.outlook_accounts FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their event mappings"
  ON public.outlook_event_mappings FOR ALL
  USING (
    outlook_account_id IN (
      SELECT id FROM public.outlook_accounts WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at on outlook_accounts
CREATE TRIGGER update_outlook_accounts_updated_at
  BEFORE UPDATE ON public.outlook_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();