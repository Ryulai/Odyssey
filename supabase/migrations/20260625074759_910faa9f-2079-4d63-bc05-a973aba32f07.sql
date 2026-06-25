ALTER TABLE public.achievement_claims
  ADD COLUMN IF NOT EXISTS evidence_files text[] NOT NULL DEFAULT ARRAY[]::text[];