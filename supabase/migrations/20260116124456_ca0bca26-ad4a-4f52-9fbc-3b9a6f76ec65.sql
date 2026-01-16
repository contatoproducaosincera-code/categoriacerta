
-- Add active_points column to athletes table (starts at 0 for all existing athletes)
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS active_points integer NOT NULL DEFAULT 0;

-- Update the category upgrade trigger to use active_points instead of points
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
  
  -- Nova lógica: progressão baseada em active_points (pontos ativos)
  -- Todas as categorias sobem ao atingir 500 pontos ativos
  -- Iniciante -> D: 500 pontos ativos
  -- D -> C: 500 pontos ativos
  -- C é a categoria máxima (não sobe)
  
  IF NEW.active_points >= 500 AND NEW.category = 'Iniciante' THEN
    new_cat := 'D';
  ELSIF NEW.active_points >= 500 AND NEW.category = 'D' THEN
    new_cat := 'C';
  END IF;
  
  -- Se houve mudança de categoria
  IF new_cat IS NOT NULL AND new_cat != old_cat THEN
    -- Registrar no histórico com os pontos ativos antes de zerar
    INSERT INTO public.category_history (athlete_id, old_category, new_category, points_at_change)
    VALUES (NEW.id, old_cat, new_cat, NEW.active_points);
    
    -- Atualizar categoria e zerar APENAS os pontos ativos
    -- Pontos históricos (points) permanecem intactos
    NEW.category := new_cat;
    NEW.active_points := 0;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add comment to clarify the difference between points and active_points
COMMENT ON COLUMN public.athletes.points IS 'Pontuação histórica total - mantida para registros e relatórios';
COMMENT ON COLUMN public.athletes.active_points IS 'Pontos ativos para progressão de categoria - resetados ao subir de categoria';
