CREATE TABLE public.staff_identities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  position integer NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  class_key text,
  role_key text,
  rank_key text NOT NULL DEFAULT 'bronze',
  promotion_progress integer NOT NULL DEFAULT 0,
  promotion_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  monthly_review jsonb NOT NULL DEFAULT '{}'::jsonb,
  achievement_progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  statistics jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT staff_identities_position_positive CHECK (position >= 1),
  CONSTRAINT staff_identities_progress_range CHECK (promotion_progress >= 0 AND promotion_progress <= 100),
  CONSTRAINT staff_identities_primary_position CHECK (is_primary = (position = 1)),
  CONSTRAINT staff_identities_class_valid CHECK (class_key IS NULL OR class_key IN ('ranger','warrior','mage','guardian')),
  CONSTRAINT staff_identities_rank_valid CHECK (rank_key IN ('bronze','silver','gold','platinum','diamond','mystical','legend')),
  CONSTRAINT staff_identities_source_valid CHECK (source IN ('manual','director_override','data_migration','system')),
  UNIQUE (staff_id, position)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_identities TO authenticated;
GRANT ALL ON public.staff_identities TO service_role;

CREATE UNIQUE INDEX staff_identities_one_primary_per_staff
  ON public.staff_identities(staff_id)
  WHERE is_primary;

CREATE INDEX staff_identities_staff_position_idx
  ON public.staff_identities(staff_id, position);

ALTER TABLE public.staff_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff identities read"
ON public.staff_identities
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_identities.staff_id
      AND s.user_id = auth.uid()
  )
  OR private.has_role(auth.uid(), 'manager'::app_role)
  OR private.has_role(auth.uid(), 'director'::app_role)
);

CREATE POLICY "staff identities write director or manager"
ON public.staff_identities
FOR ALL
TO authenticated
USING (
  private.has_role(auth.uid(), 'director'::app_role)
  OR private.has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  private.has_role(auth.uid(), 'director'::app_role)
  OR private.has_role(auth.uid(), 'manager'::app_role)
);

CREATE TRIGGER staff_identities_set_updated_at
BEFORE UPDATE ON public.staff_identities
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_staff_identity_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  _valid_roles text[];
BEGIN
  NEW.position := COALESCE(NEW.position, 1);
  NEW.is_primary := NEW.position = 1;
  NEW.class_key := NULLIF(lower(btrim(COALESCE(NEW.class_key, ''))), '');
  NEW.role_key := NULLIF(lower(btrim(regexp_replace(COALESCE(NEW.role_key, ''), '\s+', '_', 'g'))), '');
  NEW.rank_key := COALESCE(NULLIF(lower(btrim(NEW.rank_key)), ''), 'bronze');
  NEW.promotion_progress := LEAST(100, GREATEST(0, COALESCE(NEW.promotion_progress, 0)));

  IF NEW.class_key IS NULL THEN
    NEW.role_key := NULL;
    RETURN NEW;
  END IF;

  _valid_roles := CASE NEW.class_key
    WHEN 'ranger'   THEN ARRAY['hunter','sniper','beacon']
    WHEN 'warrior'  THEN ARRAY['tanker','alchemist','blacksmith','tinker']
    WHEN 'mage'     THEN ARRAY['battle_mage','spellcaster','bard','visual_mage','illusionist','musician']
    WHEN 'guardian' THEN ARRAY['priest','hr','admin','cashier']
  END;

  IF NEW.role_key IS NOT NULL AND NOT (NEW.role_key = ANY(_valid_roles)) THEN
    RAISE EXCEPTION 'Role "%" is not valid for class "%"', NEW.role_key, NEW.class_key;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER staff_identities_validate_role
BEFORE INSERT OR UPDATE ON public.staff_identities
FOR EACH ROW
EXECUTE FUNCTION public.validate_staff_identity_role();