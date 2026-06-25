
-- =========================================================================
-- 1. Roles + profiles
-- =========================================================================

CREATE TYPE public.app_role AS ENUM ('director', 'manager', 'staff');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles select auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_role_label()
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'director' THEN 1 WHEN 'manager' THEN 2 ELSE 3 END
  LIMIT 1;
$$;

CREATE POLICY "user_roles read own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'director'));
CREATE POLICY "user_roles director writes" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- Bootstrap: first signup → director, otherwise staff. Plus create profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 2))
  );

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO _is_first;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN _is_first THEN 'director'::public.app_role ELSE 'staff'::public.app_role END);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 2. Shared timestamp trigger
-- =========================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================================
-- 3. Staff
-- =========================================================================

CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT '',
  role_family TEXT NOT NULL DEFAULT 'hunter' CHECK (role_family IN ('hunter', 'operational')),
  department TEXT NOT NULL DEFAULT 'Sales',
  manager_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read all auth" ON public.staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff write director or manager" ON public.staff FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'manager'));
CREATE TRIGGER staff_updated BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 4. Grade configuration
-- =========================================================================

CREATE TABLE public.grade_weights (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  sales_weight INT NOT NULL DEFAULT 60 CHECK (sales_weight BETWEEN 0 AND 100),
  review_weight INT NOT NULL DEFAULT 40 CHECK (review_weight BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.grade_weights TO authenticated;
GRANT INSERT, UPDATE ON public.grade_weights TO authenticated;
GRANT ALL ON public.grade_weights TO service_role;
ALTER TABLE public.grade_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weights read auth" ON public.grade_weights FOR SELECT TO authenticated USING (true);
CREATE POLICY "weights write director" ON public.grade_weights FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

CREATE TABLE public.grade_rules (
  grade TEXT PRIMARY KEY CHECK (grade IN ('A', 'B', 'C', 'D')),
  min_score INT NOT NULL DEFAULT 0 CHECK (min_score BETWEEN 0 AND 100),
  bonus_pct INT NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grade_rules TO authenticated;
GRANT ALL ON public.grade_rules TO service_role;
ALTER TABLE public.grade_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grades read auth" ON public.grade_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "grades write director" ON public.grade_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- =========================================================================
-- 5. Achievements
-- =========================================================================

CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Monthly',
  difficulty TEXT NOT NULL DEFAULT 'Standard',
  reset_cycle TEXT NOT NULL DEFAULT 'Monthly',
  star_reward INT NOT NULL DEFAULT 1 CHECK (star_reward BETWEEN 0 AND 50),
  requirement TEXT NOT NULL DEFAULT '',
  seasonal BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ach read auth" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "ach write director" ON public.achievements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));
CREATE TRIGGER achievements_updated BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 6. Ranks
-- =========================================================================

CREATE TABLE public.ranks (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  requirement TEXT NOT NULL DEFAULT '',
  locked BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ranks TO authenticated;
GRANT ALL ON public.ranks TO service_role;
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ranks read auth" ON public.ranks FOR SELECT TO authenticated USING (true);
CREATE POLICY "ranks write director" ON public.ranks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- =========================================================================
-- 7. Legacy
-- =========================================================================

CREATE TABLE public.legacy_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  stars_per_moon INT NOT NULL DEFAULT 10 CHECK (stars_per_moon > 0),
  moons_per_sun INT NOT NULL DEFAULT 5 CHECK (moons_per_sun > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.legacy_config TO authenticated;
GRANT ALL ON public.legacy_config TO service_role;
ALTER TABLE public.legacy_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legacy cfg read" ON public.legacy_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "legacy cfg write director" ON public.legacy_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

CREATE TABLE public.legacy_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_stars INT NOT NULL DEFAULT 0,
  flavor TEXT NOT NULL DEFAULT '',
  position INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legacy_titles TO authenticated;
GRANT ALL ON public.legacy_titles TO service_role;
ALTER TABLE public.legacy_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "titles read" ON public.legacy_titles FOR SELECT TO authenticated USING (true);
CREATE POLICY "titles write director" ON public.legacy_titles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- =========================================================================
-- 8. Achievement claims + records
-- =========================================================================

CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.achievement_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  evidence_text TEXT NOT NULL DEFAULT '',
  evidence_url TEXT,
  notes TEXT NOT NULL DEFAULT '',
  status public.claim_status NOT NULL DEFAULT 'pending',
  decision_notes TEXT,
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievement_claims TO authenticated;
GRANT ALL ON public.achievement_claims TO service_role;
ALTER TABLE public.achievement_claims ENABLE ROW LEVEL SECURITY;

-- Staff sees own; managers/directors see all
CREATE POLICY "claims select" ON public.achievement_claims FOR SELECT TO authenticated
  USING (
    submitted_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'director')
  );
-- Anyone authenticated can submit claims about themselves (their staff row)
CREATE POLICY "claims insert self" ON public.achievement_claims FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'director')
    )
  );
-- Managers/directors can update (approve/reject)
CREATE POLICY "claims update mgmt" ON public.achievement_claims FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'director'));
CREATE POLICY "claims delete director" ON public.achievement_claims FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'director'));
CREATE TRIGGER claims_updated BEFORE UPDATE ON public.achievement_claims
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.achievement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES public.achievement_claims(id) ON DELETE SET NULL,
  period TEXT NOT NULL,
  stars INT NOT NULL DEFAULT 1,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.achievement_records TO authenticated;
GRANT ALL ON public.achievement_records TO service_role;
ALTER TABLE public.achievement_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "records select" ON public.achievement_records FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'director')
  );
CREATE POLICY "records write mgmt" ON public.achievement_records FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'director'));
CREATE POLICY "records delete director" ON public.achievement_records FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'director'));

-- Trigger: when claim approved -> create record
CREATE OR REPLACE FUNCTION public.handle_claim_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _stars INT;
  _period TEXT;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    SELECT star_reward INTO _stars FROM public.achievements WHERE id = NEW.achievement_id;
    _period := to_char(COALESCE(NEW.decided_at, now()), 'Mon YYYY');
    INSERT INTO public.achievement_records (staff_id, achievement_id, claim_id, period, stars)
    VALUES (NEW.staff_id, NEW.achievement_id, NEW.id, _period, COALESCE(_stars, 1));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER claim_decision_award
AFTER UPDATE ON public.achievement_claims
FOR EACH ROW EXECUTE FUNCTION public.handle_claim_decision();

-- =========================================================================
-- 9. Monthly evaluations
-- =========================================================================

CREATE TABLE public.monthly_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- first day of month
  sales_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (sales_score BETWEEN 0 AND 100),
  review_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (review_score BETWEEN 0 AND 100),
  composite_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D')),
  notes TEXT NOT NULL DEFAULT '',
  evaluator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_id, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_evaluations TO authenticated;
GRANT ALL ON public.monthly_evaluations TO service_role;
ALTER TABLE public.monthly_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evals select" ON public.monthly_evaluations FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'director')
  );
CREATE POLICY "evals write mgmt" ON public.monthly_evaluations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'director'));
CREATE TRIGGER evals_updated BEFORE UPDATE ON public.monthly_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 10. Seeds
-- =========================================================================

INSERT INTO public.grade_weights (id, sales_weight, review_weight) VALUES (1, 60, 40);

INSERT INTO public.grade_rules (grade, min_score, bonus_pct, note) VALUES
  ('A', 90, 25, 'Full Sail — exceeds all targets.'),
  ('B', 75, 15, 'Steady Voyage — above expectations.'),
  ('C', 60, 5,  'On Course — meets baseline.'),
  ('D', 0,  0,  'Adrift — needs improvement.');

INSERT INTO public.ranks (key, name, subtitle, description, requirement, locked, position) VALUES
  ('bronze',       'Bronze Hunter',        'Apprentice',        'Learning the craft.',                       '3 C-grades or 1 A-grade',                false, 1),
  ('silver',       'Silver Hunter',        'Independent',       'Operates without supervision.',             '6 B-grades + manager signoff',           false, 2),
  ('gold',         'Gold Hunter',          'Professional',      'Consistent professional output.',           '12 B-grades or 8 A-grades',              false, 3),
  ('platinum',     'Platinum Hunter',      'Elite',             'Influential contributor.',                  '12 A-grades + cross-team initiative',    false, 4),
  ('diamond',      'Diamond Hunter',       'Veteran Master',    'Defines excellence in the craft.',          '24 A-grades + Director signoff',         false, 5),
  ('blackdiamond', 'Black Diamond Hunter', 'Guild Pillar',      'Builds and shapes whole teams.',            'Mentor 3 hunters to Gold + board nom',   false, 6),
  ('mythic',       'Mythic Hunter',        'Department Legend', 'Locked tier.',                              'Locked — invitation only.',              true,  7),
  ('legend',       'Legend Hunter',        'Company Legend',    'Locked tier.',                              'Locked — invitation only.',              true,  8);

INSERT INTO public.legacy_config (id, stars_per_moon, moons_per_sun) VALUES (1, 10, 5);

INSERT INTO public.legacy_titles (name, min_stars, flavor, position) VALUES
  ('Wanderer',           0,   'The journey has just begun.',                  1),
  ('Pathfinder',         10,  'One moon claimed. A path emerges.',            2),
  ('Voyager',            30,  'Three moons. The map widens.',                 3),
  ('Shipbuilder',        50,  'A sun rises. You forge what others sail.',     4),
  ('Master Shipbuilder', 150, 'Three suns. Your fleet is your own.',          5),
  ('Guild Elder',        250, 'Five suns. Your name carries weight.',         6),
  ('Living Legend',      500, 'Ten suns. Songs are sung in your name.',       7);

INSERT INTO public.achievements (name, description, type, difficulty, reset_cycle, star_reward, requirement, seasonal) VALUES
  ('First Blood',  'Close your first deal of the month.', 'Monthly',  'Easy', 'Monthly', 1, '1 closed deal',           true),
  ('Whale Hunter', 'Close a deal over $50K.',             'One-Time', 'Epic', 'Never',   5, 'Deal value ≥ $50,000',    false),
  ('Top Sales',    'Ranked #1 hunter of the month.',      'Monthly',  'Hard', 'Monthly', 1, '#1 on monthly leaderboard', true),
  ('Thank You',    'Collect 10 client gratitude scrolls in a month.', 'Monthly', 'Standard', 'Monthly', 1, '10 client reviews/month', true);
