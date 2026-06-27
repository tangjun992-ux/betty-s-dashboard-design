-- ============ 1. folders ============
CREATE TABLE public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX folders_user_idx ON public.folders(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.folders TO authenticated;
GRANT ALL ON public.folders TO service_role;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner all folders" ON public.folders FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_folders_updated_at BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 2. assets (user-uploaded media metadata) ============
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('image','video','audio','other')),
  url text NOT NULL,
  thumb_url text,
  file_size bigint,
  mime_type text,
  width int, height int, duration_ms int,
  source text NOT NULL DEFAULT 'upload' CHECK (source IN ('upload','generation','import')),
  generation_id uuid REFERENCES public.generations(id) ON DELETE SET NULL,
  prompt text,
  model_used text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assets_user_created_idx ON public.assets(user_id, created_at DESC);
CREATE INDEX assets_user_kind_idx ON public.assets(user_id, kind, created_at DESC);
CREATE INDEX assets_user_folder_idx ON public.assets(user_id, folder_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner all assets" ON public.assets FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 3. Atomic credit consume RPC ============
CREATE OR REPLACE FUNCTION public.consume_credits(
  _user_id uuid,
  _amount int,
  _reason text,
  _ref_id uuid DEFAULT NULL,
  _idem text DEFAULT NULL
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bal int;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;

  -- idempotency short-circuit
  IF _idem IS NOT NULL AND EXISTS (SELECT 1 FROM credits_ledger WHERE idempotency_key = _idem) THEN
    SELECT credits INTO _bal FROM profiles WHERE id = _user_id;
    RETURN COALESCE(_bal, 0);
  END IF;

  -- lock row, check, decrement
  SELECT credits INTO _bal FROM profiles WHERE id = _user_id FOR UPDATE;
  IF _bal IS NULL THEN RAISE EXCEPTION 'profile not found'; END IF;
  IF _bal < _amount THEN
    RAISE EXCEPTION 'insufficient_credits' USING ERRCODE = 'P0001';
  END IF;

  UPDATE profiles SET credits = credits - _amount, updated_at = now() WHERE id = _user_id;
  INSERT INTO credits_ledger(user_id, delta, reason, ref_id, idempotency_key)
    VALUES (_user_id, -_amount, _reason, _ref_id, _idem);
  RETURN _bal - _amount;
END;
$$;

-- Refund helper (e.g. failed generation)
CREATE OR REPLACE FUNCTION public.refund_credits(
  _user_id uuid, _amount int, _reason text, _ref_id uuid DEFAULT NULL, _idem text DEFAULT NULL
) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bal int;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
  IF _idem IS NOT NULL AND EXISTS (SELECT 1 FROM credits_ledger WHERE idempotency_key = _idem) THEN
    SELECT credits INTO _bal FROM profiles WHERE id = _user_id; RETURN COALESCE(_bal,0);
  END IF;
  UPDATE profiles SET credits = credits + _amount, updated_at = now() WHERE id = _user_id RETURNING credits INTO _bal;
  INSERT INTO credits_ledger(user_id, delta, reason, ref_id, idempotency_key)
    VALUES (_user_id, _amount, _reason, _ref_id, _idem);
  RETURN _bal;
END; $$;

REVOKE ALL ON FUNCTION public.consume_credits(uuid,int,text,uuid,text) FROM public;
REVOKE ALL ON FUNCTION public.refund_credits(uuid,int,text,uuid,text) FROM public;
GRANT EXECUTE ON FUNCTION public.consume_credits(uuid,int,text,uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid,int,text,uuid,text) TO authenticated, service_role;

-- ============ 4. Monthly subscription credit grant ============
-- price_id -> monthly grant amount (mirrors CREDIT_GRANTS in stripe.server.ts)
CREATE OR REPLACE FUNCTION public.monthly_grant_for_price(_price_id text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _price_id
    WHEN 'betty_starter_monthly'  THEN 1500
    WHEN 'betty_starter_yearly'   THEN 1500
    WHEN 'betty_personal_monthly' THEN 3500
    WHEN 'betty_personal_yearly'  THEN 3500
    WHEN 'betty_creator_monthly'  THEN 8000
    WHEN 'betty_creator_yearly'   THEN 8000
    WHEN 'betty_max_monthly'      THEN 22000
    WHEN 'betty_max_yearly'       THEN 22000
    ELSE 0
  END;
$$;

-- Runs by cron (or admin); grants credits idempotently per subscription/period
CREATE OR REPLACE FUNCTION public.grant_monthly_credits()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; granted int := 0; amt int; key text;
BEGIN
  FOR r IN
    SELECT user_id, stripe_subscription_id, price_id, current_period_end
    FROM subscriptions
    WHERE status IN ('active','trialing','past_due')
      AND current_period_end IS NOT NULL
      AND current_period_end > now()
  LOOP
    amt := monthly_grant_for_price(r.price_id);
    IF amt > 0 THEN
      key := 'monthly:' || r.stripe_subscription_id || ':' || to_char(r.current_period_end, 'YYYYMMDDHH24MISS');
      BEGIN
        PERFORM refund_credits(r.user_id, amt, 'monthly:' || r.price_id, NULL, key);
        granted := granted + 1;
      EXCEPTION WHEN unique_violation THEN
        -- already granted for this period
        NULL;
      END;
    END IF;
  END LOOP;
  RETURN granted;
END; $$;
REVOKE ALL ON FUNCTION public.grant_monthly_credits() FROM public;
GRANT EXECUTE ON FUNCTION public.grant_monthly_credits() TO service_role;

-- ============ 5. Usage summary RPC ============
CREATE OR REPLACE FUNCTION public.get_usage_summary(_user_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'balance', COALESCE((SELECT credits FROM profiles WHERE id = _user_id), 0),
    'spent_30d', COALESCE((
      SELECT -SUM(delta) FROM credits_ledger
      WHERE user_id = _user_id AND delta < 0 AND created_at > now() - interval '30 days'
    ), 0),
    'granted_30d', COALESCE((
      SELECT SUM(delta) FROM credits_ledger
      WHERE user_id = _user_id AND delta > 0 AND created_at > now() - interval '30 days'
    ), 0),
    'generations_30d', COALESCE((
      SELECT COUNT(*) FROM generations
      WHERE user_id = _user_id AND created_at > now() - interval '30 days'
    ), 0),
    'subscription', (
      SELECT jsonb_build_object('price_id', price_id, 'status', status, 'period_end', current_period_end, 'cancel_at_period_end', cancel_at_period_end)
      FROM subscriptions WHERE user_id = _user_id
      ORDER BY created_at DESC LIMIT 1
    )
  );
$$;
REVOKE ALL ON FUNCTION public.get_usage_summary(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_usage_summary(uuid) TO authenticated, service_role;