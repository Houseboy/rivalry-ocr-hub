-- Add parent_id column to post_comments for reply threading
ALTER TABLE public.post_comments 
ADD COLUMN parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- Create index for faster reply lookups
CREATE INDEX idx_post_comments_parent_id ON public.post_comments(parent_id);

-- Create trigger function to notify when someone replies to a comment
CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  parent_comment_owner_id UUID;
BEGIN
  -- Only proceed if this is a reply (has parent_id)
  IF NEW.parent_id IS NOT NULL THEN
    -- Get the parent comment owner
    SELECT user_id INTO parent_comment_owner_id
    FROM public.post_comments
    WHERE id = NEW.parent_id;
    
    -- Don't notify if replying to own comment
    IF parent_comment_owner_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, post_id, type, content)
      VALUES (parent_comment_owner_id, NEW.user_id, NEW.post_id, 'comment_reply', NEW.content);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for comment replies
CREATE TRIGGER on_comment_reply
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_comment_reply();