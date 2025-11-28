-- =====================================================
-- CONFIGURAR CRON JOB PARA RECORDATORIOS DE TAREAS
-- =====================================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard > SQL Editor
-- 2. Copia y pega este SQL completo
-- 3. REEMPLAZA los valores:
--    - [YOUR-PROJECT-ID] con tu ID de proyecto (ej: nrsrzfqtzjrxrvqyypdn)
--    - [YOUR-SERVICE-ROLE-KEY] con tu Service Role Key de Supabase
-- 4. Ejecuta el script
-- 
-- NOTA: Este cron job se ejecutará cada 6 horas para enviar recordatorios
-- =====================================================

-- Habilitar extensiones necesarias (si no están ya habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Eliminar cron job existente si existe (para re-configurar)
SELECT cron.unschedule('task-reminders-system');

-- Crear nuevo cron job que se ejecuta cada 6 horas
SELECT cron.schedule(
  'task-reminders-system',
  '0 */6 * * *', -- Cada 6 horas (a las 00:00, 06:00, 12:00, 18:00)
  $$
  SELECT net.http_post(
    url := 'https://[YOUR-PROJECT-ID].supabase.co/functions/v1/send-task-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [YOUR-SERVICE-ROLE-KEY]'
    ),
    body := jsonb_build_object(
      'timestamp', now()::text
    )
  ) as request_id;
  $$
);

-- Verificar que el cron job fue creado correctamente
SELECT * FROM cron.job WHERE jobname = 'task-reminders-system';

-- =====================================================
-- COMANDOS ÚTILES PARA GESTIONAR EL CRON JOB
-- =====================================================

-- Ver todos los cron jobs activos:
-- SELECT * FROM cron.job;

-- Ver historial de ejecuciones del cron job:
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'task-reminders-system')
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- Ejecutar el cron job manualmente (para testing):
-- SELECT cron.schedule('test-task-reminders', '* * * * *', 
--   $$ SELECT net.http_post(
--     url := 'https://[YOUR-PROJECT-ID].supabase.co/functions/v1/send-task-reminders',
--     headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer [YOUR-SERVICE-ROLE-KEY]'),
--     body := jsonb_build_object('timestamp', now()::text)
--   ) $$
-- );
-- SELECT cron.unschedule('test-task-reminders'); -- Eliminar después de probar

-- Eliminar el cron job:
-- SELECT cron.unschedule('task-reminders-system');
