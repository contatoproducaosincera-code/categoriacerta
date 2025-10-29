-- Add athlete role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'athlete';

-- Add user_id and avatar_url to athletes table
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create unique index to ensure one user can only have one athlete profile
CREATE UNIQUE INDEX IF NOT EXISTS athletes_user_id_key ON public.athletes(user_id) WHERE user_id IS NOT NULL;

-- Update RLS policies for athletes table
DROP POLICY IF EXISTS "Authenticated users can update athletes" ON public.athletes;
DROP POLICY IF EXISTS "Authenticated users can delete athletes" ON public.athletes;

-- Athletes can view all athletes
-- (já existe: Anyone can view athletes)

-- Athletes can update only their own profile
CREATE POLICY "Athletes can update their own profile" 
ON public.athletes 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can update any athlete
CREATE POLICY "Admins can update any athlete" 
ON public.athletes 
FOR UPDATE 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Admins can insert athletes
CREATE POLICY "Admins can insert athletes" 
ON public.athletes 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin());

-- Admins can delete athletes
CREATE POLICY "Admins can delete athletes" 
ON public.athletes 
FOR DELETE 
TO authenticated
USING (public.is_admin());

-- Authenticated users can insert athletes (for self-registration)
CREATE POLICY "Users can create their athlete profile" 
ON public.athletes 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());