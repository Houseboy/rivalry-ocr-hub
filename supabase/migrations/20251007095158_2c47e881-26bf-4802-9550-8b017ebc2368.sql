-- Fix security issue: Recreate rivalry_stats view without SECURITY DEFINER
DROP VIEW IF EXISTS public.rivalry_stats;

CREATE VIEW public.rivalry_stats AS
SELECT 
  user_id,
  rival_name,
  COUNT(*) as total_matches,
  SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
  SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
  ROUND(SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100, 1) as win_rate,
  MAX(match_date) as last_played
FROM public.matches
GROUP BY user_id, rival_name;

-- Grant select on the view
GRANT SELECT ON public.rivalry_stats TO authenticated;