-- Add work preferences columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS has_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS collaborative_percentage integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS financial_visibility_team boolean DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.organizations.has_team IS 'Whether the organization has a team (set by admin)';
COMMENT ON COLUMN public.organizations.collaborative_percentage IS 'Percentage of collaborative tasks (0-100, set by admin)';
COMMENT ON COLUMN public.organizations.financial_visibility_team IS 'Whether team members can see financial data (set by admin)';