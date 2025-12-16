-- Make match_id optional in notifications table
ALTER TABLE public.notifications 
  ALTER COLUMN match_id DROP NOT NULL,
  DROP CONSTRAINT notifications_match_id_fkey,
  ADD CONSTRAINT notifications_match_id_fkey 
    FOREIGN KEY (match_id) 
    REFERENCES public.matches(id) 
    ON DELETE CASCADE 
    DEFERRABLE INITIALLY DEFERRED;

-- Update the type check constraint to include 'follow' type
ALTER TABLE public.notifications 
  DROP CONSTRAINT notifications_type_check,
  ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('comment', 'reaction', 'follow'));

-- Update the notify_new_follow function to work with the updated schema
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
