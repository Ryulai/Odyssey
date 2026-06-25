ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

CREATE OR REPLACE FUNCTION public.auto_link_staff_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id uuid;
BEGIN
  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL AND btrim(NEW.email) <> '' THEN
    SELECT id INTO _profile_id
    FROM public.profiles
    WHERE lower(email) = lower(NEW.email)
    ORDER BY created_at ASC
    LIMIT 1;

    IF _profile_id IS NOT NULL THEN
      NEW.user_id := _profile_id;
    END IF;
  END IF;

  NEW.status := COALESCE(NULLIF(lower(NEW.status), ''), 'active');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_link_staff_profile ON public.staff;
CREATE TRIGGER trg_auto_link_staff_profile
BEFORE INSERT OR UPDATE OF email, user_id, status ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.auto_link_staff_profile();