-- Add recurring tournament support and combined categories
-- Add recurrence columns
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'biweekly', 'monthly') OR recurrence_type IS NULL),
ADD COLUMN IF NOT EXISTS recurrence_day INTEGER CHECK ((recurrence_day >= 0 AND recurrence_day <= 6) OR recurrence_day IS NULL);

-- Drop the old category constraint and add support for combined categories
-- First, let's alter the category column to accept combined values
ALTER TABLE public.tournaments 
ALTER COLUMN category TYPE TEXT;

-- Add a check constraint for valid category values
ALTER TABLE public.tournaments
ADD CONSTRAINT tournaments_category_check 
CHECK (category IN ('Iniciante', 'D', 'C', 'Iniciante + D', 'D + C', 'Todas'));

-- Add comment for documentation
COMMENT ON COLUMN public.tournaments.is_recurring IS 'Whether this tournament repeats on a schedule';
COMMENT ON COLUMN public.tournaments.recurrence_type IS 'Type of recurrence: weekly, biweekly, monthly';
COMMENT ON COLUMN public.tournaments.recurrence_day IS 'Day of week for recurrence (0=Sunday, 6=Saturday)';