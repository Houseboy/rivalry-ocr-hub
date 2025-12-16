-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create system_updates table for news and updates
CREATE TABLE public.system_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detailed_description TEXT NOT NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('daily', 'weekly', 'general', 'feature', 'improvement', 'fix')),
  what_was_done TEXT NOT NULL,
  why_it_was_done TEXT NOT NULL,
  how_it_improves TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read published updates
CREATE POLICY "Anyone can view published updates"
ON public.system_updates
FOR SELECT
USING (is_published = true);

-- Create trigger for updated_at
CREATE TRIGGER update_system_updates_updated_at
BEFORE UPDATE ON public.system_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();