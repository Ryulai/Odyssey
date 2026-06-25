GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.current_role_label() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_role_label() TO service_role;