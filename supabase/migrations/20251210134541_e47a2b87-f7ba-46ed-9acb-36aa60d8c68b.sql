-- Add gender column to waitlist table
ALTER TABLE public.waitlist 
ADD COLUMN gender TEXT NOT NULL DEFAULT 'Masculino' 
CHECK (gender IN ('Masculino', 'Feminino'));