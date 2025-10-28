-- Enum para categorias
CREATE TYPE public.category AS ENUM ('Iniciante', 'D', 'C', 'B', 'A');

-- Tabela de atletas
CREATE TABLE public.athletes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  city TEXT NOT NULL,
  instagram TEXT,
  category public.category NOT NULL DEFAULT 'Iniciante',
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de categorias
CREATE TABLE public.category_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  old_category public.category NOT NULL,
  new_category public.category NOT NULL,
  points_at_change INTEGER NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de conquistas
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  tournament_name TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position IN (1, 2, 3)),
  points_awarded INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de torneios
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  category public.category NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Todos podem visualizar
CREATE POLICY "Anyone can view athletes" ON public.athletes FOR SELECT USING (true);
CREATE POLICY "Anyone can view category history" ON public.category_history FOR SELECT USING (true);
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);

-- Apenas authenticated users podem inserir/atualizar (admins)
CREATE POLICY "Authenticated users can insert athletes" ON public.athletes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update athletes" ON public.athletes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete athletes" ON public.athletes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert achievements" ON public.achievements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update achievements" ON public.achievements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete achievements" ON public.achievements FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert tournaments" ON public.tournaments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tournaments" ON public.tournaments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete tournaments" ON public.tournaments FOR DELETE TO authenticated USING (true);

-- Function para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_athletes_updated_at
BEFORE UPDATE ON public.athletes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function para verificar e atualizar categoria automaticamente
CREATE OR REPLACE FUNCTION public.check_and_upgrade_category()
RETURNS TRIGGER AS $$
DECLARE
  new_cat public.category;
  old_cat public.category;
BEGIN
  old_cat := NEW.category;
  
  -- Lógica de upgrade baseada em pontos
  IF NEW.points >= 500 AND NEW.points < 1000 THEN
    IF NEW.category = 'Iniciante' THEN
      new_cat := 'D';
    END IF;
  ELSIF NEW.points >= 1000 AND NEW.points < 1500 THEN
    IF NEW.category IN ('Iniciante', 'D') THEN
      new_cat := 'C';
    END IF;
  ELSIF NEW.points >= 1500 AND NEW.points < 2000 THEN
    IF NEW.category IN ('Iniciante', 'D', 'C') THEN
      new_cat := 'B';
    END IF;
  ELSIF NEW.points >= 2000 THEN
    IF NEW.category IN ('Iniciante', 'D', 'C', 'B') THEN
      new_cat := 'A';
    END IF;
  END IF;
  
  -- Se houve mudança de categoria
  IF new_cat IS NOT NULL AND new_cat != old_cat THEN
    NEW.category := new_cat;
    
    -- Registrar no histórico
    INSERT INTO public.category_history (athlete_id, old_category, new_category, points_at_change)
    VALUES (NEW.id, old_cat, new_cat, NEW.points);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para upgrade automático de categoria
CREATE TRIGGER auto_upgrade_category
BEFORE UPDATE OF points ON public.athletes
FOR EACH ROW
WHEN (OLD.points IS DISTINCT FROM NEW.points)
EXECUTE FUNCTION public.check_and_upgrade_category();

-- Inserir dados de exemplo
INSERT INTO public.athletes (name, email, city, category, points) VALUES
  ('João Silva', 'joao@email.com', 'Rio de Janeiro', 'C', 850),
  ('Maria Santos', 'maria@email.com', 'São Paulo', 'C', 780),
  ('Pedro Costa', 'pedro@email.com', 'Florianópolis', 'D', 720),
  ('Ana Oliveira', 'ana@email.com', 'Rio de Janeiro', 'D', 650),
  ('Carlos Souza', 'carlos@email.com', 'Curitiba', 'Iniciante', 420),
  ('Julia Lima', 'julia@email.com', 'São Paulo', 'Iniciante', 380);

INSERT INTO public.tournaments (name, date, location, category, description) VALUES
  ('Copa Verão Beach Tennis', '2025-01-15', 'Rio de Janeiro - RJ', 'C', 'Torneio classificatório para categoria C'),
  ('Circuito Praiano', '2025-01-22', 'Florianópolis - SC', 'D', 'Aberto para atletas categoria D'),
  ('Open de Beach Tennis', '2025-02-05', 'São Paulo - SP', 'Iniciante', 'Torneio para iniciantes - Sem taxa de inscrição'),
  ('Desafio das Quadras', '2025-02-18', 'Curitiba - PR', 'C', 'Grande prêmio para os vencedores');