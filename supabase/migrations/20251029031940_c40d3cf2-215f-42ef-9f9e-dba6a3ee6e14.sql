-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create policies for follows
CREATE POLICY "Anyone can view follows"
  ON public.follows
  FOR SELECT
  USING (true);

CREATE POLICY "Users can follow athletes"
  ON public.follows
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can unfollow athletes"
  ON public.follows
  FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Create function to count followers
CREATE OR REPLACE FUNCTION get_follower_count(athlete_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM follows
  WHERE following_id = athlete_id;
$$;

-- Create function to count following
CREATE OR REPLACE FUNCTION get_following_count(athlete_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM follows
  WHERE follower_id = athlete_id;
$$;

-- Create notifications table for follow events
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (true);

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (true);

-- Create index for notifications
CREATE INDEX idx_notifications_athlete ON public.notifications(athlete_id);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Trigger to create notification when someone follows an athlete
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get follower name
  SELECT name INTO follower_name
  FROM athletes
  WHERE id = NEW.follower_id;
  
  -- Create notification
  INSERT INTO notifications (athlete_id, type, title, message)
  VALUES (
    NEW.following_id,
    'new_follower',
    'Novo seguidor!',
    follower_name || ' começou a seguir você'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_new_follow ON public.follows;
CREATE TRIGGER on_new_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();