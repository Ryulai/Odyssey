ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _needs_director BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 2))
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = EXCLUDED.email,
    avatar = COALESCE(public.profiles.avatar, EXCLUDED.avatar),
    updated_at = now();

  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'director'::public.app_role
  ) INTO _needs_director;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE
      WHEN _needs_director OR lower(NEW.email) = 'ryu.lai@hotmail.com' THEN 'director'::public.app_role
      ELSE 'staff'::public.app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.staff
  SET user_id = NEW.id,
      updated_at = now()
  WHERE user_id IS NULL
    AND email IS NOT NULL
    AND lower(email) = lower(NEW.email);

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_link_staff_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id uuid;
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(btrim(NEW.email));
  END IF;

  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL AND NEW.email <> '' THEN
    SELECT id INTO _profile_id
    FROM public.profiles
    WHERE lower(email) = NEW.email
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

CREATE OR REPLACE FUNCTION public.is_director_bootstrap_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT lower(COALESCE(_email, '')) = 'ryu.lai@hotmail.com'
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'director'::public.app_role
FROM public.profiles
WHERE lower(email) = 'ryu.lai@hotmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'director'::public.app_role
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'director'::public.app_role)
ORDER BY p.created_at ASC
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.staff s
SET user_id = p.id,
    updated_at = now()
FROM public.profiles p
WHERE s.user_id IS NULL
  AND s.email IS NOT NULL
  AND p.email IS NOT NULL
  AND lower(s.email) = lower(p.email);

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_link_staff_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_director_bootstrap_email(text) FROM PUBLIC, anon, authenticated;