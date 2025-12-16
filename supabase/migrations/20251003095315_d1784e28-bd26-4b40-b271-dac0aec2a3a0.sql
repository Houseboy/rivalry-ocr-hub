-- Create profiles table for user information
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create matches table for OCR-extracted match data
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rival_name text NOT NULL,
  user_score integer NOT NULL,
  rival_score integer NOT NULL,
  platform text NOT NULL,
  result text NOT NULL CHECK (result IN ('win', 'draw', 'loss')),
  screenshot_url text,
  match_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- OCR extracted detailed stats (optional fields)
  possession integer,
  total_shots integer,
  shots_on_target integer,
  fouls integer,
  offsides integer,
  corner_kicks integer,
  free_kicks integer,
  passes integer,
  successful_passes integer,
  crosses integer,
  interceptions integer,
  tackles integer,
  saves integer,
  
  -- Rival stats
  rival_possession integer,
  rival_total_shots integer,
  rival_shots_on_target integer,
  rival_fouls integer,
  rival_offsides integer,
  rival_corner_kicks integer,
  rival_free_kicks integer,
  rival_passes integer,
  rival_successful_passes integer,
  rival_crosses integer,
  rival_interceptions integer,
  rival_tackles integer,
  rival_saves integer
);

-- Enable RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Matches policies
CREATE POLICY "Users can view their own matches"
  ON public.matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matches"
  ON public.matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matches"
  ON public.matches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matches"
  ON public.matches FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for match screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('match-screenshots', 'match-screenshots', true);

-- Storage policies for match screenshots
CREATE POLICY "Users can view all match screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'match-screenshots');

CREATE POLICY "Users can upload their own screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'match-screenshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own screenshots"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'match-screenshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own screenshots"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'match-screenshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();