
-- Add 'B' to the category enum
ALTER TYPE public.category ADD VALUE IF NOT EXISTS 'B' AFTER 'C';

-- Update the category upgrade function to include C -> B progression
CREATE OR REPLACE FUNCTION public.check_and_upgrade_category()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_cat public.category;
  old_cat public.category;
BEGIN
  old_cat := NEW.category;
  new_cat := NULL;
  
  IF NEW.active_points >= 500 AND NEW.category = 'Iniciante' THEN
    new_cat := 'D';
  ELSIF NEW.active_points >= 500 AND NEW.category = 'D' THEN
    new_cat := 'C';
  ELSIF NEW.active_points >= 500 AND NEW.category = 'C' THEN
    new_cat := 'B';
  END IF;
  
  IF new_cat IS NOT NULL AND new_cat != old_cat THEN
    INSERT INTO public.category_history (athlete_id, old_category, new_category, points_at_change)
    VALUES (NEW.id, old_cat, new_cat, NEW.active_points);
    
    NEW.category := new_cat;
    NEW.active_points := 0;
  END IF;
  
  RETURN NEW;
END;
$function$;
