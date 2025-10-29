-- First, update any existing athletes with categories B or A to category C
UPDATE athletes 
SET category = 'C' 
WHERE category IN ('B', 'A');

-- Temporarily change all enum columns to text
ALTER TABLE athletes ALTER COLUMN category TYPE text;
ALTER TABLE tournaments ALTER COLUMN category TYPE text;
ALTER TABLE category_history ALTER COLUMN old_category TYPE text;
ALTER TABLE category_history ALTER COLUMN new_category TYPE text;

-- Drop and recreate the enum type with only 3 categories
DROP TYPE IF EXISTS category CASCADE;
CREATE TYPE category AS ENUM ('Iniciante', 'D', 'C');

-- Apply the new enum type back to all columns
ALTER TABLE athletes 
ALTER COLUMN category TYPE category USING category::category;

ALTER TABLE tournaments 
ALTER COLUMN category TYPE category USING category::category;

ALTER TABLE category_history 
ALTER COLUMN old_category TYPE category USING old_category::category,
ALTER COLUMN new_category TYPE category USING new_category::category;

-- Set default for new athletes
ALTER TABLE athletes ALTER COLUMN category SET DEFAULT 'Iniciante'::category;

-- Update the category upgrade function to only handle 3 categories
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