-- Create pipeline_stages table for multi-tenant CRM
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(organization_id, name),
  UNIQUE(organization_id, order_index)
);

-- Enable RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view pipeline stages from their organization"
  ON public.pipeline_stages FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_org ON public.pipeline_stages(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON public.pipeline_stages(organization_id, order_index);