CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Remove any previous schedule with the same name (idempotent re-run)
DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job WHERE jobname = 'betty_monthly_grant';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'betty_monthly_grant',
  '0 2 * * *',
  $$ SELECT public.grant_monthly_credits(); $$
);