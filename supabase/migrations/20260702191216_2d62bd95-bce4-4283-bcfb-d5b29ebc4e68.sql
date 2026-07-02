
-- Sprint 1.1: keys not display names, promotion fields, trial status.

-- 1. Normalize existing role values to underscored keys.
UPDATE public.rpg_identity SET primary_role = 'battle_mage'  WHERE primary_role = 'battle mage';
UPDATE public.rpg_identity SET primary_role = 'visual_mage'  WHERE primary_role = 'visual mage';
UPDATE public.rpg_identity SET secondary_role = 'battle_mage' WHERE secondary_role = 'battle mage';
UPDATE public.rpg_identity SET secondary_role = 'visual_mage' WHERE secondary_role = 'visual mage';

-- 2. Replace trigger to enforce underscored role keys.
CREATE OR REPLACE FUNCTION public.validate_rpg_primary_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  _valid_roles text[];
BEGIN
  IF NEW.primary_class IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.primary_class := lower(btrim(NEW.primary_class));
  IF NEW.primary_role IS NOT NULL THEN
    NEW.primary_role := lower(btrim(regexp_replace(NEW.primary_role, '\s+', '_', 'g')));
  END IF;
  IF NEW.secondary_class IS NOT NULL THEN
    NEW.secondary_class := lower(btrim(NEW.secondary_class));
  END IF;
  IF NEW.secondary_role IS NOT NULL THEN
    NEW.secondary_role := lower(btrim(regexp_replace(NEW.secondary_role, '\s+', '_', 'g')));
  END IF;

  IF NEW.primary_class NOT IN ('ranger','warrior','mage','guardian') THEN
    RAISE EXCEPTION 'Invalid primary_class: %', NEW.primary_class;
  END IF;

  IF NEW.primary_role IS NULL OR NEW.primary_role = '' THEN
    RETURN NEW;
  END IF;

  _valid_roles := CASE NEW.primary_class
    WHEN 'ranger'   THEN ARRAY['hunter','sniper','beacon']
    WHEN 'warrior'  THEN ARRAY['tanker','alchemist','blacksmith','tinker']
    WHEN 'mage'     THEN ARRAY['battle_mage','spellcaster','bard','visual_mage','illusionist','musician']
    WHEN 'guardian' THEN ARRAY['priest','hr','admin','cashier']
  END;

  IF NOT (NEW.primary_role = ANY(_valid_roles)) THEN
    RAISE EXCEPTION 'Role "%" is not valid for class "%"', NEW.primary_role, NEW.primary_class;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure the trigger is actually attached (report showed no triggers listed).
DROP TRIGGER IF EXISTS trg_validate_rpg_primary_role ON public.rpg_identity;
CREATE TRIGGER trg_validate_rpg_primary_role
  BEFORE INSERT OR UPDATE ON public.rpg_identity
  FOR EACH ROW EXECUTE FUNCTION public.validate_rpg_primary_role();

-- 3. Promotion tracking on staff (rank lives on staff.current_rank_key).
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS promotion_date date,
  ADD COLUMN IF NOT EXISTS promotion_history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 4. Extended staff status (trial + common lifecycle states). Kept as free text
--    for flexibility, defaulting to 'active'. UI will constrain the picker.
--    Existing rows unchanged.
COMMENT ON COLUMN public.staff.status IS
  'Lifecycle state: trial | active | on_leave | inactive | resigned';
