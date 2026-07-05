CREATE TABLE public.director_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id uuid NOT NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  identity_id uuid REFERENCES public.staff_identities(id) ON DELETE SET NULL,
  action text NOT NULL,
  reason text NOT NULL,
  before_state jsonb,
  after_state jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT director_audit_action_not_blank CHECK (length(btrim(action)) > 0),
  CONSTRAINT director_audit_reason_not_blank CHECK (length(btrim(reason)) > 0)
);

GRANT SELECT, INSERT ON public.director_audit_log TO authenticated;
GRANT ALL ON public.director_audit_log TO service_role;

CREATE INDEX director_audit_staff_idx ON public.director_audit_log(staff_id, created_at DESC);
CREATE INDEX director_audit_identity_idx ON public.director_audit_log(identity_id, created_at DESC);
CREATE INDEX director_audit_actor_idx ON public.director_audit_log(actor_user_id, created_at DESC);

ALTER TABLE public.director_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "director audit read director"
ON public.director_audit_log
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'director'::app_role));

CREATE POLICY "director audit write director"
ON public.director_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
  private.has_role(auth.uid(), 'director'::app_role)
  AND actor_user_id = auth.uid()
);