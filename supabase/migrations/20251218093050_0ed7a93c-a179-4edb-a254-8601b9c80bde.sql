-- Add BANT qualification fields to leads table
-- Budget, Authority, Need, Timeline + strategic fields

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS budget_confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS budget_amount numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS authority_level text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS need_level integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS timeline_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS competitors text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS main_objection text DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.leads.budget_confirmed IS 'BANT: Has confirmed budget available';
COMMENT ON COLUMN public.leads.budget_amount IS 'BANT: Confirmed budget amount in currency';
COMMENT ON COLUMN public.leads.authority_level IS 'BANT: Decision authority level (decisor, influencer, user, unknown)';
COMMENT ON COLUMN public.leads.need_level IS 'BANT: Need urgency level 1-10';
COMMENT ON COLUMN public.leads.timeline_date IS 'BANT: Target decision date';
COMMENT ON COLUMN public.leads.competitors IS 'Strategic: Competitors being considered';
COMMENT ON COLUMN public.leads.main_objection IS 'Strategic: Main sales objection to overcome';