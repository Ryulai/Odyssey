
CREATE TABLE public.objective_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  month text NOT NULL,           -- YYYY-MM
  objective_type text NOT NULL,  -- 'sales' for Hunter; future: 'output', 'audit', 'kpi'
  target_amount numeric(14,2) NOT NULL CHECK (target_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, month, objective_type)
);

CREATE INDEX objective_targets_staff_month_idx
  ON public.objective_targets (staff_id, month);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.objective_targets TO authenticated;
GRANT ALL ON public.objective_targets TO service_role;

ALTER TABLE public.objective_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or reviewer view objective targets"
  ON public.objective_targets FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'director')
  );

CREATE POLICY "Owner manages objective targets"
  ON public.objective_targets FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
  );

CREATE TRIGGER objective_targets_set_updated_at
  BEFORE UPDATE ON public.objective_targets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
