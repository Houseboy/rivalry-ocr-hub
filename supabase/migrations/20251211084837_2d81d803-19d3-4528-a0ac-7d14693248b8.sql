-- Create trigger for comment reply notifications
CREATE OR REPLACE TRIGGER on_comment_reply_created
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_comment_reply();

-- Create trigger for post reaction notifications
CREATE OR REPLACE TRIGGER on_post_reaction_created
AFTER INSERT ON public.post_reactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_reaction();

-- Create trigger for post comment notifications
CREATE OR REPLACE TRIGGER on_post_comment_created
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_comment();

-- Create trigger for match reaction notifications
CREATE OR REPLACE TRIGGER on_match_reaction_created
AFTER INSERT ON public.match_reactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_match_reaction();

-- Create trigger for match comment notifications
CREATE OR REPLACE TRIGGER on_match_comment_created
AFTER INSERT ON public.match_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_match_comment();