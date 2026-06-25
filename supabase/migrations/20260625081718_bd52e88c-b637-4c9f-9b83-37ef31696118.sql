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

CREATE OR REPLACE FUNCTION public.is_director_bootstrap_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT lower(COALESCE(_email, '')) = 'ryu.lai@hotmail.com'
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_link_staff_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_director_bootstrap_email(text) FROM PUBLIC, anon, authenticated;