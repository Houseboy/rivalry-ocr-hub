-- Drop the problematic policy
DROP POLICY IF EXISTS "League members are viewable by league participants" ON public.league_members;

-- Create a security definer function to check league membership
CREATE OR REPLACE FUNCTION public.is_league_member(_league_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.league_members
    WHERE league_id = _league_id
      AND user_id = _user_id
  )
$$;

-- Create new policy using the function
CREATE POLICY "League members are viewable by league participants" 
ON public.league_members 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR public.is_league_member(league_id, auth.uid())
);