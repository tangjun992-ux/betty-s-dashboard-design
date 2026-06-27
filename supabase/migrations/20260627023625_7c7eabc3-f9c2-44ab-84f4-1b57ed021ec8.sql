
CREATE TABLE public.elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  thumb_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.elements TO authenticated;
GRANT ALL ON public.elements TO service_role;

ALTER TABLE public.elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own elements"
  ON public.elements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX elements_user_idx ON public.elements(user_id, created_at DESC);
