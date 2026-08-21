CREATE OR REPLACE FUNCTION private.is_direct_manager(_user_id uuid, _staff_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff s JOIN public.staff m ON m.id = s.manager_id
    WHERE s.id = _staff_id AND m.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION private.has_direct_reports(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff s JOIN public.staff m ON m.id = s.manager_id
    WHERE m.user_id = _user_id
  );
$$;

DROP POLICY IF EXISTS "evals select direct manager" ON public.monthly_evaluations;
CREATE POLICY "evals select direct manager" ON public.monthly_evaluations FOR SELECT TO authenticated
USING (private.is_direct_manager(auth.uid(), staff_id));

DROP POLICY IF EXISTS "records select direct manager" ON public.achievement_records;
CREATE POLICY "records select direct manager" ON public.achievement_records FOR SELECT TO authenticated
USING (private.is_direct_manager(auth.uid(), staff_id));

DROP POLICY IF EXISTS "claims select direct manager" ON public.achievement_claims;
CREATE POLICY "claims select direct manager" ON public.achievement_claims FOR SELECT TO authenticated
USING (private.is_direct_manager(auth.uid(), staff_id));

DROP FUNCTION IF EXISTS public.is_direct_manager(uuid, uuid);
DROP FUNCTION IF EXISTS public.has_direct_reports(uuid);