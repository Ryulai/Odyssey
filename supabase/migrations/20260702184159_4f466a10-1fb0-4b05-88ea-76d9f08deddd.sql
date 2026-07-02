
-- 1) Basic info: phone + branch
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS branch text;

-- 2 & 5) RPG identity: primary + secondary career
ALTER TABLE public.rpg_identity
  ADD COLUMN IF NOT EXISTS primary_class text,
  ADD COLUMN IF NOT EXISTS primary_role text,
  ADD COLUMN IF NOT EXISTS secondary_class text,
  ADD COLUMN IF NOT EXISTS secondary_role text,
  ADD COLUMN IF NOT EXISTS secondary_unlocked boolean NOT NULL DEFAULT false;

-- Backfill primary_class from legacy `class` column when present
UPDATE public.rpg_identity
   SET primary_class = COALESCE(primary_class, lower(NULLIF(class,'')));

-- 4) Default rank = bronze
UPDATE public.staff SET current_rank_key = 'bronze' WHERE current_rank_key IS NULL OR current_rank_key = '';
ALTER TABLE public.staff ALTER COLUMN current_rank_key SET DEFAULT 'bronze';

-- Validate primary class + role combination (secondary is locked, so no check yet)
CREATE OR REPLACE FUNCTION public.validate_rpg_primary_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _valid boolean;
  _valid_roles text[];
BEGIN
  IF NEW.primary_class IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.primary_class := lower(btrim(NEW.primary_class));
  IF NEW.primary_role IS NOT NULL THEN
    NEW.primary_role := lower(btrim(NEW.primary_role));
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
    WHEN 'mage'     THEN ARRAY['battle mage','spellcaster','bard','visual mage','illusionist','musician']
    WHEN 'guardian' THEN ARRAY['priest','hr','admin','cashier']
  END;

  IF NOT (NEW.primary_role = ANY(_valid_roles)) THEN
    RAISE EXCEPTION 'Role "%" is not valid for class "%"', NEW.primary_role, NEW.primary_class;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_rpg_primary_role ON public.rpg_identity;
CREATE TRIGGER trg_validate_rpg_primary_role
BEFORE INSERT OR UPDATE ON public.rpg_identity
FOR EACH ROW EXECUTE FUNCTION public.validate_rpg_primary_role();
