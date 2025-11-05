-- Fix 1: Restrict email visibility in athletes table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view athletes" ON public.athletes;

-- Create a policy that allows anonymous users to see basic info (without email)
CREATE POLICY "Public can view athlete profiles"
ON public.athletes
FOR SELECT
TO anon
USING (true);

-- Grant specific column access to anonymous users (excluding email)
REVOKE ALL ON public.athletes FROM anon;
GRANT SELECT (id, name, city, instagram, category, gender, points, avatar_url, created_at, updated_at, user_id) ON public.athletes TO anon;

-- Create a separate policy for authenticated users to see emails
CREATE POLICY "Authenticated users can view all athlete data"
ON public.athletes
FOR SELECT
TO authenticated
USING (true);

-- Fix 2: Correct the notifications RLS policy to scope to athlete ownership
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  athlete_id IN (
    SELECT id FROM public.athletes WHERE user_id = auth.uid()
  )
);

-- Keep existing update policy
-- The "Users can update their own notifications" policy should also be scoped
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  athlete_id IN (
    SELECT id FROM public.athletes WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  athlete_id IN (
    SELECT id FROM public.athletes WHERE user_id = auth.uid()
  )
);