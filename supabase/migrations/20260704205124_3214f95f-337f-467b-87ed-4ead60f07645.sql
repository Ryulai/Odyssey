
ALTER TABLE public.daily_sales_claims
  ADD COLUMN IF NOT EXISTS decision_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.daily_sales_claims
  DROP CONSTRAINT IF EXISTS daily_sales_claims_status_check;
ALTER TABLE public.daily_sales_claims
  ADD CONSTRAINT daily_sales_claims_status_check
  CHECK (status IN ('pending','approved','rejected'));

-- Reviewer update policy: managers/directors can update any row.
DROP POLICY IF EXISTS "Reviewers update daily sales" ON public.daily_sales_claims;
CREATE POLICY "Reviewers update daily sales"
  ON public.daily_sales_claims FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'director')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'director')
  );
