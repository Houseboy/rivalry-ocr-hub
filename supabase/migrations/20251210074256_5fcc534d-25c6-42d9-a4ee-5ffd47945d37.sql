-- Add unique constraint to prevent same team selection in a league
-- First check if constraint exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_team_per_league'
  ) THEN
    ALTER TABLE public.league_members 
    ADD CONSTRAINT unique_team_per_league UNIQUE (league_id, team);
  END IF;
END $$;

-- Add policy for hosts to remove members (update existing policy)
DROP POLICY IF EXISTS "Users can leave leagues" ON public.league_members;

CREATE POLICY "Users can leave or hosts can remove"
ON public.league_members
FOR DELETE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.leagues 
    WHERE leagues.id = league_members.league_id 
    AND leagues.host_id = auth.uid()
  )
);

-- Add update policy for team selection (one-time change by user)
CREATE POLICY "Users can update their team selection"
ON public.league_members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);