-- Crear función para enviar resúmenes semanales a admins de planes Professional/Enterprise
CREATE OR REPLACE FUNCTION public.send_weekly_summaries_to_admins()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Seleccionar solo admins de organizaciones con planes Professional o Enterprise
  FOR admin_record IN
    SELECT DISTINCT u.id as user_id, u.email, ur.organization_id
    FROM users u
    INNER JOIN user_roles ur ON ur.user_id = u.id
    INNER JOIN organizations o ON o.id = ur.organization_id
    WHERE ur.role = 'admin'
      AND o.plan IN ('professional', 'enterprise')
      AND EXISTS (
        SELECT 1 FROM user_notification_preferences unp
        WHERE unp.user_id = u.id
          AND unp.email_enabled = true
          AND unp.weekly_summary = true
      )
  LOOP
    -- Llamar al edge function para cada admin
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-weekly-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'x-cron-secret', current_setting('app.settings.cron_secret')
      ),
      body := jsonb_build_object('userId', admin_record.user_id)
    );
    
    -- Pequeña pausa para evitar rate limiting (100ms entre llamadas)
    PERFORM pg_sleep(0.1);
  END LOOP;
END;
$$;