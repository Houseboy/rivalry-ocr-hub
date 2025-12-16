-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment', 'reaction')),
  content TEXT,
  reaction_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Function to create notification for comment
CREATE OR REPLACE FUNCTION public.notify_match_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_owner_id UUID;
BEGIN
  -- Get the match owner
  SELECT user_id INTO match_owner_id
  FROM public.matches
  WHERE id = NEW.match_id;
  
  -- Don't create notification if commenting on own match
  IF match_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, match_id, type, content)
    VALUES (match_owner_id, NEW.user_id, NEW.match_id, 'comment', NEW.content);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to create notification for reaction
CREATE OR REPLACE FUNCTION public.notify_match_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_owner_id UUID;
BEGIN
  -- Get the match owner
  SELECT user_id INTO match_owner_id
  FROM public.matches
  WHERE id = NEW.match_id;
  
  -- Don't create notification if reacting to own match
  IF match_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, match_id, type, reaction_type)
    VALUES (match_owner_id, NEW.user_id, NEW.match_id, 'reaction', NEW.reaction_type);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.match_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_match_comment();

CREATE TRIGGER on_reaction_created
  AFTER INSERT ON public.match_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_match_reaction();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;