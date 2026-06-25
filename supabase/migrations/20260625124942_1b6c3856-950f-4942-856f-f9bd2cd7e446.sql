
-- Grade Engine v2: multi-factor evaluation inputs + per-factor weights.

ALTER TABLE public.monthly_evaluations
  ADD COLUMN IF NOT EXISTS attendance_score   NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS achievements_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discipline_score   NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kpi_score          NUMERIC(5,2) NOT NULL DEFAULT 0;

-- Extend grade_weights with per-factor weights. Keep legacy sales_weight/review_weight columns
-- for backward compatibility; new code reads the *_w columns below.
ALTER TABLE public.grade_weights
  ADD COLUMN IF NOT EXISTS sales_w        INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS attendance_w   INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS achievements_w INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS review_w       INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS discipline_w   INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS kpi_w          INTEGER NOT NULL DEFAULT 15;

-- Seed the default weights row if missing.
INSERT INTO public.grade_weights (id, sales_weight, review_weight, sales_w, attendance_w, achievements_w, review_w, discipline_w, kpi_w)
VALUES (1, 60, 40, 30, 15, 15, 15, 10, 15)
ON CONFLICT (id) DO NOTHING;

-- Backfill legacy rows so the composite/grade survives the schema change.
UPDATE public.monthly_evaluations
   SET attendance_score   = COALESCE(attendance_score, 0),
       achievements_score = COALESCE(achievements_score, 0),
       discipline_score   = COALESCE(discipline_score, 0),
       kpi_score          = COALESCE(kpi_score, 0)
 WHERE attendance_score IS NULL OR achievements_score IS NULL
    OR discipline_score IS NULL OR kpi_score IS NULL;
