-- Add column for admin page visibility to team
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS admin_visibility_team boolean DEFAULT false;