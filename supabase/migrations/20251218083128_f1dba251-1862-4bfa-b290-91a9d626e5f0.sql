-- Add week_start column to objectives table for weekly OKR tracking
ALTER TABLE public.objectives 
ADD COLUMN IF NOT EXISTS week_start DATE;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_objectives_week_start ON public.objectives(week_start);
CREATE INDEX IF NOT EXISTS idx_objectives_owner_week ON public.objectives(owner_user_id, week_start);

-- Comment explaining the column
COMMENT ON COLUMN public.objectives.week_start IS 'Start date of the week this OKR belongs to. NULL for organizational OKRs, populated for weekly personal OKRs.';