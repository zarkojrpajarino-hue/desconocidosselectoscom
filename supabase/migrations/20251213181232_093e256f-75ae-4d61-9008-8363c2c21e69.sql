-- Fix username column to have a default value based on email
-- This allows signup to work without requiring a username upfront

-- First, update any existing null usernames
UPDATE public.users 
SET username = SPLIT_PART(email, '@', 1) || '_' || SUBSTRING(id::text, 1, 8)
WHERE username IS NULL OR username = '';

-- Alter the column to have a default value using a function
CREATE OR REPLACE FUNCTION public.generate_username_from_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username IS NULL OR NEW.username = '' THEN
    NEW.username := SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate username before insert
DROP TRIGGER IF EXISTS generate_username_trigger ON public.users;
CREATE TRIGGER generate_username_trigger
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_username_from_email();