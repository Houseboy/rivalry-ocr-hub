-- Add new fields to profiles table for enhanced profile features
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS favorite_team TEXT,
ADD COLUMN IF NOT EXISTS playstyle TEXT DEFAULT 'Balanced',
ADD COLUMN IF NOT EXISTS rank_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS privacy_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system';

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  icon TEXT,
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS on achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements
CREATE POLICY "Users can view their own achievements"
ON public.achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create a view for rivalry stats
CREATE OR REPLACE VIEW public.rivalry_stats AS
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