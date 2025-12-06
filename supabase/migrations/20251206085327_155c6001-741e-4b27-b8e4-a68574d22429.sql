-- API Keys table for external API access
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  key_prefix text NOT NULL, -- "sk_live_", "sk_test_"
  key_hash text NOT NULL,   -- Hashed API key (SHA-256)
  last_used_at timestamptz,
  is_active boolean DEFAULT true,
  scopes text[] DEFAULT ARRAY['read', 'write'],
  rate_limit integer DEFAULT 100, -- requests per minute
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  
  UNIQUE(key_hash)
);

-- API Usage Tracking for rate limiting and analytics
CREATE TABLE public.api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer,
  response_time_ms integer,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Webhooks table for event notifications
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  secret text NOT NULL,
  events text[] NOT NULL DEFAULT ARRAY['lead.created', 'lead.updated', 'task.completed'],
  is_active boolean DEFAULT true,
  retry_enabled boolean DEFAULT true,
  max_retries integer DEFAULT 3,
  total_deliveries integer DEFAULT 0,
  successful_deliveries integer DEFAULT 0,
  failed_deliveries integer DEFAULT 0,
  last_delivery_at timestamptz,
  last_delivery_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Webhook Deliveries for tracking and retry
CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES public.webhooks(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  attempt_number integer DEFAULT 1,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'delivered', 'failed'
  http_status_code integer,
  response_body text,
  response_time_ms integer,
  error_message text,
  delivered_at timestamptz,
  next_retry_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_org ON public.api_keys(organization_id);
CREATE INDEX idx_api_keys_active ON public.api_keys(organization_id, is_active);
CREATE INDEX idx_api_usage_key ON public.api_usage(api_key_id);
CREATE INDEX idx_api_usage_created ON public.api_usage(created_at);
CREATE INDEX idx_api_usage_rate_limit ON public.api_usage(api_key_id, created_at);
CREATE INDEX idx_webhooks_org ON public.webhooks(organization_id);
CREATE INDEX idx_webhooks_active ON public.webhooks(organization_id, is_active);
CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_retry ON public.webhook_deliveries(next_retry_at) 
  WHERE status = 'failed' AND next_retry_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for API Keys (admin only)
CREATE POLICY "Admins can manage API keys"
  ON public.api_keys FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for API Usage (admin can view)
CREATE POLICY "Admins can view API usage"
  ON public.api_usage FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Webhooks (admin only)
CREATE POLICY "Admins can manage webhooks"
  ON public.webhooks FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Webhook Deliveries (admin can view)
CREATE POLICY "Admins can view webhook deliveries"
  ON public.webhook_deliveries FOR SELECT
  USING (
    webhook_id IN (
      SELECT id FROM public.webhooks
      WHERE organization_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Trigger for updated_at on webhooks
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate webhook secret
CREATE OR REPLACE FUNCTION public.generate_webhook_secret()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret text;
BEGIN
  SELECT encode(gen_random_bytes(32), 'hex') INTO secret;
  RETURN 'whsec_' || secret;
END;
$$;