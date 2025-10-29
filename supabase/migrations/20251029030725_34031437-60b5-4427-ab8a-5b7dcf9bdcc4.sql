-- Drop trigger first, then functions, then recreate with correct search_path
DROP TRIGGER IF EXISTS after_achievement_update_ranking ON public.achievements;
DROP FUNCTION IF EXISTS trigger_update_ranking_on_achievement();
DROP FUNCTION IF EXISTS update_ranking_history();

-- Function to update ranking history (with search_path fixed)
CREATE OR REPLACE FUNCTION update_ranking_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  athlete_record RECORD;
  current_position INTEGER := 0;
BEGIN
  -- Loop through athletes ordered by points (current ranking)
  FOR athlete_record IN
    SELECT id, points
    FROM athletes
    ORDER BY points DESC, name ASC
  LOOP
    current_position := current_position + 1;
    
    -- Insert current ranking snapshot
    INSERT INTO ranking_history (athlete_id, position, points)
    VALUES (athlete_record.id, current_position, athlete_record.points);
  END LOOP;
END;
$$;

-- Trigger function to update ranking after achievement is added (with search_path fixed)
CREATE OR REPLACE FUNCTION trigger_update_ranking_on_achievement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the ranking update function
  PERFORM update_ranking_history();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER after_achievement_update_ranking
  AFTER INSERT OR UPDATE OR DELETE ON public.achievements
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_ranking_on_achievement();