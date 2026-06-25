
ALTER TABLE public.ranks
  ADD COLUMN IF NOT EXISTS min_total_stars INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_a_grades INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_b_grades INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_achievements INTEGER NOT NULL DEFAULT 0;

UPDATE public.ranks SET min_total_stars = 0,  min_a_grades = 0,  min_b_grades = 0,  min_achievements = 0  WHERE key = 'bronze';
UPDATE public.ranks SET min_total_stars = 5,  min_a_grades = 0,  min_b_grades = 6,  min_achievements = 3  WHERE key = 'silver';
UPDATE public.ranks SET min_total_stars = 20, min_a_grades = 8,  min_b_grades = 12, min_achievements = 10 WHERE key = 'gold';
UPDATE public.ranks SET min_total_stars = 50, min_a_grades = 12, min_b_grades = 0,  min_achievements = 20 WHERE key = 'platinum';
UPDATE public.ranks SET min_total_stars = 100,min_a_grades = 24, min_b_grades = 0,  min_achievements = 40 WHERE key = 'diamond';
UPDATE public.ranks SET min_total_stars = 200,min_a_grades = 36, min_b_grades = 0,  min_achievements = 60 WHERE key = 'blackdiamond';

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS current_rank_key TEXT REFERENCES public.ranks(key) ON DELETE SET NULL;

-- Trigger-maintained month bucket (immutable from index's POV)
ALTER TABLE public.achievement_claims
  ADD COLUMN IF NOT EXISTS month_bucket TEXT;

CREATE OR REPLACE FUNCTION public.set_claim_month_bucket()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.month_bucket := to_char(COALESCE(NEW.created_at, now()) AT TIME ZONE 'UTC', 'YYYY-MM');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS claims_month_bucket ON public.achievement_claims;
CREATE TRIGGER claims_month_bucket
BEFORE INSERT OR UPDATE OF created_at ON public.achievement_claims
FOR EACH ROW EXECUTE FUNCTION public.set_claim_month_bucket();

UPDATE public.achievement_claims
SET month_bucket = to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM')
WHERE month_bucket IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS claims_no_dup_active
  ON public.achievement_claims (staff_id, achievement_id, month_bucket)
  WHERE status <> 'rejected';

CREATE OR REPLACE FUNCTION public.handle_claim_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _stars INT; _period TEXT; _cycle TEXT; _exists BOOLEAN;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    SELECT EXISTS (SELECT 1 FROM public.achievement_records WHERE claim_id = NEW.id) INTO _exists;
    IF _exists THEN RETURN NEW; END IF;
    SELECT star_reward, reset_cycle INTO _stars, _cycle FROM public.achievements WHERE id = NEW.achievement_id;
    _period := CASE _cycle
      WHEN 'Monthly'  THEN to_char(COALESCE(NEW.decided_at, now()), 'Mon YYYY')
      WHEN 'Seasonal' THEN 'Q' || to_char(COALESCE(NEW.decided_at, now()), 'Q YYYY')
      WHEN 'Yearly'   THEN to_char(COALESCE(NEW.decided_at, now()), 'YYYY')
      ELSE to_char(COALESCE(NEW.decided_at, now()), 'YYYY-MM-DD')
    END;
    INSERT INTO public.achievement_records (staff_id, achievement_id, claim_id, period, stars)
    VALUES (NEW.staff_id, NEW.achievement_id, NEW.id, _period, COALESCE(_stars, 1));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.evaluate_rank(_staff_id uuid)
RETURNS TABLE (
  current_rank_key TEXT, current_rank_name TEXT,
  next_rank_key TEXT, next_rank_name TEXT,
  total_stars INT, a_grades INT, b_grades INT, unique_achievements INT,
  next_min_total_stars INT, next_min_a_grades INT, next_min_b_grades INT, next_min_achievements INT,
  eligible BOOLEAN
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _stars INT; _a INT; _b INT; _ach INT; _cur RECORD; _nxt RECORD;
BEGIN
  SELECT COALESCE(SUM(stars), 0)::INT INTO _stars FROM achievement_records WHERE staff_id = _staff_id;
  SELECT COUNT(*)::INT INTO _a FROM monthly_evaluations WHERE staff_id = _staff_id AND grade = 'A';
  SELECT COUNT(*)::INT INTO _b FROM monthly_evaluations WHERE staff_id = _staff_id AND grade = 'B';
  SELECT COUNT(DISTINCT achievement_id)::INT INTO _ach FROM achievement_records WHERE staff_id = _staff_id;

  SELECT * INTO _cur FROM ranks
   WHERE NOT locked AND min_total_stars <= _stars AND min_a_grades <= _a
     AND min_b_grades <= _b AND min_achievements <= _ach
   ORDER BY position DESC LIMIT 1;

  SELECT * INTO _nxt FROM ranks
   WHERE NOT locked AND position > COALESCE(_cur.position, 0)
   ORDER BY position ASC LIMIT 1;

  RETURN QUERY SELECT
    _cur.key, _cur.name, _nxt.key, _nxt.name,
    _stars, _a, _b, _ach,
    COALESCE(_nxt.min_total_stars, 0), COALESCE(_nxt.min_a_grades, 0),
    COALESCE(_nxt.min_b_grades, 0), COALESCE(_nxt.min_achievements, 0),
    _nxt.key IS NOT NULL
      AND _stars >= _nxt.min_total_stars AND _a >= _nxt.min_a_grades
      AND _b >= _nxt.min_b_grades AND _ach >= _nxt.min_achievements;
END;
$$;

GRANT EXECUTE ON FUNCTION public.evaluate_rank(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.refresh_staff_rank(_staff_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _key TEXT;
BEGIN
  SELECT current_rank_key INTO _key FROM public.evaluate_rank(_staff_id);
  UPDATE staff SET current_rank_key = _key WHERE id = _staff_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_refresh_rank_records()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.refresh_staff_rank(COALESCE(NEW.staff_id, OLD.staff_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS refresh_rank_on_records ON public.achievement_records;
CREATE TRIGGER refresh_rank_on_records
AFTER INSERT OR UPDATE OR DELETE ON public.achievement_records
FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_rank_records();

DROP TRIGGER IF EXISTS refresh_rank_on_evaluations ON public.monthly_evaluations;
CREATE TRIGGER refresh_rank_on_evaluations
AFTER INSERT OR UPDATE OR DELETE ON public.monthly_evaluations
FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_rank_records();
