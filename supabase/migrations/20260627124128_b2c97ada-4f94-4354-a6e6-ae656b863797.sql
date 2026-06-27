
ALTER TABLE public.generations REPLICA IDENTITY FULL;
ALTER TABLE public.assets REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.generations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.assets;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
