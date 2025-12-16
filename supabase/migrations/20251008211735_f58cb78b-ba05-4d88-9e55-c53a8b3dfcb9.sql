-- Create reactions table for likes/reactions on matches
CREATE TABLE IF NOT EXISTS public.match_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'fire', 'clap', 'trophy', 'thinking')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, user_id, reaction_type)
);

-- Create comments table for match discussions
CREATE TABLE IF NOT EXISTS public.match_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reactions table
ALTER TABLE public.match_reactions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on comments table
ALTER TABLE public.match_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for match_reactions
CREATE POLICY "Anyone can view reactions"
  ON public.match_reactions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own reactions"
  ON public.match_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON public.match_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for match_comments
CREATE POLICY "Anyone can view comments"
  ON public.match_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own comments"
  ON public.match_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.match_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.match_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update matches table RLS to allow public viewing
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;

CREATE POLICY "Anyone can view matches"
  ON public.matches
  FOR SELECT
  USING (true);

-- Trigger for updated_at on comments
CREATE TRIGGER update_match_comments_updated_at
  BEFORE UPDATE ON public.match_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_reactions_match_id ON public.match_reactions(match_id);
CREATE INDEX IF NOT EXISTS idx_match_reactions_user_id ON public.match_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_match_comments_match_id ON public.match_comments(match_id);
CREATE INDEX IF NOT EXISTS idx_match_comments_created_at ON public.match_comments(created_at DESC);