-- Create leagues table
CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  join_code TEXT UNIQUE NOT NULL,
  league_type TEXT NOT NULL,
  selected_team TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create league_members table
CREATE TABLE public.league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  team TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(league_id, user_id)
);

-- Enable RLS
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for leagues
CREATE POLICY "Anyone can view public leagues" ON public.leagues
  FOR SELECT USING (is_public = true OR host_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.league_members WHERE league_id = id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create leagues" ON public.leagues
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their leagues" ON public.leagues
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their leagues" ON public.leagues
  FOR DELETE USING (auth.uid() = host_id);

-- RLS policies for league_members
CREATE POLICY "League members are viewable by league participants" ON public.league_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.league_members lm WHERE lm.league_id = league_id AND lm.user_id = auth.uid())
  );

CREATE POLICY "Users can join leagues" ON public.league_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave leagues" ON public.league_members
  FOR DELETE USING (auth.uid() = user_id);