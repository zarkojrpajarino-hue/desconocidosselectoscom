-- Configurar cron job para enviar recordatorios de actualización de métricas
-- Se ejecuta todos los lunes a las 9:00 AM

select cron.schedule(
  'send-metrics-reminder-weekly',
  '0 9 * * 1', -- Cada lunes a las 9:00 AM
  $$
  select
    net.http_post(
      url:='https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/send-metrics-reminder-batch',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc3J6ZnF0empyeHJ2cXl5cGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTc4MjcsImV4cCI6MjA3OTgzMzgyN30.EZrcIJZypke_7D1_355zMbWgG9FR8JygdXQ1L5X0EcE"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
