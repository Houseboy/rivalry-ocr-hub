-- Add tier and is_ranked to leagues
ALTER TABLE public.leagues 
ADD COLUMN tier INT DEFAULT 1,
ADD COLUMN is_ranked BOOLEAN DEFAULT true;

-- Add performance data to league members
ALTER TABLE public.league_members 
ADD COLUMN performance_data JSONB DEFAULT '{}'::jsonb;

-- Add position column to league_members if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'league_members' 
    AND column_name = 'position'
  ) THEN
    ALTER TABLE public.league_members ADD COLUMN position INT;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_league_members_league ON public.league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON public.league_members(user_id);

-- Create a function to update league rankings
CREATE OR REPLACE FUNCTION public.update_league_rankings(league_id_param UUID)
RETURNS void AS $$
BEGIN
  -- First, update all positions to NULL to reset rankings
  UPDATE league_members SET position = NULL WHERE league_id = league_id_param;
  
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_league_rankings TO authenticated;

-- Create a trigger to automatically update rankings after a match is added
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
