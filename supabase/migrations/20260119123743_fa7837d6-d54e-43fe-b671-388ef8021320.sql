-- Add columns to store questionnaire responses and suggested category
ALTER TABLE public.waitlist 
ADD COLUMN questionnaire_responses jsonb DEFAULT NULL,
ADD COLUMN suggested_category text DEFAULT 'Iniciante';

-- Add comment for documentation
COMMENT ON COLUMN public.waitlist.questionnaire_responses IS 'JSON object storing athlete self-assessment questionnaire responses';
COMMENT ON COLUMN public.waitlist.suggested_category IS 'Automatically suggested category based on questionnaire (Iniciante, D, or C)';