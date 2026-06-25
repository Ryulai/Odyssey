
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  kind text NOT NULL DEFAULT 'venue',
  manager_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations readable by authenticated"
  ON public.locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "locations writable by director"
  ON public.locations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'director'::public.app_role));

CREATE TRIGGER trg_locations_updated
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staff_location_id ON public.staff(location_id);
CREATE INDEX IF NOT EXISTS idx_staff_manager_id ON public.staff(manager_id);
