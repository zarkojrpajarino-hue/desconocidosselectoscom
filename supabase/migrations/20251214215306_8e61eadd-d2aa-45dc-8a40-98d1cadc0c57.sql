-- Fix welcome email trigger to not require CRON_SECRET authentication
-- The trigger calls from database need to bypass the auth check

-- First, update the trigger function to include a special internal header
CREATE OR REPLACE FUNCTION public.send_welcome_email_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cron_secret TEXT;
BEGIN
  -- Get the CRON_SECRET from environment
  cron_secret := current_setting('app.settings.cron_secret', true);
  
  -- Call the edge function with the CRON_SECRET header
  PERFORM net.http_post(
    url := 'https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', COALESCE(cron_secret, ''),
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc3J6ZnF0empyeHJ2cXl5cGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTc4MjcsImV4cCI6MjA3OTgzMzgyN30.EZrcIJZypke_7D1_355zMbWgG9FR8JygdXQ1L5X0EcE'
    ),
    body := jsonb_build_object('userId', NEW.id)
  );
  RETURN NEW;
END;
$$;