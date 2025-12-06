-- Slack Workspaces (one per organization)
CREATE TABLE public.slack_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  team_id text NOT NULL UNIQUE,
  team_name text NOT NULL,
  access_token text NOT NULL,
  bot_user_id text NOT NULL,
  scope text NOT NULL,
  
  default_channel_id text,
  default_channel_name text,
  
  enabled boolean DEFAULT true,
  event_filters jsonb DEFAULT '{}',
  
  total_messages_sent integer DEFAULT 0,
  last_message_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id)
);

-- Slack Channels
CREATE TABLE public.slack_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slack_workspace_id uuid REFERENCES public.slack_workspaces(id) ON DELETE CASCADE NOT NULL,
  channel_id text NOT NULL,
  channel_name text NOT NULL,
  is_private boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(slack_workspace_id, channel_id)
);

-- Slack Event Mappings
CREATE TABLE public.slack_event_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slack_workspace_id uuid REFERENCES public.slack_workspaces(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  channel_id text NOT NULL,
  channel_name text NOT NULL,
  enabled boolean DEFAULT true,
  
  template text,
  mention_users text[],
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(slack_workspace_id, event_type)
);

-- Slack Message Log
CREATE TABLE public.slack_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slack_workspace_id uuid REFERENCES public.slack_workspaces(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  channel_id text NOT NULL,
  
  message_text text NOT NULL,
  message_blocks jsonb,
  
  slack_timestamp text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_slack_workspaces_org ON public.slack_workspaces(organization_id);
CREATE INDEX idx_slack_channels_workspace ON public.slack_channels(slack_workspace_id);
CREATE INDEX idx_slack_event_mappings_workspace ON public.slack_event_mappings(slack_workspace_id);
CREATE INDEX idx_slack_messages_workspace ON public.slack_messages(slack_workspace_id);
CREATE INDEX idx_slack_messages_created ON public.slack_messages(created_at);

-- Enable RLS
ALTER TABLE public.slack_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_event_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage Slack workspace"
  ON public.slack_workspaces FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view Slack channels"
  ON public.slack_channels FOR SELECT
  USING (
    slack_workspace_id IN (
      SELECT id FROM public.slack_workspaces
      WHERE organization_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage event mappings"
  ON public.slack_event_mappings FOR ALL
  USING (
    slack_workspace_id IN (
      SELECT id FROM public.slack_workspaces
      WHERE organization_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Users can view message log"
  ON public.slack_messages FOR SELECT
  USING (
    slack_workspace_id IN (
      SELECT id FROM public.slack_workspaces
      WHERE organization_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );