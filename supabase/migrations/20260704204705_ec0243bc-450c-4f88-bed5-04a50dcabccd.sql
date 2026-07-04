
CREATE TABLE public.daily_sales_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sales_date date NOT NULL DEFAULT CURRENT_DATE,
  total_amount numeric(12,2) NOT NULL CHECK (total_amount >= 0),
  evidence_files text[] NOT NULL DEFAULT '{}',
  remarks text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX daily_sales_claims_staff_date_idx ON public.daily_sales_claims (staff_id, sales_date DESC);
CREATE INDEX daily_sales_claims_submitted_by_idx ON public.daily_sales_claims (submitted_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_sales_claims TO authenticated;
GRANT ALL ON public.daily_sales_claims TO service_role;

ALTER TABLE public.daily_sales_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hunters insert own daily sales"
  ON public.daily_sales_claims FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Owner or manager/director view daily sales"
  ON public.daily_sales_claims FOR SELECT TO authenticated
  USING (
    submitted_by = auth.uid()
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'director')
  );
