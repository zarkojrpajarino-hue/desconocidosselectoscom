-- Add preferred_week_start_day to user_global_agenda_settings (0=Sunday, 1=Monday, ..., 6=Saturday)
-- Default to Monday (1) for new users
ALTER TABLE public.user_global_agenda_settings 
ADD COLUMN IF NOT EXISTS preferred_week_start_day INTEGER DEFAULT 1 CHECK (preferred_week_start_day >= 0 AND preferred_week_start_day <= 6);

-- Add personal_week_start to track when user's current week actually started
ALTER TABLE public.user_global_agenda_settings 
ADD COLUMN IF NOT EXISTS personal_week_start DATE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_agenda_week_start ON public.user_global_agenda_settings(personal_week_start);

-- Comment for clarity
COMMENT ON COLUMN public.user_global_agenda_settings.preferred_week_start_day IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN public.user_global_agenda_settings.personal_week_start IS 'The start date of the user current week cycle';