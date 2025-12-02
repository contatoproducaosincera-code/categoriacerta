-- Adicionar coluna image_url na tabela tournaments
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Criar bucket para imagens de torneios
INSERT INTO storage.buckets (id, name, public)
VALUES ('tournament-images', 'tournament-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política para visualização pública das imagens
CREATE POLICY "Tournament images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'tournament-images');

-- Política para admins fazerem upload
CREATE POLICY "Admins can upload tournament images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tournament-images' AND public.is_admin());

-- Política para admins atualizarem imagens
CREATE POLICY "Admins can update tournament images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tournament-images' AND public.is_admin())
WITH CHECK (bucket_id = 'tournament-images' AND public.is_admin());

-- Política para admins excluírem imagens
CREATE POLICY "Admins can delete tournament images"
ON storage.objects FOR DELETE
USING (bucket_id = 'tournament-images' AND public.is_admin());