
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS generations_user_fav_idx ON public.generations(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS generations_user_folder_idx ON public.generations(user_id, folder_id);
CREATE INDEX IF NOT EXISTS assets_user_fav_idx ON public.assets(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS assets_user_folder_idx ON public.assets(user_id, folder_id);
