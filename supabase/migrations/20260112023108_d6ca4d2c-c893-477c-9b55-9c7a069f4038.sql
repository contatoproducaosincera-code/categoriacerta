-- Update the check_and_upgrade_category function with new thresholds
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
  
  -- Nova lógica de upgrade baseada em pontos
  -- Iniciante -> D: 160 pontos ou mais
  -- D -> C: 300 pontos ou mais
  IF NEW.points >= 160 AND NEW.category = 'Iniciante' THEN
    new_cat := 'D';
  ELSIF NEW.points >= 300 AND NEW.category = 'D' THEN
    new_cat := 'C';
  END IF;
  
  -- Se houve mudança de categoria
  IF new_cat IS NOT NULL AND new_cat != old_cat THEN
    -- Registrar no histórico com os pontos antes de zerar
    INSERT INTO public.category_history (athlete_id, old_category, new_category, points_at_change)
    VALUES (NEW.id, old_cat, new_cat, NEW.points);
    
    -- Atualizar categoria e zerar pontos
    NEW.category := new_cat;
    NEW.points := 0;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop and recreate the trigger with new condition
DROP TRIGGER IF EXISTS check_category_upgrade ON public.athletes;

CREATE TRIGGER check_category_upgrade
  BEFORE UPDATE OF points ON public.athletes
  FOR EACH ROW
  WHEN (NEW.points >= 160)
  EXECUTE FUNCTION public.check_and_upgrade_category();

-- Immediate check: Promote all athletes who already qualify
-- First, update Iniciante athletes with 160+ points to D
UPDATE public.athletes
SET points = 0, category = 'D'
WHERE category = 'Iniciante' AND points >= 160;

-- Then, update D athletes with 300+ points to C
UPDATE public.athletes
SET points = 0, category = 'C'
WHERE category = 'D' AND points >= 300;

-- Record the category changes for athletes that were promoted
INSERT INTO public.category_history (athlete_id, old_category, new_category, points_at_change)
SELECT id, 'Iniciante', 'D', 0
FROM public.athletes
WHERE category = 'D' AND id NOT IN (
  SELECT athlete_id FROM public.category_history WHERE new_category = 'D'
);

INSERT INTO public.category_history (athlete_id, old_category, new_category, points_at_change)
SELECT id, 'D', 'C', 0
FROM public.athletes
WHERE category = 'C' AND id NOT IN (
  SELECT athlete_id FROM public.category_history WHERE new_category = 'C'
);