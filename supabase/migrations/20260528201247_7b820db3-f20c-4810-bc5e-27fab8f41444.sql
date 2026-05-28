
-- Lock down SECURITY DEFINER functions used only internally
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- get_booked_slots is intentionally callable by anon/authenticated for booking availability
-- Public buckets (avatars, gallery) are intentional for displaying images; listing is acceptable as content is non-sensitive.
