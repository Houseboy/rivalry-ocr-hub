-- Create storage bucket for squad images
INSERT INTO storage.buckets (id, name, public)
VALUES ('squad-images', 'squad-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create squads table
CREATE TABLE IF NOT EXISTS public.squads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  squad_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('FIFA', 'eFootball')),
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for squads table
CREATE POLICY "Users can view their own squads"
  ON public.squads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own squads"
  ON public.squads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own squads"
  ON public.squads
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own squads"
  ON public.squads
  FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for squad images
CREATE POLICY "Squad images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'squad-images');

CREATE POLICY "Users can upload their own squad images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'squad-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own squad images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'squad-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own squad images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'squad-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Trigger for updated_at
CREATE TRIGGER update_squads_updated_at
  BEFORE UPDATE ON public.squads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();