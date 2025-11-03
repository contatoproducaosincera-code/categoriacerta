-- Adicionar enum para gênero
CREATE TYPE public.gender AS ENUM ('Masculino', 'Feminino');

-- Adicionar coluna gender na tabela athletes
ALTER TABLE public.athletes 
ADD COLUMN gender public.gender NOT NULL DEFAULT 'Masculino';

-- Criar índice para melhor performance nas consultas por gênero
CREATE INDEX idx_athletes_gender ON public.athletes(gender);

-- Criar índice composto para consultas por gênero e categoria
CREATE INDEX idx_athletes_gender_category ON public.athletes(gender, category);

-- Atualizar comentário da tabela
COMMENT ON COLUMN public.athletes.gender IS 'Gênero do atleta: Masculino ou Feminino';