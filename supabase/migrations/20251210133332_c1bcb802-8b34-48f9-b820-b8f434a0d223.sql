-- Create waitlist table for athlete registrations
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can view waitlist (for duplicate checking)
CREATE POLICY "Anyone can view waitlist"
ON public.waitlist
FOR SELECT
USING (true);

-- Anyone can insert into waitlist (public registration)
CREATE POLICY "Anyone can insert into waitlist"
ON public.waitlist
FOR INSERT
WITH CHECK (true);

-- Only admins can update waitlist
CREATE POLICY "Admins can update waitlist"
ON public.waitlist
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- Only admins can delete from waitlist
CREATE POLICY "Admins can delete from waitlist"
ON public.waitlist
FOR DELETE
USING (is_admin());