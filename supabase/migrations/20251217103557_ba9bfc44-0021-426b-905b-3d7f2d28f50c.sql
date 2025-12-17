-- Add team_size column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS team_size TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.team_size IS 'Team size range: 1-5, 6-10, 11-20, 21-30, 31-50, 51-100, 100+';