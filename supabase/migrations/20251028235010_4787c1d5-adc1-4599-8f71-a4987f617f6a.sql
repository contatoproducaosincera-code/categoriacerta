-- Atualizar função de upgrade de categoria para zerar pontos
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
  
  -- Lógica de upgrade baseada em pontos (a cada 500 pontos sobe uma categoria)
  IF NEW.points >= 500 AND NEW.category = 'Iniciante' THEN
    new_cat := 'D';
    NEW.points := NEW.points - 500;  -- Remove 500 pontos ao subir
  ELSIF NEW.points >= 500 AND NEW.category = 'D' THEN
    new_cat := 'C';
    NEW.points := NEW.points - 500;
  ELSIF NEW.points >= 500 AND NEW.category = 'C' THEN
    new_cat := 'B';
    NEW.points := NEW.points - 500;
  ELSIF NEW.points >= 500 AND NEW.category = 'B' THEN
    new_cat := 'A';
    NEW.points := NEW.points - 500;
  END IF;
  
  -- Se houve mudança de categoria
  IF new_cat IS NOT NULL AND new_cat != old_cat THEN
    NEW.category := new_cat;
    
    -- Registrar no histórico
    INSERT INTO public.category_history (athlete_id, old_category, new_category, points_at_change)
    VALUES (NEW.id, old_cat, new_cat, NEW.points + 500);  -- Registra os pontos antes de zerar
  END IF;
  
  RETURN NEW;
END;
$function$;