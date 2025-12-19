-- League Chat Messages Table
CREATE TABLE IF NOT EXISTS league_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'photo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reply_to_id UUID REFERENCES league_chat_messages(id) ON DELETE SET NULL,
  photo_url TEXT,
  photo_description TEXT
);

-- League Chat Mentions Table
CREATE TABLE IF NOT EXISTS league_chat_mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES league_chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_league_chat_messages_league_id ON league_chat_messages(league_id);
CREATE INDEX IF NOT EXISTS idx_league_chat_messages_user_id ON league_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_league_chat_messages_created_at ON league_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_league_chat_mentions_message_id ON league_chat_mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_league_chat_mentions_user_id ON league_chat_mentions(mentioned_user_id);

-- Enable Row Level Security
ALTER TABLE league_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_chat_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for league_chat_messages
CREATE POLICY "Users can view messages from their leagues" ON league_chat_messages
  FOR SELECT USING (
    league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their leagues" ON league_chat_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON league_chat_messages
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON league_chat_messages
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for league_chat_mentions
CREATE POLICY "Users can view mentions from their leagues" ON league_chat_mentions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM league_chat_messages 
      WHERE league_id IN (
        SELECT league_id FROM league_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert mentions in their leagues" ON league_chat_mentions
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM league_chat_messages 
      WHERE league_id IN (
        SELECT league_id FROM league_members WHERE user_id = auth.uid()
      )
    )
  );

-- Storage bucket for chat photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-photos', 
  'chat-photos', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage
CREATE POLICY "Users can upload photos to their leagues" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view photos from their leagues" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-photos' AND
    auth.role() = 'authenticated'
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_league_chat_messages_updated_at
  BEFORE UPDATE ON league_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
