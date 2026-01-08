-- Fix remaining SECURITY DEFINER functions with missing search_path

-- 1. Fix can_use_trial_by_type function (returns boolean)
CREATE OR REPLACE FUNCTION public.can_use_trial_by_type(user_email text, onboard_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.trial_email_registry 
    WHERE email = user_email 
    AND onboarding_type = onboard_type
  );
END;
$$;

-- 2. Fix register_trial_email_by_type function (returns void)
CREATE OR REPLACE FUNCTION public.register_trial_email_by_type(user_email text, onboard_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.trial_email_registry (email, onboarding_type, first_trial_started_at)
  VALUES (user_email, onboard_type, now())
  ON CONFLICT (email, onboarding_type) DO NOTHING;
END;
$$;

-- Fix remaining overly permissive RLS policies
-- These are needed for signup flow but we can add basic validation

-- 1. Drop duplicate onboarding_submissions policies and create one consolidated
DROP POLICY IF EXISTS "Anyone can submit onboarding" ON public.onboarding_submissions;
DROP POLICY IF EXISTS "onboarding_submissions_public_insert" ON public.onboarding_submissions;

-- Create a single consolidated policy for onboarding - allows insert but requires contact_email field
-- Note: This is intentionally open for the signup flow, but we add a constraint
CREATE POLICY "Public insert with contact email required"
  ON public.onboarding_submissions FOR INSERT
  WITH CHECK (
    contact_email IS NOT NULL AND 
    length(trim(contact_email)) > 0
  );

-- 2. Fix trial_email_registry - drop old policy and add proper one
DROP POLICY IF EXISTS "System can insert trial registry" ON public.trial_email_registry;
CREATE POLICY "Insert trial registry with email required"
  ON public.trial_email_registry FOR INSERT
  WITH CHECK (
    email IS NOT NULL AND 
    length(trim(email)) > 0
  );