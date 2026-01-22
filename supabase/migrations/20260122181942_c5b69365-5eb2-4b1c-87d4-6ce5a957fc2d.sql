-- Corrigir políticas RLS para permitir leitura pública de atletas e achievements
-- O problema atual é que as políticas existentes são RESTRICTIVE (No), 
-- o que significa que TODAS devem ser satisfeitas para permitir acesso

-- 1. Remover políticas de SELECT conflitantes na tabela athletes
DROP POLICY IF EXISTS "Authenticated users can view all athlete data" ON public.athletes;
DROP POLICY IF EXISTS "Public can view athlete profiles" ON public.athletes;

-- 2. Criar política permissiva para leitura pública de atletas
-- Ranking deve ser público, não requer autenticação
CREATE POLICY "Allow public read access to athletes"
ON public.athletes
FOR SELECT
TO anon, authenticated
USING (true);

-- 3. Verificar e corrigir políticas de achievements também (para calcular pontos)
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;

CREATE POLICY "Allow public read access to achievements"
ON public.achievements
FOR SELECT
TO anon, authenticated
USING (true);