-- Create trigger to automatically upgrade athlete category when points reach 500
CREATE TRIGGER check_category_upgrade
  BEFORE UPDATE OF points ON public.athletes
  FOR EACH ROW
  WHEN (NEW.points >= 500)
  EXECUTE FUNCTION public.check_and_upgrade_category();