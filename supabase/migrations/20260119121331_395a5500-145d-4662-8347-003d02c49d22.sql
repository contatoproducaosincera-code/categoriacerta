-- Add avatar_url and instagram columns to waitlist table
ALTER TABLE public.waitlist 
ADD COLUMN avatar_url TEXT,
ADD COLUMN instagram TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.waitlist.avatar_url IS 'URL of the athlete profile photo (required for registration)';
COMMENT ON COLUMN public.waitlist.instagram IS 'Instagram handle or profile URL (optional)';

-- Create storage bucket for waitlist profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('waitlist-photos', 'waitlist-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to the waitlist-photos bucket
CREATE POLICY "Anyone can upload waitlist photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'waitlist-photos');

-- Allow anyone to view waitlist photos
CREATE POLICY "Anyone can view waitlist photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'waitlist-photos');