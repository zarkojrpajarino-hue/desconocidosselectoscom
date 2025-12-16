-- Remove legacy password hash column from onboarding_submissions
-- Current onboarding flow uses supabase.auth.signUp directly, this column is unused

ALTER TABLE public.onboarding_submissions 
DROP COLUMN IF EXISTS account_password_hash;