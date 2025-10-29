-- Create badge_types table to define available achievements
CREATE TABLE public.badge_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create athlete_badges table to track earned badges
CREATE TABLE public.athlete_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  badge_type_id uuid NOT NULL REFERENCES public.badge_types(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(athlete_id, badge_type_id)
);

-- Enable RLS
ALTER TABLE public.badge_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badge_types (everyone can view)
CREATE POLICY "Anyone can view badge types"
ON public.badge_types
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage badge types"
ON public.badge_types
FOR ALL
USING (true);

-- RLS Policies for athlete_badges (everyone can view)
CREATE POLICY "Anyone can view athlete badges"
ON public.athlete_badges
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage athlete badges"
ON public.athlete_badges
FOR ALL
USING (true);

-- Insert predefined badge types
INSERT INTO public.badge_types (name, description, icon, category, requirement_type, requirement_value) VALUES
('Primeira Medalha de Ouro', 'Conquistou o primeiro lugar em um torneio', '🥇', 'tournament', 'first_place', 1),
('Triplo Campeão', 'Venceu 3 torneios', '🏆', 'tournament', 'first_place', 3),
('Pentacampeão', 'Venceu 5 torneios', '👑', 'tournament', 'first_place', 5),
('Prata Brilhante', 'Conquistou 3 segundos lugares', '🥈', 'tournament', 'second_place', 3),
('Bronze Valioso', 'Conquistou 3 terceiros lugares', '🥉', 'tournament', 'third_place', 3),
('Pódio Completo', 'Conquistou pelo menos uma medalha de cada (ouro, prata, bronze)', '🎖️', 'tournament', 'podium_variety', 0),
('Centurião', 'Atingiu 100 pontos', '💯', 'points', 'points_milestone', 100),
('Em Chamas', 'Atingiu 500 pontos', '🔥', 'points', 'points_milestone', 500),
('Elite', 'Atingiu 1000 pontos', '💎', 'points', 'points_milestone', 1000),
('Lenda Viva', 'Atingiu 2000 pontos', '👑', 'points', 'points_milestone', 2000),
('Estrela em Ascensão', 'Subiu de categoria pela primeira vez', '⭐', 'category', 'category_upgrade', 1),
('Evolução Contínua', 'Subiu de categoria 3 vezes', '🌟', 'category', 'category_upgrade', 3),
('Participante Ativo', 'Participou de 5 torneios', '🎯', 'participation', 'tournament_count', 5),
('Veterano Imparável', 'Participou de 10 torneios', '🚀', 'participation', 'tournament_count', 10),
('Maratonista', 'Participou de 20 torneios', '⚡', 'participation', 'tournament_count', 20);

-- Function to check and award badges automatically
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  athlete_rec record;
  first_place_count integer;
  second_place_count integer;
  third_place_count integer;
  tournament_count integer;
  category_upgrades integer;
  has_gold boolean;
  has_silver boolean;
  has_bronze boolean;
BEGIN
  -- Get athlete stats
  SELECT 
    COUNT(*) FILTER (WHERE position = 1) as first_places,
    COUNT(*) FILTER (WHERE position = 2) as second_places,
    COUNT(*) FILTER (WHERE position = 3) as third_places,
    COUNT(*) as total_tournaments,
    COUNT(*) FILTER (WHERE position = 1) > 0 as has_first,
    COUNT(*) FILTER (WHERE position = 2) > 0 as has_second,
    COUNT(*) FILTER (WHERE position = 3) > 0 as has_third
  INTO 
    first_place_count,
    second_place_count,
    third_place_count,
    tournament_count,
    has_gold,
    has_silver,
    has_bronze
  FROM public.achievements
  WHERE athlete_id = NEW.athlete_id;

  -- Get category upgrade count
  SELECT COUNT(*) INTO category_upgrades
  FROM public.category_history
  WHERE athlete_id = NEW.athlete_id;

  -- Get current points
  SELECT points INTO athlete_rec
  FROM public.athletes
  WHERE id = NEW.athlete_id;

  -- Award badges based on achievements
  -- First place badges
  IF first_place_count >= 1 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.athlete_id, id FROM public.badge_types WHERE name = 'Primeira Medalha de Ouro'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  IF first_place_count >= 3 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.athlete_id, id FROM public.badge_types WHERE name = 'Triplo Campeão'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  IF first_place_count >= 5 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.athlete_id, id FROM public.badge_types WHERE name = 'Pentacampeão'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  -- Second place badges
  IF second_place_count >= 3 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.athlete_id, id FROM public.badge_types WHERE name = 'Prata Brilhante'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  -- Third place badges
  IF third_place_count >= 3 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.athlete_id, id FROM public.badge_types WHERE name = 'Bronze Valioso'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  -- Podium variety badge
  IF has_gold AND has_silver AND has_bronze THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.athlete_id, id FROM public.badge_types WHERE name = 'Pódio Completo'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  -- Tournament participation badges
  IF tournament_count >= 5 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.athlete_id, id FROM public.badge_types WHERE name = 'Participante Ativo'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  IF tournament_count >= 10 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.athlete_id, id FROM public.badge_types WHERE name = 'Veterano Imparável'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  IF tournament_count >= 20 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.athlete_id, id FROM public.badge_types WHERE name = 'Maratonista'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Function to award points-based badges
CREATE OR REPLACE FUNCTION public.award_points_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Award points milestone badges
  IF NEW.points >= 100 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.id, id FROM public.badge_types WHERE name = 'Centurião'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  IF NEW.points >= 500 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.id, id FROM public.badge_types WHERE name = 'Em Chamas'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  IF NEW.points >= 1000 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.id, id FROM public.badge_types WHERE name = 'Elite'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  IF NEW.points >= 2000 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.id, id FROM public.badge_types WHERE name = 'Lenda Viva'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Function to award category upgrade badges
CREATE OR REPLACE FUNCTION public.award_category_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  upgrade_count integer;
BEGIN
  -- Count category upgrades
  SELECT COUNT(*) INTO upgrade_count
  FROM public.category_history
  WHERE athlete_id = NEW.athlete_id;

  -- Award category upgrade badges
  IF upgrade_count >= 1 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.athlete_id, id FROM public.badge_types WHERE name = 'Estrela em Ascensão'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  IF upgrade_count >= 3 THEN
    INSERT INTO public.athlete_badges (athlete_id, badge_type_id)
    SELECT NEW.athlete_id, id FROM public.badge_types WHERE name = 'Evolução Contínua'
    ON CONFLICT (athlete_id, badge_type_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER award_achievement_badges
AFTER INSERT OR UPDATE ON public.achievements
FOR EACH ROW
EXECUTE FUNCTION public.check_and_award_badges();

CREATE TRIGGER award_points_badges_trigger
AFTER INSERT OR UPDATE OF points ON public.athletes
FOR EACH ROW
EXECUTE FUNCTION public.award_points_badges();

CREATE TRIGGER award_category_badges_trigger
AFTER INSERT ON public.category_history
FOR EACH ROW
EXECUTE FUNCTION public.award_category_badges();