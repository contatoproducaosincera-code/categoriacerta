-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view ranking history" ON public.ranking_history;
DROP POLICY IF EXISTS "Authenticated users can insert ranking history" ON public.ranking_history;

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
CREATE INDEX IF NOT EXISTS idx_ranking_history_athlete_id ON public.ranking_history(athlete_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_recorded_at ON public.ranking_history(recorded_at DESC);