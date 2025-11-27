-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Actualizar función de bienvenida con URL fija
CREATE OR REPLACE FUNCTION public.send_welcome_email_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc3J6ZnF0empyeHJ2cXl5cGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTc4MjcsImV4cCI6MjA3OTgzMzgyN30.EZrcIJZypke_7D1_355zMbWgG9FR8JygdXQ1L5X0EcE'
    ),
    body := jsonb_build_object('userId', NEW.id)
  );
  RETURN NEW;
END;
$$;

-- Actualizar función de evaluación con URL fija
CREATE OR REPLACE FUNCTION public.send_evaluation_notification_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.leader_evaluation IS NOT NULL AND (OLD.leader_evaluation IS NULL OR NEW.leader_evaluation != OLD.leader_evaluation))
     OR (NEW.validated_by_leader = true AND OLD.validated_by_leader = false) THEN
    
    PERFORM net.http_post(
      url := 'https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/send-evaluation-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc3J6ZnF0empyeHJ2cXl5cGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTc4MjcsImV4cCI6MjA3OTgzMzgyN30.EZrcIJZypke_7D1_355zMbWgG9FR8JygdXQ1L5X0EcE'
      ),
      body := jsonb_build_object(
        'userId', NEW.user_id,
        'taskId', NEW.task_id,
        'completionId', NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Actualizar función de swap con URL fija
CREATE OR REPLACE FUNCTION public.send_swap_confirmation_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/send-swap-confirmation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc3J6ZnF0empyeHJ2cXl5cGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTc4MjcsImV4cCI6MjA3OTgzMzgyN30.EZrcIJZypke_7D1_355zMbWgG9FR8JygdXQ1L5X0EcE'
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id,
      'swapId', NEW.id
    )
  );
  RETURN NEW;
END;
$$;