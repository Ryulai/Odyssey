
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS employee_code text,
  ADD COLUMN IF NOT EXISTS join_date date,
  ADD COLUMN IF NOT EXISTS career_path text,
  ADD COLUMN IF NOT EXISTS shipbuilder_path text;

CREATE UNIQUE INDEX IF NOT EXISTS staff_employee_code_unique
  ON public.staff (lower(employee_code))
  WHERE employee_code IS NOT NULL;
