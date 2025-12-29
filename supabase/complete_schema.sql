-- Complete Database Schema for Rivalry OCR Hub
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE message_type AS ENUM ('text', 'system', 'photo');
CREATE TYPE reaction_type AS ENUM ('like', 'fire', 'clap', 'trophy');

-- Core Tables
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    favorite_team VARCHAR(255),
    playstyle VARCHAR(255),
    rank_points INTEGER DEFAULT 0,
    privacy_public BOOLEAN DEFAULT true,
    theme_preference VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    platform VARCHAR(50) NOT NULL,
    result VARCHAR(20) NOT NULL, -- 'win', 'draw', 'loss'
    user_score INTEGER NOT NULL,
    rival_score INTEGER NOT NULL,
    rival_name VARCHAR(255) NOT NULL,
    
    -- Match Statistics
    possession INTEGER,
    rival_possession INTEGER,
    total_shots INTEGER,
    rival_total_shots INTEGER,
    shots_on_target INTEGER,
    rival_shots_on_target INTEGER,
    passes INTEGER,
    rival_passes INTEGER,
    successful_passes INTEGER,
    rival_successful_passes INTEGER,
    crosses INTEGER,
    rival_crosses INTEGER,
    fouls INTEGER,
    rival_fouls INTEGER,
    offsides INTEGER,
    rival_offsides INTEGER,
    corner_kicks INTEGER,
    rival_corner_kicks INTEGER,
    free_kicks INTEGER,
    rival_free_kicks INTEGER,
    tackles INTEGER,
    rival_tackles INTEGER,
    interceptions INTEGER,
    rival_interceptions INTEGER,
    saves INTEGER,
    rival_saves INTEGER,
    
    screenshot_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    league_type VARCHAR(50) NOT NULL,
    selected_team VARCHAR(255) NOT NULL,
    join_code VARCHAR(10) UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT false,
    max_participants INTEGER DEFAULT 16,
    tournament_mode VARCHAR(50),
    current_phase VARCHAR(50),
    gameweeks_count INTEGER,
    tier INTEGER DEFAULT 1,
    is_ranked BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS league_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    team VARCHAR(255),
    position INTEGER,
    performance_data JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, user_id)
);

CREATE TABLE IF NOT EXISTS league_fixtures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    gameweek INTEGER,
    home_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    away_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    home_team VARCHAR(255),
    away_team VARCHAR(255),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS league_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fixture_id UUID REFERENCES league_fixtures(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    home_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    away_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    screenshot_url TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Features
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'video',
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type reaction_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type reaction_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, user_id)
);

CREATE TABLE IF NOT EXISTS match_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- League Chat System
CREATE TABLE IF NOT EXISTS league_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    reply_to_id UUID REFERENCES league_chat_messages(id) ON DELETE CASCADE,
    photo_url TEXT,
    photo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS league_chat_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES league_chat_messages(id) ON DELETE CASCADE,
    mentioned_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow System
CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    content TEXT,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament Brackets
CREATE TABLE IF NOT EXISTS tournament_brackets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    round VARCHAR(50) NOT NULL,
    match_number INTEGER NOT NULL,
    group_name VARCHAR(50),
    home_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    away_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    home_team VARCHAR(50),
    away_team VARCHAR(50),
    home_score INTEGER,
    away_score INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    winner_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    achievement_type VARCHAR(100) NOT NULL,
    icon TEXT,
    earned_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, title)
);

-- Squads
CREATE TABLE IF NOT EXISTS squads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    squad_name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Updates
CREATE TABLE IF NOT EXISTS system_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    detailed_description TEXT NOT NULL,
    what_was_done TEXT NOT NULL,
    why_it_was_done TEXT NOT NULL,
    how_it_improves TEXT NOT NULL,
    update_type VARCHAR(50) NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Views
CREATE OR REPLACE VIEW rivalry_stats AS
SELECT 
    user_id,
    rival_name,
    COUNT(*) as total_matches,
    SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
    SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
    ROUND(
        (SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
    ) as win_rate,
    MAX(match_date) as last_played
FROM matches 
GROUP BY user_id, rival_name;

CREATE OR REPLACE VIEW league_standings AS
SELECT 
    lm.league_id,
    lm.user_id,
    p.username,
    lm.team,
    COUNT(lr.id) as played,
    SUM(CASE WHEN lr.home_score > lr.away_score AND lr.home_user_id = lm.user_id THEN 3
             WHEN lr.home_score < lr.away_score AND lr.away_user_id = lm.user_id THEN 3
             WHEN lr.home_score = lr.away_score THEN 1
             ELSE 0 END) as points,
    SUM(CASE WHEN lr.home_score > lr.away_score AND lr.home_user_id = lm.user_id THEN 1
             WHEN lr.home_score < lr.away_score AND lr.away_user_id = lm.user_id THEN 1
             ELSE 0 END) as wins,
    SUM(CASE WHEN lr.home_score = lr.away_score THEN 1 ELSE 0 END) as draws,
    SUM(CASE WHEN lr.home_score < lr.away_score AND lr.home_user_id = lm.user_id THEN 1
             WHEN lr.home_score > lr.away_score AND lr.away_user_id = lm.user_id THEN 1
             ELSE 0 END) as losses,
    SUM(CASE WHEN lr.home_user_id = lm.user_id THEN lr.home_score ELSE lr.away_score END) as goals_for,
    SUM(CASE WHEN lr.home_user_id = lm.user_id THEN lr.away_score ELSE lr.home_score END) as goals_against,
    (SUM(CASE WHEN lr.home_user_id = lm.user_id THEN lr.home_score ELSE lr.away_score END) - 
     SUM(CASE WHEN lr.home_user_id = lm.user_id THEN lr.away_score ELSE lr.home_score END)) as goal_difference,
    p.avatar_url
FROM league_members lm
LEFT JOIN profiles p ON lm.user_id = p.id
LEFT JOIN league_results lr ON lm.league_id = lr.league_id AND (lr.home_user_id = lm.user_id OR lr.away_user_id = lm.user_id)
GROUP BY lm.league_id, lm.user_id, p.username, lm.team, p.avatar_url
ORDER BY points DESC, goal_difference DESC, goals_for DESC;

-- Functions
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = _user_id AND role = _role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_league_member(_league_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM league_members 
        WHERE league_id = _league_id AND user_id = _user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_user_date ON matches(user_id, match_date DESC);
CREATE INDEX IF NOT EXISTS idx_league_members_league ON league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_league_chat_messages_league ON league_chat_messages(league_id, created_at);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own matches" ON matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own matches" ON matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own matches" ON matches FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Leagues are viewable by everyone" ON leagues FOR SELECT USING (true);
CREATE POLICY "Users can create leagues" ON leagues FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "League members viewable by league members" ON league_members FOR SELECT USING (
    is_league_member(league_id, auth.uid())
);
CREATE POLICY "Users can join leagues" ON league_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default system data
INSERT INTO system_updates (title, summary, detailed_description, what_was_done, why_it_was_done, how_it_improves, update_type, is_published)
VALUES (
    'System Launch',
    'Rivalry OCR Hub is now live!',
    'Complete football rivalry tracking system with OCR capabilities, league management, and social features.',
    'Deployed full database schema, authentication system, and frontend application.',
    'To provide comprehensive football gaming tracking and community features.',
    'Enables detailed match tracking, league organization, and social interaction for football gamers.',
    'major',
    true
) ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully! Your Rivalry OCR Hub database is ready.';
END $$;
