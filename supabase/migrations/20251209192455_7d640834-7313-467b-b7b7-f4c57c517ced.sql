-- Fix security definer view by recreating with SECURITY INVOKER (the default)
DROP VIEW IF EXISTS public.league_standings;

-- Recreate the view without security definer (uses invoker by default)
CREATE VIEW public.league_standings 
WITH (security_invoker = true)
AS
SELECT 
  lm.league_id,
  lm.user_id,
  lm.team,
  p.username,
  p.avatar_url,
  COALESCE(stats.played, 0)::integer as played,
  COALESCE(stats.wins, 0)::integer as wins,
  COALESCE(stats.draws, 0)::integer as draws,
  COALESCE(stats.losses, 0)::integer as losses,
  COALESCE(stats.goals_for, 0)::integer as goals_for,
  COALESCE(stats.goals_against, 0)::integer as goals_against,
  (COALESCE(stats.goals_for, 0) - COALESCE(stats.goals_against, 0))::integer as goal_difference,
  ((COALESCE(stats.wins, 0) * 3) + COALESCE(stats.draws, 0))::integer as points
FROM public.league_members lm
LEFT JOIN public.profiles p ON p.id = lm.user_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::integer as played,
    SUM(CASE 
      WHEN (lr.home_user_id = lm.user_id AND lr.home_score > lr.away_score) 
        OR (lr.away_user_id = lm.user_id AND lr.away_score > lr.home_score) THEN 1 ELSE 0 
    END)::integer as wins,
    SUM(CASE WHEN lr.home_score = lr.away_score THEN 1 ELSE 0 END)::integer as draws,
    SUM(CASE 
      WHEN (lr.home_user_id = lm.user_id AND lr.home_score < lr.away_score) 
        OR (lr.away_user_id = lm.user_id AND lr.away_score < lr.home_score) THEN 1 ELSE 0 
    END)::integer as losses,
    SUM(CASE 
      WHEN lr.home_user_id = lm.user_id THEN lr.home_score 
      ELSE lr.away_score 
    END)::integer as goals_for,
    SUM(CASE 
      WHEN lr.home_user_id = lm.user_id THEN lr.away_score 
      ELSE lr.home_score 
    END)::integer as goals_against
  FROM public.league_results lr
  WHERE lr.league_id = lm.league_id 
    AND (lr.home_user_id = lm.user_id OR lr.away_user_id = lm.user_id)
) stats ON true;