-- Fix achievements table - restrict to admin-only access
DROP POLICY IF EXISTS "Authenticated users can insert achievements" ON achievements;
DROP POLICY IF EXISTS "Authenticated users can update achievements" ON achievements;
DROP POLICY IF EXISTS "Authenticated users can delete achievements" ON achievements;

CREATE POLICY "Admins can insert achievements" ON achievements 
  FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update achievements" ON achievements 
  FOR UPDATE 
  USING (is_admin()) 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete achievements" ON achievements 
  FOR DELETE 
  USING (is_admin());

-- Fix tournaments table - restrict to admin-only access
DROP POLICY IF EXISTS "Authenticated users can insert tournaments" ON tournaments;
DROP POLICY IF EXISTS "Authenticated users can update tournaments" ON tournaments;
DROP POLICY IF EXISTS "Authenticated users can delete tournaments" ON tournaments;

CREATE POLICY "Admins can insert tournaments" ON tournaments 
  FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update tournaments" ON tournaments 
  FOR UPDATE 
  USING (is_admin()) 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete tournaments" ON tournaments 
  FOR DELETE 
  USING (is_admin());

-- Fix badge_types table - restrict to admin-only access
DROP POLICY IF EXISTS "Authenticated users can manage badge types" ON badge_types;

CREATE POLICY "Admins can manage badge types" ON badge_types 
  FOR ALL 
  USING (is_admin()) 
  WITH CHECK (is_admin());

-- Fix athlete_badges table - restrict to admin-only access
DROP POLICY IF EXISTS "Authenticated users can manage athlete badges" ON athlete_badges;

CREATE POLICY "Admins can manage athlete badges" ON athlete_badges 
  FOR ALL 
  USING (is_admin()) 
  WITH CHECK (is_admin());

-- Fix ranking_history table - restrict to admin-only access
DROP POLICY IF EXISTS "Authenticated users can insert ranking history" ON ranking_history;

CREATE POLICY "Admins can insert ranking history" ON ranking_history 
  FOR INSERT 
  WITH CHECK (is_admin());

-- Fix follows table DELETE policy - restrict to owner only
DROP POLICY IF EXISTS "Users can unfollow athletes" ON follows;

CREATE POLICY "Users can unfollow athletes" ON follows 
  FOR DELETE 
  USING (
    follower_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );