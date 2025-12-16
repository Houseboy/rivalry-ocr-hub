-- Create league_fixtures table for scheduled matches
CREATE TABLE public.league_fixtures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  home_user_id UUID NOT NULL,
  away_user_id UUID NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  gameweek INTEGER NOT NULL DEFAULT 1,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'postponed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create league_results table for match results
CREATE TABLE public.league_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id UUID NOT NULL REFERENCES public.league_fixtures(id) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  home_user_id UUID NOT NULL,
  away_user_id UUID NOT NULL,
  home_score INTEGER NOT NULL DEFAULT 0,
  away_score INTEGER NOT NULL DEFAULT 0,
  screenshot_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add tournament fields to leagues table
ALTER TABLE public.leagues 
  ADD COLUMN tournament_mode TEXT DEFAULT 'league' CHECK (tournament_mode IN ('league', 'cup', 'group_knockout')),
  ADD COLUMN current_phase TEXT DEFAULT NULL,
  ADD COLUMN max_participants INTEGER DEFAULT 20,
  ADD COLUMN gameweeks_count INTEGER DEFAULT 38;

-- Create league_standings view for computed standings
CREATE VIEW public.league_standings AS
SELECT 
  lm.league_id,
  lm.user_id,
  lm.team,
  p.username,
  p.avatar_url,
  COALESCE(stats.played, 0) as played,
  COALESCE(stats.wins, 0) as wins,
  COALESCE(stats.draws, 0) as draws,
  COALESCE(stats.losses, 0) as losses,
  COALESCE(stats.goals_for, 0) as goals_for,
  COALESCE(stats.goals_against, 0) as goals_against,
  COALESCE(stats.goals_for, 0) - COALESCE(stats.goals_against, 0) as goal_difference,
  (COALESCE(stats.wins, 0) * 3) + COALESCE(stats.draws, 0) as points
FROM public.league_members lm
LEFT JOIN public.profiles p ON p.id = lm.user_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) as played,
    SUM(CASE 
      WHEN (lr.home_user_id = lm.user_id AND lr.home_score > lr.away_score) 
        OR (lr.away_user_id = lm.user_id AND lr.away_score > lr.home_score) THEN 1 ELSE 0 
    END) as wins,
    SUM(CASE WHEN lr.home_score = lr.away_score THEN 1 ELSE 0 END) as draws,
    SUM(CASE 
      WHEN (lr.home_user_id = lm.user_id AND lr.home_score < lr.away_score) 
        OR (lr.away_user_id = lm.user_id AND lr.away_score < lr.home_score) THEN 1 ELSE 0 
    END) as losses,
    SUM(CASE 
      WHEN lr.home_user_id = lm.user_id THEN lr.home_score 
      ELSE lr.away_score 
    END) as goals_for,
    SUM(CASE 
      WHEN lr.home_user_id = lm.user_id THEN lr.away_score 
      ELSE lr.home_score 
    END) as goals_against
  FROM public.league_results lr
  WHERE lr.league_id = lm.league_id 
    AND (lr.home_user_id = lm.user_id OR lr.away_user_id = lm.user_id)
) stats ON true;

-- Create tournament_brackets table for cup/knockout tournaments
CREATE TABLE public.tournament_brackets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  round TEXT NOT NULL CHECK (round IN ('group_stage', 'round_of_16', 'quarter_finals', 'semi_finals', 'final', 'third_place')),
  group_name TEXT,
  match_number INTEGER NOT NULL DEFAULT 1,
  home_user_id UUID,
  away_user_id UUID,
  home_team TEXT,
  away_team TEXT,
  home_score INTEGER,
  away_score INTEGER,
  winner_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.league_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_brackets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for league_fixtures
CREATE POLICY "League members can view fixtures"
  ON public.league_fixtures FOR SELECT
  USING (is_league_member(league_id, auth.uid()) OR EXISTS (
    SELECT 1 FROM public.leagues WHERE id = league_id AND is_public = true
  ));

CREATE POLICY "League hosts can create fixtures"
  ON public.league_fixtures FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.leagues WHERE id = league_id AND host_id = auth.uid()
  ));

CREATE POLICY "League hosts can update fixtures"
  ON public.league_fixtures FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.leagues WHERE id = league_id AND host_id = auth.uid()
  ));

CREATE POLICY "League hosts can delete fixtures"
  ON public.league_fixtures FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.leagues WHERE id = league_id AND host_id = auth.uid()
  ));

-- RLS Policies for league_results
CREATE POLICY "Anyone can view league results"
  ON public.league_results FOR SELECT
  USING (true);

CREATE POLICY "League hosts can insert results"
  ON public.league_results FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.leagues WHERE id = league_id AND host_id = auth.uid()
  ) OR home_user_id = auth.uid() OR away_user_id = auth.uid());

CREATE POLICY "League hosts can update results"
  ON public.league_results FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.leagues WHERE id = league_id AND host_id = auth.uid()
  ));

CREATE POLICY "League hosts can delete results"
  ON public.league_results FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.leagues WHERE id = league_id AND host_id = auth.uid()
  ));

-- RLS Policies for tournament_brackets
CREATE POLICY "Anyone can view tournament brackets"
  ON public.tournament_brackets FOR SELECT
  USING (true);

CREATE POLICY "League hosts can manage brackets"
  ON public.tournament_brackets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.leagues WHERE id = league_id AND host_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_league_fixtures_league_id ON public.league_fixtures(league_id);
CREATE INDEX idx_league_fixtures_gameweek ON public.league_fixtures(gameweek);
CREATE INDEX idx_league_results_league_id ON public.league_results(league_id);
CREATE INDEX idx_league_results_fixture_id ON public.league_results(fixture_id);
CREATE INDEX idx_tournament_brackets_league_id ON public.tournament_brackets(league_id);
CREATE INDEX idx_tournament_brackets_round ON public.tournament_brackets(round);

-- Trigger for updated_at
CREATE TRIGGER update_league_fixtures_updated_at
  BEFORE UPDATE ON public.league_fixtures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();