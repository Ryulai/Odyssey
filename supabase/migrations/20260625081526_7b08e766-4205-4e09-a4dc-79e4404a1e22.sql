REVOKE ALL ON FUNCTION public.auto_link_staff_profile() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.evaluate_rank(uuid) SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.evaluate_rank(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.evaluate_rank(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_claim_decision() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_staff_rank(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_refresh_rank_records() FROM PUBLIC, anon, authenticated;