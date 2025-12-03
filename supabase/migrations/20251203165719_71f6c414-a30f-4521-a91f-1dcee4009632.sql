-- Tabla para recursos IA generados para tareas
CREATE TABLE ai_task_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  resource_type text NOT NULL CHECK (
    resource_type IN (
      'video_scripts',
      'influencer_list',
      'ad_campaign',
      'social_posts',
      'design_brief',
      'outreach_templates',
      'email_sequences'
    )
  ),
  
  resources jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(task_id)
);

-- Índices para performance
CREATE INDEX idx_ai_task_resources_task ON ai_task_resources(task_id);
CREATE INDEX idx_ai_task_resources_org ON ai_task_resources(organization_id);
CREATE INDEX idx_ai_task_resources_type ON ai_task_resources(resource_type);

-- RLS Policies
ALTER TABLE ai_task_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI resources for their org"
  ON ai_task_resources FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert AI resources for their org"
  ON ai_task_resources FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update AI resources for their org"
  ON ai_task_resources FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete AI resources for their org"
  ON ai_task_resources FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_ai_task_resources_updated_at
  BEFORE UPDATE ON ai_task_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE ai_task_resources IS 'Stores AI-generated resources for tasks';
COMMENT ON COLUMN ai_task_resources.resource_type IS 'Type: video_scripts, influencer_list, ad_campaign, social_posts, design_brief, outreach_templates, email_sequences';