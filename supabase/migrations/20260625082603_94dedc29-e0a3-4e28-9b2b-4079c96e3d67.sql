ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS system_role public.app_role NOT NULL DEFAULT 'staff'::public.app_role;

WITH preferred AS (
  SELECT DISTINCT ON (ur.user_id)
    ur.user_id,
    ur.role
  FROM public.user_roles ur
  ORDER BY ur.user_id,
    CASE ur.role
      WHEN 'director'::public.app_role THEN 1
      WHEN 'manager'::public.app_role THEN 2
      ELSE 3
    END
)
UPDATE public.staff s
SET system_role = p.role,
    updated_at = now()
FROM preferred p
WHERE s.user_id = p.user_id;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _needs_director BOOLEAN;
  _staff_role public.app_role;
  _assigned_role public.app_role;
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

  SELECT system_role INTO _staff_role
  FROM public.staff
  WHERE email IS NOT NULL
    AND lower(email) = lower(NEW.email)
  ORDER BY created_at ASC
  LIMIT 1;

  _assigned_role := CASE
    WHEN _needs_director OR lower(NEW.email) = 'ryu.lai@hotmail.com' THEN 'director'::public.app_role
    ELSE COALESCE(_staff_role, 'staff'::public.app_role)
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.staff
  SET user_id = NEW.id,
      system_role = CASE
        WHEN _assigned_role = 'director'::public.app_role THEN 'director'::public.app_role
        ELSE system_role
      END,
      updated_at = now()
  WHERE user_id IS NULL
    AND email IS NOT NULL
    AND lower(email) = lower(NEW.email);

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;