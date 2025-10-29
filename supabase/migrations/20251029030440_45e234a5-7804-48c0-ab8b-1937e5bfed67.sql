-- Create ranking_history table to track position changes
CREATE TABLE IF NOT EXISTS public.ranking_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  points INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ranking_history ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing ranking history
CREATE POLICY "Anyone can view ranking history"
  ON public.ranking_history
  FOR SELECT
  USING (true);

-- Create policy for inserting ranking history (authenticated users)
CREATE POLICY "Authenticated users can insert ranking history"
  ON public.ranking_history
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_ranking_history_athlete_id ON public.ranking_history(athlete_id);
CREATE INDEX idx_ranking_history_recorded_at ON public.ranking_history(recorded_at DESC);

-- Function to update ranking history
CREATE OR REPLACE FUNCTION update_ranking_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Trigger function to update ranking after achievement is added
CREATE OR REPLACE FUNCTION trigger_update_ranking_on_achievement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the ranking update function
  PERFORM update_ranking_history();
  RETURN NEW;
END;
$$;

-- Create trigger on achievements table
DROP TRIGGER IF EXISTS after_achievement_update_ranking ON public.achievements;
CREATE TRIGGER after_achievement_update_ranking
  AFTER INSERT OR UPDATE OR DELETE ON public.achievements
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_ranking_on_achievement();