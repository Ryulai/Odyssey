
-- =====================================================
-- WORK IDENTITY
-- =====================================================
CREATE TABLE public.work_identity (
  staff_id uuid PRIMARY KEY REFERENCES public.staff(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  department text NOT NULL DEFAULT 'Sales',
  position text NOT NULL DEFAULT '',
  manager_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  employment_status text NOT NULL DEFAULT 'active',
  start_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_identity TO authenticated;
GRANT ALL ON public.work_identity TO service_role;
ALTER TABLE public.work_identity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work read all auth" ON public.work_identity FOR SELECT TO authenticated USING (true);
CREATE POLICY "work write director or manager" ON public.work_identity FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'manager'::app_role));
CREATE TRIGGER work_identity_updated BEFORE UPDATE ON public.work_identity FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- RPG IDENTITY
-- =====================================================
CREATE TABLE public.rpg_identity (
  staff_id uuid PRIMARY KEY REFERENCES public.staff(id) ON DELETE CASCADE,
  class text NOT NULL DEFAULT 'warrior',
  career_tree text,
  shipbuilder_tree text,
  current_rank_key text REFERENCES public.ranks(key) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rpg_identity TO authenticated;
GRANT ALL ON public.rpg_identity TO service_role;
ALTER TABLE public.rpg_identity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rpg read all auth" ON public.rpg_identity FOR SELECT TO authenticated USING (true);
CREATE POLICY "rpg write director or manager" ON public.rpg_identity FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'manager'::app_role));
CREATE TRIGGER rpg_identity_updated BEFORE UPDATE ON public.rpg_identity FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- LEGACY HOLDINGS (many per person)
-- =====================================================
CREATE TABLE public.legacy_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  title text NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  note text NOT NULL DEFAULT '',
  granted_at date,
  ended_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_legacy_holdings_staff ON public.legacy_holdings(staff_id);
CREATE INDEX idx_legacy_holdings_location ON public.legacy_holdings(location_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legacy_holdings TO authenticated;
GRANT ALL ON public.legacy_holdings TO service_role;
ALTER TABLE public.legacy_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legacy read all auth" ON public.legacy_holdings FOR SELECT TO authenticated USING (true);
CREATE POLICY "legacy write director" ON public.legacy_holdings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'director'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE TRIGGER legacy_holdings_updated BEFORE UPDATE ON public.legacy_holdings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- BACKFILL from existing staff
-- =====================================================
INSERT INTO public.work_identity (staff_id, location_id, department, position, manager_id, employment_status, start_date)
SELECT id, location_id, COALESCE(department,'Sales'), COALESCE(role,''), manager_id,
       CASE WHEN status = 'active' THEN 'active' ELSE COALESCE(status,'active') END,
       join_date
FROM public.staff
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO public.rpg_identity (staff_id, class, career_tree, shipbuilder_tree, current_rank_key)
SELECT id,
       CASE
         WHEN role_family = 'operational' THEN 'ranger'
         ELSE 'warrior'
       END,
       career_path, shipbuilder_path, current_rank_key
FROM public.staff
ON CONFLICT (staff_id) DO NOTHING;
