
INSERT INTO storage.buckets (id, name, public)
VALUES ('regulamento', 'regulamento', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read files from the regulamento bucket
CREATE POLICY "Anyone can view regulamento files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'regulamento');

-- Only admins can upload/update/delete regulamento files
CREATE POLICY "Admins can manage regulamento files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'regulamento' AND public.is_admin());

CREATE POLICY "Admins can update regulamento files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'regulamento' AND public.is_admin());

CREATE POLICY "Admins can delete regulamento files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'regulamento' AND public.is_admin());
