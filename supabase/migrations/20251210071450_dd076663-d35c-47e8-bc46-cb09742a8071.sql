-- Drop and recreate rivalry_stats view without SECURITY DEFINER
DROP VIEW IF EXISTS public.rivalry_stats;

CREATE VIEW public.rivalry_stats AS
SELECT 
    user_id,
    rival_name,
    count(*) AS total_matches,
    sum(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,
    sum(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) AS draws,
    sum(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) AS losses,
    round((sum(CASE WHEN result = 'win' THEN 1 ELSE 0 END)::numeric / count(*)::numeric) * 100, 1) AS win_rate,
    max(match_date) AS last_played
FROM public.matches
GROUP BY user_id, rival_name;

-- Create app_role enum for user roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Only admins can manage roles (will use the has_role function)
-- We'll add this after creating the function

-- Create has_role function with SECURITY DEFINER to prevent recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Policy: Admins can manage all roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));