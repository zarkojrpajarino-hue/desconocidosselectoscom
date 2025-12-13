-- Make username column have a default value to prevent signup errors
ALTER TABLE public.users 
ALTER COLUMN username SET DEFAULT '';

-- Drop and recreate the trigger with proper handling
DROP TRIGGER IF EXISTS generate_username_trigger ON public.users;

CREATE OR REPLACE FUNCTION public.generate_username_from_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate username from email if empty or null
  IF NEW.username IS NULL OR NEW.username = '' THEN
    NEW.username := SPLIT_PART(COALESCE(NEW.email, 'user'), '@', 1) || '_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_username_trigger
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_username_from_email();