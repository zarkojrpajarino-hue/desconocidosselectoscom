-- =====================================================
-- ✅ CONFIGURAR CRON JOB - GENERACIÓN AUTOMÁTICA DE AGENDAS
-- =====================================================
-- 
-- INSTRUCCIONES:
-- 1. Abre Lovable Cloud: Click en "Cloud" → Database → SQL Editor
-- 2. Copia y pega este SQL completo
-- 3. Ejecuta el script (Run)
-- 4. Verifica que aparezca el cron job al final
-- 
-- ⏰ PROGRAMACIÓN: Cada lunes a las 13:01
-- 🎯 ACCIÓN: Genera las agendas semanales usando IA
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Eliminar cron job anterior si existe
SELECT cron.unschedule('generate-weekly-schedules');

-- ✅ Crear cron job: Lunes 13:01 (después del deadline de disponibilidad)
SELECT cron.schedule(
  'generate-weekly-schedules',
  '1 13 * * 1',  -- Lunes a las 13:01
  $$
  SELECT
    net.http_post(
      url:='https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/generate-weekly-schedules',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc3J6ZnF0empyeHJ2cXl5cGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTc4MjcsImV4cCI6MjA3OTgzMzgyN30.EZrcIJZypke_7D1_355zMbWgG9FR8JygdXQ1L5X0EcE'
      ),
      body:=jsonb_build_object(
        'timestamp', now()::text,
        'trigger', 'cron'
      )
    ) AS request_id;
  $$
);

-- ✅ Verificar que el cron job fue creado correctamente
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  nodename
FROM cron.job 
WHERE jobname = 'generate-weekly-schedules';

-- =====================================================
-- 📊 COMANDOS ÚTILES
-- =====================================================

-- Ver historial de ejecuciones (últimas 10):
/*
SELECT 
  runid,
  jobid,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-weekly-schedules')
ORDER BY start_time DESC 
LIMIT 10;
*/

-- Probar manualmente (ejecutar una vez):
/*
SELECT net.http_post(
  url:='https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/generate-weekly-schedules',
  headers:=jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc3J6ZnF0empyeHJ2cXl5cGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTc4MjcsImV4cCI6MjA3OTgzMzgyN30.EZrcIJZypke_7D1_355zMbWgG9FR8JygdXQ1L5X0EcE'
  ),
  body:=jsonb_build_object(
    'timestamp', now()::text,
    'trigger', 'manual_test'
  )
) AS result;
*/

-- Eliminar el cron job:
/*
SELECT cron.unschedule('generate-weekly-schedules');
*/