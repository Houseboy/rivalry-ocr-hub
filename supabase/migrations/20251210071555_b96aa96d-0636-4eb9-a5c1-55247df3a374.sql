-- Recreate league_standings view to ensure it doesn't have SECURITY DEFINER
DROP VIEW IF EXISTS public.league_standings;

CREATE VIEW public.league_standings AS
SELECT 
    lm.league_id,
    lm.user_id,
    lm.team,
    p.username,
    p.avatar_url,
    COALESCE(stats.played, 0) AS played,
    COALESCE(stats.wins, 0) AS wins,
    COALESCE(stats.draws, 0) AS draws,
    COALESCE(stats.losses, 0) AS losses,
    COALESCE(stats.goals_for, 0) AS goals_for,
    COALESCE(stats.goals_against, 0) AS goals_against,
    (COALESCE(stats.goals_for, 0) - COALESCE(stats.goals_against, 0)) AS goal_difference,
    ((COALESCE(stats.wins, 0) * 3) + COALESCE(stats.draws, 0)) AS points
FROM league_members lm
LEFT JOIN profiles p ON p.id = lm.user_id
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*)::integer AS played,
        SUM(CASE 
            WHEN (lr.home_user_id = lm.user_id AND lr.home_score > lr.away_score) 
              OR (lr.away_user_id = lm.user_id AND lr.away_score > lr.home_score) 
            THEN 1 ELSE 0 
        END)::integer AS wins,
        SUM(CASE WHEN lr.home_score = lr.away_score THEN 1 ELSE 0 END)::integer AS draws,
        SUM(CASE 
            WHEN (lr.home_user_id = lm.user_id AND lr.home_score < lr.away_score) 
              OR (lr.away_user_id = lm.user_id AND lr.away_score < lr.home_score) 
            THEN 1 ELSE 0 
        END)::integer AS losses,
        SUM(CASE WHEN lr.home_user_id = lm.user_id THEN lr.home_score ELSE lr.away_score END)::integer AS goals_for,
        SUM(CASE WHEN lr.home_user_id = lm.user_id THEN lr.away_score ELSE lr.home_score END)::integer AS goals_against
    FROM league_results lr
    WHERE lr.league_id = lm.league_id 
      AND (lr.home_user_id = lm.user_id OR lr.away_user_id = lm.user_id)
) stats ON true;