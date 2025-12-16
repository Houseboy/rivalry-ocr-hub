-- Create follows table for social graph
CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows
CREATE POLICY "Anyone can view follow relationships"
  ON public.follows
  FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Create indexes for performance
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Create function to notify on new follow
CREATE OR REPLACE FUNCTION public.notify_new_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NEW;
END;
$$;

-- Create trigger for follow notifications
CREATE TRIGGER on_new_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follow();