-- =====================================================
-- CONFIGURAR CRON JOB PARA GENERACIÓN DE AGENDAS SEMANALES
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
-- NOTA: Este cron job se ejecutará cada miércoles a las 13:30 (antes de la deadline)
-- =====================================================

-- Habilitar extensiones necesarias (si no están ya habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Eliminar cron job existente si existe (para re-configurar)
SELECT cron.unschedule('weekly-schedules-generation');

-- Crear nuevo cron job que se ejecuta cada lunes a las 13:01
SELECT cron.schedule(
  'weekly-schedules-generation',
  '01 13 * * 1', -- Cada lunes a las 13:01
  $$
  SELECT net.http_post(
    url := 'https://[YOUR-PROJECT-ID].supabase.co/functions/v1/generate-weekly-schedules',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [YOUR-SERVICE-ROLE-KEY]'
    ),
    body := jsonb_build_object(
      'timestamp', now()::text,
      'trigger', 'cron'
    )
  ) as request_id;
  $$
);

-- Verificar que el cron job fue creado correctamente
SELECT * FROM cron.job WHERE jobname = 'weekly-schedules-generation';

-- =====================================================
-- COMANDOS ÚTILES PARA GESTIONAR EL CRON JOB
-- =====================================================

-- Ver todos los cron jobs activos:
-- SELECT * FROM cron.job;

-- Ver historial de ejecuciones del cron job:
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-schedules-generation')
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- Ejecutar el cron job manualmente (para testing):
-- SELECT cron.schedule('test-weekly-schedules', '* * * * *', 
--   $$ SELECT net.http_post(
--     url := 'https://[YOUR-PROJECT-ID].supabase.co/functions/v1/generate-weekly-schedules',
--     headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer [YOUR-SERVICE-ROLE-KEY]'),
--     body := jsonb_build_object('timestamp', now()::text, 'trigger', 'manual_test')
--   ) $$
-- );
-- SELECT cron.unschedule('test-weekly-schedules'); -- Eliminar después de probar

-- Eliminar el cron job:
-- SELECT cron.unschedule('weekly-schedules-generation');

-- =====================================================
-- TESTING MANUAL
-- =====================================================
-- Para probar la función manualmente desde SQL Editor:
-- SELECT net.http_post(
--   url := 'https://[YOUR-PROJECT-ID].supabase.co/functions/v1/generate-weekly-schedules',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'Authorization', 'Bearer [YOUR-SERVICE-ROLE-KEY]'
--   ),
--   body := jsonb_build_object(
--     'timestamp', now()::text,
--     'trigger', 'manual_test'
--   )
-- );
