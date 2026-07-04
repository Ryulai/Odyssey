DROP POLICY IF EXISTS "Owner or manager/director view daily sales" ON public.daily_sales_claims;
CREATE POLICY "Owner or manager/director view daily sales"
  ON public.daily_sales_claims FOR SELECT TO authenticated
  USING (
    submitted_by = auth.uid()
    OR private.has_role(auth.uid(), 'manager')
    OR private.has_role(auth.uid(), 'director')
  );

DROP POLICY IF EXISTS "Reviewers update daily sales" ON public.daily_sales_claims;
CREATE POLICY "Reviewers update daily sales"
  ON public.daily_sales_claims FOR UPDATE TO authenticated
  USING (
    private.has_role(auth.uid(), 'manager')
    OR private.has_role(auth.uid(), 'director')
  )
  WITH CHECK (
    private.has_role(auth.uid(), 'manager')
    OR private.has_role(auth.uid(), 'director')
  );

DROP POLICY IF EXISTS "Owner or reviewer view objective targets" ON public.objective_targets;
CREATE POLICY "Owner or reviewer view objective targets"
  ON public.objective_targets FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
    OR private.has_role(auth.uid(), 'manager')
    OR private.has_role(auth.uid(), 'director')
  );

DROP POLICY IF EXISTS "locations writable by director" ON public.locations;
CREATE POLICY "locations writable by director"
  ON public.locations FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'director'))
  WITH CHECK (private.has_role(auth.uid(), 'director'));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;