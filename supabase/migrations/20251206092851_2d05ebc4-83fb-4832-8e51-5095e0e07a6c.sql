-- HubSpot Accounts (one per organization)
CREATE TABLE public.hubspot_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- HubSpot OAuth
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  
  -- HubSpot account info
  portal_id text NOT NULL,
  hub_domain text NOT NULL,
  
  -- Sync configuration
  sync_enabled boolean DEFAULT true,
  sync_direction text DEFAULT 'bidirectional',
  auto_sync_interval_minutes integer DEFAULT 15,
  
  -- Field mapping (customizable)
  field_mappings jsonb DEFAULT '{
    "name": "firstname,lastname",
    "email": "email",
    "company": "company",
    "phone": "phone",
    "score": "hs_lead_score",
    "stage": "dealstage",
    "value": "amount"
  }',
  
  -- Stats
  total_contacts_synced integer DEFAULT 0,
  total_deals_synced integer DEFAULT 0,
  last_sync_at timestamptz,
  last_sync_status text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id),
  UNIQUE(portal_id)
);

-- HubSpot Contact Mappings
CREATE TABLE public.hubspot_contact_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hubspot_account_id uuid REFERENCES public.hubspot_accounts(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  
  -- HubSpot IDs
  hubspot_contact_id text NOT NULL,
  hubspot_deal_id text,
  
  -- Sync metadata
  last_synced_at timestamptz DEFAULT now(),
  last_synced_direction text,
  sync_status text DEFAULT 'active',
  last_error text,
  
  UNIQUE(lead_id),
  UNIQUE(hubspot_account_id, hubspot_contact_id)
);

-- HubSpot Sync Queue (for async processing)
CREATE TABLE public.hubspot_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hubspot_account_id uuid REFERENCES public.hubspot_accounts(id) ON DELETE CASCADE NOT NULL,
  
  -- Sync operation
  operation text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  
  -- Payload
  data jsonb NOT NULL,
  
  -- Processing
  status text DEFAULT 'pending',
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  error_message text,
  
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Indexes
CREATE INDEX idx_hubspot_accounts_org ON public.hubspot_accounts(organization_id);
CREATE INDEX idx_hubspot_mappings_account ON public.hubspot_contact_mappings(hubspot_account_id);
CREATE INDEX idx_hubspot_mappings_lead ON public.hubspot_contact_mappings(lead_id);
CREATE INDEX idx_hubspot_queue_status ON public.hubspot_sync_queue(status);
CREATE INDEX idx_hubspot_queue_account ON public.hubspot_sync_queue(hubspot_account_id);

-- Enable RLS
ALTER TABLE public.hubspot_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_contact_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_sync_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage HubSpot account"
  ON public.hubspot_accounts FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view contact mappings"
  ON public.hubspot_contact_mappings FOR SELECT
  USING (
    hubspot_account_id IN (
      SELECT id FROM public.hubspot_accounts
      WHERE organization_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage sync queue"
  ON public.hubspot_sync_queue FOR ALL
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_hubspot_accounts_updated_at
  BEFORE UPDATE ON public.hubspot_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();