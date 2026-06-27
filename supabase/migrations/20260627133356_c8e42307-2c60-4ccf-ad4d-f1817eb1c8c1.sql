-- Rate limiting via fixed-window counter table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, bucket, window_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No client policies: only SECURITY DEFINER fn touches this table.

CREATE INDEX IF NOT EXISTS rate_limits_cleanup_idx ON public.rate_limits(window_start);

-- Atomic check-and-increment. Returns true if allowed.
CREATE OR REPLACE FUNCTION public.rate_limit_check(
  _user_id uuid,
  _bucket text,
  _max integer,
  _window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _w timestamptz;
  _c integer;
BEGIN
  _w := date_trunc('second', now()) - (extract(epoch from now())::bigint % _window_seconds) * interval '1 second';
  INSERT INTO rate_limits(user_id, bucket, window_start, count)
    VALUES (_user_id, _bucket, _w, 1)
  ON CONFLICT (user_id, bucket, window_start)
    DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO _c;
  -- best-effort GC of stale rows for this user/bucket
  DELETE FROM rate_limits
    WHERE user_id = _user_id AND bucket = _bucket AND window_start < _w - interval '1 hour';
  RETURN _c <= _max;
END;
$$;