
CREATE OR REPLACE FUNCTION public.award_loyalty_on_complete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pts INTEGER;
BEGIN
  IF NEW.status = 'Completed' AND (OLD.status IS DISTINCT FROM 'Completed') THEN
    SELECT GREATEST(10, FLOOR(price)::INTEGER) INTO pts FROM public.services WHERE id = NEW.service_id;
    UPDATE public.profiles SET loyalty_points = loyalty_points + COALESCE(pts, 10) WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.award_loyalty_on_complete() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_award_loyalty ON public.bookings;
CREATE TRIGGER trg_award_loyalty AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_on_complete();
