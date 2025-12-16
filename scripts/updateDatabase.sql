-- Run these commands in your Supabase SQL Editor to set up the leaderboard features

-- 1. Add tier and is_ranked to leagues table
ALTER TABLE public.leagues 
ADD COLUMN IF NOT EXISTS tier INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_ranked BOOLEAN DEFAULT true;

-- 2. Add performance data to league_members table
ALTER TABLE public.league_members 
ADD COLUMN IF NOT EXISTS performance_data JSONB DEFAULT '{}'::jsonb;

-- 3. Add position column to league_members if it doesn't exist
ALTER TABLE public.league_members 
ADD COLUMN IF NOT EXISTS position INT;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_league_members_league ON public.league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON public.league_members(user_id);

-- 5. Create function to update league rankings
CREATE OR REPLACE FUNCTION public.update_league_rankings(league_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Update rankings based on match results
  WITH ranked_matches AS (
    SELECT 
      user_id,
      COUNT(*) as matches_played,
      SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
      SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
      SUM(goals_for) as goals_for,
      SUM(goals_against) as goals_against,
      ARRAY_AGG(
        CASE 
          WHEN result = 'win' THEN 'W'
          WHEN result = 'draw' THEN 'D'
          WHEN result = 'loss' THEN 'L'
        END
        ORDER BY match_date DESC
        LIMIT 5
      ) as form
    FROM (
      -- Home matches
      SELECT 
        home_player_id as user_id,
        CASE 
          WHEN home_score > away_score THEN 'win'
          WHEN home_score = away_score THEN 'draw'
          ELSE 'loss'
        END as result,
        home_score as goals_for,
        away_score as goals_against,
        match_date
      FROM matches
      WHERE league_id = league_id_param
      AND home_player_id IS NOT NULL
      
      UNION ALL
      
      -- Away matches
      SELECT 
        away_player_id as user_id,
        CASE 
          WHEN away_score > home_score THEN 'win'
          WHEN away_score = home_score THEN 'draw'
          ELSE 'loss'
        END as result,
        away_score as goals_for,
        home_score as goals_against,
        match_date
      FROM matches
      WHERE league_id = league_id_param
      AND away_player_id IS NOT NULL
    ) all_matches
    GROUP BY user_id
  ),
  ranked_players AS (
    SELECT 
      user_id,
      matches_played,
      wins,
      draws,
      losses,
      goals_for,
      goals_against,
      goals_for - goals_against as goal_difference,
      (wins * 3) + draws as points,
      form,
      ROW_NUMBER() OVER (ORDER BY (wins * 3) + draws DESC, (goals_for - goals_against) DESC, goals_for DESC) as position
    FROM ranked_matches
  )
  UPDATE league_members
  SET 
    position = rp.position,
    performance_data = jsonb_build_object(
      'matches_played', rp.matches_played,
      'wins', rp.wins,
      'draws', rp.draws,
      'losses', rp.losses,
      'goals_for', rp.goals_for,
      'goals_against', rp.goals_against,
      'goal_difference', rp.goal_difference,
      'points', rp.points,
      'form', rp.form,
      'updated_at', NOW()
    )
  FROM ranked_players rp
  WHERE league_members.league_id = league_id_param
  AND league_members.user_id = rp.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_league_rankings TO authenticated;

-- 7. Set tiers for existing leagues
UPDATE leagues SET tier = 
  CASE 
    WHEN name ILIKE '%champion%' THEN 4
    WHEN name ILIKE '%elite%' THEN 3
    WHEN name ILIKE '%competitive%' THEN 2
    ELSE 1
  END
WHERE tier IS NULL OR tier = 1;

-- 8. Update all existing league rankings
DO $$
DECLARE
  league_record RECORD;
BEGIN
  FOR league_record IN SELECT id FROM leagues WHERE is_ranked = true
  LOOP
    PERFORM public.update_league_rankings(league_record.id);
    RAISE NOTICE 'Updated rankings for league %', league_record.id;
  END LOOP;
END $$;

-- 9. Create a trigger for automatic updates (optional)
CREATE OR REPLACE FUNCTION trigger_update_league_rankings()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_league_rankings(NEW.league_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS after_match_insert ON matches;

-- Create trigger
CREATE TRIGGER after_match_insert
AFTER INSERT ON matches
FOR EACH ROW
WHEN (NEW.league_id IS NOT NULL)
EXECUTE FUNCTION trigger_update_league_rankings();
