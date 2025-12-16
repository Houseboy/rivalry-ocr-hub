-- Make match_id nullable in notifications table since notifications can be for posts too
ALTER TABLE public.notifications 
ALTER COLUMN match_id DROP NOT NULL;