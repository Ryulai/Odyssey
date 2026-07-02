
-- 1) Rename department → business_unit
ALTER TABLE public.staff RENAME COLUMN department TO business_unit;

-- 2) Permanent Guild ID: sequence + trigger + backfill
CREATE SEQUENCE IF NOT EXISTS public.guild_id_seq START WITH 1;

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS guild_id TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.assign_guild_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.guild_id IS NULL OR NEW.guild_id = '' THEN
    NEW.guild_id := 'ODY' || lpad(nextval('public.guild_id_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_guild_id ON public.staff;
CREATE TRIGGER trg_assign_guild_id
BEFORE INSERT ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.assign_guild_id();

-- Backfill existing rows in creation order
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.staff WHERE guild_id IS NULL ORDER BY created_at ASC LOOP
    UPDATE public.staff
      SET guild_id = 'ODY' || lpad(nextval('public.guild_id_seq')::text, 4, '0')
      WHERE id = r.id;
  END LOOP;
END $$;

-- 3) Ensure join_date is always stored
UPDATE public.staff SET join_date = CURRENT_DATE WHERE join_date IS NULL;
ALTER TABLE public.staff ALTER COLUMN join_date SET DEFAULT CURRENT_DATE;
ALTER TABLE public.staff ALTER COLUMN join_date SET NOT NULL;
