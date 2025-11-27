-- Función para enviar email de bienvenida cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.send_welcome_email_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Llamar a la edge function de bienvenida en background
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := jsonb_build_object('userId', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para enviar email de bienvenida
CREATE TRIGGER on_user_created_send_welcome
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_trigger();

-- Función para enviar email de notificación de evaluación
CREATE OR REPLACE FUNCTION public.send_evaluation_notification_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo enviar email si se actualizó la evaluación del líder
  IF (NEW.leader_evaluation IS NOT NULL AND (OLD.leader_evaluation IS NULL OR NEW.leader_evaluation != OLD.leader_evaluation))
     OR (NEW.validated_by_leader = true AND OLD.validated_by_leader = false) THEN
    
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-evaluation-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
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

-- Trigger para enviar email de evaluación
CREATE TRIGGER on_task_evaluated_send_notification
  AFTER UPDATE ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.send_evaluation_notification_trigger();

-- Función para enviar email de confirmación de swap
CREATE OR REPLACE FUNCTION public.send_swap_confirmation_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-swap-confirmation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id,
      'swapId', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para enviar email de confirmación de swap
CREATE TRIGGER on_task_swapped_send_confirmation
  AFTER INSERT ON public.task_swaps
  FOR EACH ROW
  EXECUTE FUNCTION public.send_swap_confirmation_trigger();