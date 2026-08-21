CREATE TABLE public.password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL,
  target_email text NOT NULL,
  initiated_by uuid NOT NULL,
  credential_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

CREATE INDEX idx_password_resets_target ON public.password_resets (target_user_id, status);
CREATE INDEX idx_password_resets_actor ON public.password_resets (initiated_by, created_at DESC);

GRANT SELECT ON public.password_resets TO authenticated;
GRANT ALL ON public.password_resets TO service_role;

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors can view password reset records"
ON public.password_resets FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'director'));