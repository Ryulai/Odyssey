
CREATE OR REPLACE FUNCTION public.set_claim_month_bucket()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.month_bucket := to_char(COALESCE(NEW.created_at, now()) AT TIME ZONE 'UTC', 'YYYY-MM');
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_staff_rank(uuid) FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.trg_refresh_rank_records() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.set_claim_month_bucket() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.handle_claim_decision() FROM PUBLIC, authenticated, anon;
