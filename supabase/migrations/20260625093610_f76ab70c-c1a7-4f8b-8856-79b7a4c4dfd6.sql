CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.current_role_label() FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "user_roles read own" ON public.user_roles;
CREATE POLICY "user_roles read own"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "user_roles director writes" ON public.user_roles;
CREATE POLICY "user_roles director writes"
ON public.user_roles
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'director'))
WITH CHECK (private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "staff write director or manager" ON public.staff;
CREATE POLICY "staff write director or manager"
ON public.staff
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'director') OR private.has_role(auth.uid(), 'manager'))
WITH CHECK (private.has_role(auth.uid(), 'director') OR private.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "weights write director" ON public.grade_weights;
CREATE POLICY "weights write director"
ON public.grade_weights
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'director'))
WITH CHECK (private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "grades write director" ON public.grade_rules;
CREATE POLICY "grades write director"
ON public.grade_rules
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'director'))
WITH CHECK (private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "ach write director" ON public.achievements;
CREATE POLICY "ach write director"
ON public.achievements
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'director'))
WITH CHECK (private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "ranks write director" ON public.ranks;
CREATE POLICY "ranks write director"
ON public.ranks
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'director'))
WITH CHECK (private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "legacy cfg write director" ON public.legacy_config;
CREATE POLICY "legacy cfg write director"
ON public.legacy_config
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'director'))
WITH CHECK (private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "titles write director" ON public.legacy_titles;
CREATE POLICY "titles write director"
ON public.legacy_titles
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'director'))
WITH CHECK (private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "claims select" ON public.achievement_claims;
CREATE POLICY "claims select"
ON public.achievement_claims
FOR SELECT
TO authenticated
USING (
  submitted_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
  OR private.has_role(auth.uid(), 'manager')
  OR private.has_role(auth.uid(), 'director')
);

DROP POLICY IF EXISTS "claims insert self" ON public.achievement_claims;
CREATE POLICY "claims insert self"
ON public.achievement_claims
FOR INSERT
TO authenticated
WITH CHECK (
  submitted_by = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
    OR private.has_role(auth.uid(), 'manager')
    OR private.has_role(auth.uid(), 'director')
  )
);

DROP POLICY IF EXISTS "claims update mgmt" ON public.achievement_claims;
CREATE POLICY "claims update mgmt"
ON public.achievement_claims
FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'manager') OR private.has_role(auth.uid(), 'director'))
WITH CHECK (private.has_role(auth.uid(), 'manager') OR private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "claims delete director" ON public.achievement_claims;
CREATE POLICY "claims delete director"
ON public.achievement_claims
FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "records select" ON public.achievement_records;
CREATE POLICY "records select"
ON public.achievement_records
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
  OR private.has_role(auth.uid(), 'manager')
  OR private.has_role(auth.uid(), 'director')
);

DROP POLICY IF EXISTS "records write mgmt" ON public.achievement_records;
CREATE POLICY "records write mgmt"
ON public.achievement_records
FOR INSERT
TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'manager') OR private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "records delete director" ON public.achievement_records;
CREATE POLICY "records delete director"
ON public.achievement_records
FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "evals select" ON public.monthly_evaluations;
CREATE POLICY "evals select"
ON public.monthly_evaluations
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
  OR private.has_role(auth.uid(), 'manager')
  OR private.has_role(auth.uid(), 'director')
);

DROP POLICY IF EXISTS "evals write mgmt" ON public.monthly_evaluations;
CREATE POLICY "evals write mgmt"
ON public.monthly_evaluations
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'manager') OR private.has_role(auth.uid(), 'director'))
WITH CHECK (private.has_role(auth.uid(), 'manager') OR private.has_role(auth.uid(), 'director'));

DROP POLICY IF EXISTS "claim evidence: read own" ON storage.objects;
CREATE POLICY "claim evidence: read own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'claim-evidence'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR private.has_role(auth.uid(), 'manager')
    OR private.has_role(auth.uid(), 'director')
  )
);

DROP POLICY IF EXISTS "claim evidence: delete own" ON storage.objects;
CREATE POLICY "claim evidence: delete own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'claim-evidence'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR private.has_role(auth.uid(), 'director')
  )
);