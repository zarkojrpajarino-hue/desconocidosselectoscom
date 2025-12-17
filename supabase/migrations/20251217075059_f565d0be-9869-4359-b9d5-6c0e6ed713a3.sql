-- Add work preferences columns to user_global_agenda_settings
ALTER TABLE public.user_global_agenda_settings 
ADD COLUMN IF NOT EXISTS has_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS collaborative_percentage integer DEFAULT 0 CHECK (collaborative_percentage >= 0 AND collaborative_percentage <= 100);