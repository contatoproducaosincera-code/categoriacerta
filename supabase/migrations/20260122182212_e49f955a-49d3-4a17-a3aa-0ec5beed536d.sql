-- Corrigir permissões de GRANT para permitir acesso às tabelas
-- O problema é que não há GRANT para as roles anon e authenticated

-- Conceder SELECT para anon e authenticated na tabela athletes
GRANT SELECT ON public.athletes TO anon;
GRANT SELECT ON public.athletes TO authenticated;

-- Conceder SELECT para anon e authenticated na tabela achievements
GRANT SELECT ON public.achievements TO anon;
GRANT SELECT ON public.achievements TO authenticated;

-- Garantir que outras tabelas públicas também tenham os grants corretos
GRANT SELECT ON public.badge_types TO anon;
GRANT SELECT ON public.badge_types TO authenticated;

GRANT SELECT ON public.athlete_badges TO anon;
GRANT SELECT ON public.athlete_badges TO authenticated;

GRANT SELECT ON public.tournaments TO anon;
GRANT SELECT ON public.tournaments TO authenticated;

GRANT SELECT ON public.category_history TO anon;
GRANT SELECT ON public.category_history TO authenticated;

GRANT SELECT ON public.ranking_history TO anon;
GRANT SELECT ON public.ranking_history TO authenticated;

GRANT SELECT ON public.waitlist TO anon;
GRANT SELECT ON public.waitlist TO authenticated;