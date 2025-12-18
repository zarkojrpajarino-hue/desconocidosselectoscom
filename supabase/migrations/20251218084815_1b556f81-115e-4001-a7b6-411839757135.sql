-- Add week_start_day to organizations (configured by admin for whole org)
-- 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS week_start_day INTEGER DEFAULT 1 CHECK (week_start_day >= 0 AND week_start_day <= 6);

-- Comment for clarity
COMMENT ON COLUMN public.organizations.week_start_day IS 'Day the week starts for this organization. 0=Sunday, 1=Monday, ..., 6=Saturday. Configured by admin.';