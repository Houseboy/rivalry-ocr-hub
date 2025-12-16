# Football Rivalry Tracker - System Documentation

## 1. System Overview

### Purpose
The Football Rivalry Tracker is a comprehensive social platform designed for football/soccer gaming enthusiasts to track their matches, analyze performance, build rivalries, and engage with a community of fellow players. The system bridges the gap between casual gameplay and competitive analysis by providing tools for match logging, statistical tracking, and social interaction.

### Target Users
- FIFA/FC players across multiple platforms (PS, Xbox, PC)
- Competitive football gamers looking to track their performance
- Players who want to build and maintain rivalries with opponents
- Gaming communities focused on football simulation games

---

## 2. Core Features

### 2.1 Authentication & User Management
- **Email/Password Authentication**: Secure signup and login system
- **Auto-confirm Email**: Streamlined onboarding without email verification delays
- **User Profiles**: Customizable profiles with avatars, bios, favorite teams, and playstyles
- **Rank Points System**: Progression tracking based on match performance

### 2.2 Match Tracking System
- **Manual Match Entry**: Users can manually log match results
- **OCR Screenshot Analysis**: AI-powered extraction of match statistics from game screenshots
- **Comprehensive Statistics**: Tracks 20+ match metrics including:
  - Possession, shots, shots on target
  - Passes, successful passes, crosses
  - Fouls, offsides, corner kicks
  - Tackles, interceptions, saves
  - And more
- **Multi-Platform Support**: Track matches across PS, Xbox, and PC
- **Match History**: Complete historical record of all logged matches

### 2.3 AI-Powered Features
- **Caption Analysis**: AI analyzes video captions to extract relevant tags
- **Match Screenshot Processing**: Advanced OCR to extract detailed match statistics from game screenshots
- **Intelligent Data Extraction**: Automatically identifies user scores, rival scores, and performance metrics

### 2.4 Social Feed
- **Video Uploads**: Share gameplay highlights and memorable moments
- **Post Creation**: Create posts with captions and tags
- **Media Support**: Image and video content support
- **Reactions System**: Express engagement with 4 reaction types (like, fire, clap, trophy)
- **Comments**: Engage in discussions on posts and matches
- **Real-time Updates**: Live feed of community activity

### 2.5 Rivalry System
- **Automatic Rivalry Tracking**: System automatically tracks repeated opponents
- **Head-to-Head Statistics**: Win/loss/draw records against specific rivals
- **Win Rate Calculation**: Percentage-based performance against each rival
- **Rivalry Overview**: Dashboard showing top rivalries and balanced matchups
- **Historical Data**: Complete match history with each rival

### 2.6 Analytics Dashboard
- **Performance Trends**: Visual charts showing performance over time
- **Recent Form**: Track win/draw/loss patterns in recent matches
- **Platform Distribution**: Analyze match distribution across gaming platforms
- **Goals Trend**: Compare goals scored vs. goals conceded
- **Career Statistics**: Lifetime stats including matches played, wins, draws, losses

### 2.7 League System
- **Global Rankings**: Leaderboard based on points system
- **Points Calculation**: Win (3 pts), Draw (1 pt), Loss (0 pts)
- **Goal Difference**: Tiebreaker for equal points
- **Player Statistics**: View detailed stats for all ranked players
- **Minimum Threshold**: Requires players to have logged matches to appear

### 2.8 Squad Management
- **Multiple Squads**: Create and manage different team setups
- **Platform-Specific Squads**: Organize squads by gaming platform
- **Squad Images**: Upload visual representations of team formations
- **Primary Squad Selection**: Designate your main squad

### 2.9 Achievements & Badges
- **Achievement System**: Unlock badges based on performance milestones
- **Achievement Types**: Various categories for different accomplishments
- **Progress Tracking**: Monitor achievement progress over time

### 2.10 Notifications System
- **Real-time Notifications**: Get notified about:
  - Comments on your matches/posts
  - Reactions to your content
  - New rivals and rivalry updates
- **Notification Center**: Centralized hub for all activity
- **Read/Unread Status**: Track which notifications you've seen

---

## 3. Technical Architecture

### 3.1 Frontend Stack
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM 6.30.1
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn UI component library
- **State Management**: React hooks and Context API
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Animations**: Tailwind CSS animations

### 3.2 Backend Architecture (Lovable Cloud/Supabase)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email/password
- **Storage**: Three public buckets:
  - `match-screenshots`: For OCR-analyzed match images
  - `squad-images`: For team formation images
  - `video-uploads`: For user-uploaded gameplay videos
- **Edge Functions**: Serverless functions for:
  - `analyze-caption`: AI-powered caption analysis
  - `process-match-screenshot`: OCR and data extraction from screenshots
- **Real-time**: Supabase Realtime for live updates

### 3.3 Database Schema

#### Tables
1. **profiles**: User profile information
   - username, avatar_url, bio, favorite_team, playstyle
   - rank_points, privacy settings, theme preferences

2. **matches**: Core match data
   - user_score, rival_score, rival_name, platform, result
   - Comprehensive statistics (20+ fields)
   - screenshot_url, match_date

3. **posts**: User-generated content
   - caption, tags, type (image/video), url
   - Relations to reactions and comments

4. **post_reactions** & **match_reactions**: Engagement tracking
   - reaction_type (like, fire, clap, trophy)
   - user_id, timestamp

5. **post_comments** & **match_comments**: Discussion threads
   - content, user_id, timestamps

6. **squads**: Team management
   - squad_name, platform, image_url, is_primary

7. **achievements**: User accomplishments
   - achievement_type, title, description, icon, earned_at

8. **notifications**: Activity alerts
   - type, actor_id, content, reaction_type, is_read

9. **rivalry_stats** (View): Aggregated rivalry statistics
   - Calculated wins, losses, draws, win_rate per rival

---

## 4. Component Architecture

### 4.1 Page Components

#### `/src/pages/Home.tsx`
- Main feed displaying matches and posts
- Integrates FeedCard and PostCard components
- Real-time content loading
- Authenticated access only

#### `/src/pages/Profile.tsx`
- User profile dashboard
- Sections: Header, Stats, Performance Trends, Rivalries, Match History, Achievements, Squad Manager, Gallery
- Tab-based navigation
- Profile editing capabilities

#### `/src/pages/Analytics.tsx`
- Performance analytics dashboard
- Visual charts and statistics
- Historical data analysis

#### `/src/pages/League.tsx`
- Global leaderboard
- Points and rankings system
- Player statistics display

#### `/src/pages/Auth.tsx`
- Login/Signup forms
- Email/password authentication
- Form validation with Zod

#### `/src/pages/NotFound.tsx`
- 404 error page
- Navigation back to home

### 4.2 Core Components

#### Navigation Components
- **`Navigation.tsx`**: Main navigation bar with auth-aware routing
- **`ProtectedRoute.tsx`**: Route guard for authenticated pages

#### Feed Components
- **`FeedCard.tsx`**: Display match details with reactions/comments
- **`PostCard.tsx`**: Display posts with media, reactions, comments
- **`VideoPlayer.tsx`**: Custom video player with controls
- **`ReactionBar.tsx`**: Reaction buttons with real-time counts
- **`CommentSection.tsx`**: Comment thread with add/delete functionality

#### Profile Components
- **`ProfileHeader.tsx`**: User info, avatar, rank, edit button
- **`CareerStats.tsx`**: Lifetime statistics display
- **`PerformanceTrends.tsx`**: Chart-based performance visualization
- **`RivalriesOverview.tsx`**: Top rivalries summary
- **`MatchHistoryFeed.tsx`**: Chronological match list
- **`AchievementsBadges.tsx`**: Achievement display grid
- **`SquadManager.tsx`**: Squad creation and management
- **`GalleryTab.tsx`**: Media gallery view
- **`EditProfileDialog.tsx`**: Profile editing modal
- **`NotificationsBell.tsx`**: Notification center dropdown

#### Upload Components
- **`VideoUpload.tsx`**: Video upload with caption input
- **`OCRUpload.tsx`**: Screenshot upload with AI processing

#### Utility Components
- **`MatchCard.tsx`**: Match display card
- **`StatsCard.tsx`**: Statistics display card
- **`EmptyState.tsx`**: Empty state placeholder

### 4.3 UI Component Library
Shadcn UI components (40+ components) including:
- Button, Input, Textarea, Select
- Dialog, Sheet, Drawer
- Card, Avatar, Badge
- Tabs, Accordion, Collapsible
- Chart, Progress, Slider
- Toast notifications (Sonner)
- And many more...

---

## 5. Data Flow & Integration

### 5.1 Authentication Flow
```
User Input → AuthContext → Supabase Auth → Session Management → Profile Creation
```
1. User enters credentials in Auth.tsx
2. AuthContext handles authentication state
3. Supabase validates and creates session
4. Trigger automatically creates profile entry
5. User redirected to protected routes

### 5.2 Match Upload Flow
```
Screenshot Upload → Edge Function (OCR) → Database Insert → Feed Display
```
1. User uploads screenshot in OCRUpload component
2. File stored in `match-screenshots` bucket
3. Edge function `process-match-screenshot` analyzes image using AI
4. Extracted data inserted into matches table
5. Real-time update triggers feed refresh

### 5.3 Video Upload Flow
```
Video Selection → Caption Input → Storage Upload → Post Creation → Feed Display
```
1. User selects video and writes caption in VideoUpload
2. Video uploaded to `video-uploads` bucket
3. Post record created in posts table
4. Feed displays new post with VideoPlayer component

### 5.4 Social Interaction Flow
```
User Action → Component → Supabase Client → Database → Trigger → Notification
```
1. User reacts/comments via ReactionBar or CommentSection
2. Component calls Supabase client methods
3. Database updated with RLS policy enforcement
4. Database trigger creates notification
5. Notification appears in recipient's NotificationsBell

### 5.5 Analytics Calculation Flow
```
Match Data → Database Aggregation → View/Query → Chart Rendering
```
1. Matches stored with comprehensive statistics
2. rivalry_stats view aggregates data
3. Components query aggregated data
4. Recharts renders visual representations

---

## 6. Security Architecture

### 6.1 Row Level Security (RLS) Policies

#### Profiles
- Anyone can view profiles (public data)
- Users can only insert/update their own profile

#### Matches
- Anyone can view matches (public leaderboard)
- Users can only insert/update/delete their own matches

#### Posts
- Anyone can view posts (public feed)
- Users can only manage their own posts

#### Comments & Reactions
- Anyone can view
- Users can only manage their own comments/reactions

#### Notifications
- Users can only view their own notifications
- Users can only mark their own notifications as read

#### Squads & Achievements
- Users can only view and manage their own data

### 6.2 Authentication Guards
- ProtectedRoute component wraps authenticated pages
- AuthContext provides authentication state
- Automatic redirect to auth page for unauthenticated users

### 6.3 Storage Security
- Public buckets for read access
- RLS policies control write access
- User-specific folders in storage paths

---

## 7. AI Integration

### 7.1 Lovable AI Gateway
- Pre-configured access to AI models
- No API key management required
- Supported models:
  - Google Gemini models (2.5-pro, 2.5-flash, 2.5-flash-lite)
  - OpenAI GPT models (gpt-5, gpt-5-mini, gpt-5-nano)

### 7.2 Edge Functions Using AI

#### `analyze-caption`
- Analyzes video captions for relevance
- Extracts tags from content
- Currently allows all captions (validation removed)

#### `process-match-screenshot`
- Advanced OCR for game screenshots
- Extracts detailed match statistics
- Maps data to database schema
- Returns structured JSON

---

## 8. Design System

### 8.1 Theme Structure
- CSS variables in `src/index.css`
- Semantic tokens for colors, spacing, typography
- Dark/light mode support
- HSL color format for consistency

### 8.2 Component Variants
- Shadcn components with custom variants
- Consistent styling across application
- Tailwind utility classes
- Responsive design patterns

### 8.3 Typography
- Custom font selections
- Hierarchical text styles
- Semantic heading structure

---

## 9. Future Enhancement Opportunities

### Potential Features
1. **Real-time Multiplayer**: Live match tracking during gameplay
2. **Tournament System**: Create and manage competitive tournaments
3. **Team Management**: Create teams with multiple players
4. **Voice Chat Integration**: In-app communication
5. **Streaming Integration**: Connect with Twitch/YouTube
6. **Advanced Analytics**: ML-powered performance predictions
7. **Mobile App**: Native iOS/Android applications
8. **Replay System**: Store and analyze full match replays
9. **Coaching Tools**: AI-powered improvement suggestions
10. **Betting/Prediction System**: Friendly wagers on matches

### Scalability Considerations
- Database indexing optimization
- CDN integration for media delivery
- Caching strategies for frequently accessed data
- Microservices architecture for heavy features
- Rate limiting for API endpoints

---

## 10. Development & Deployment

### 10.1 Development Environment
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### 10.2 Deployment
- Frontend: Automatic deployment via Lovable
- Backend: Edge functions auto-deploy with code changes
- Database: Migrations applied automatically
- Storage: Configured through Lovable Cloud UI

### 10.3 Environment Variables
- `VITE_SUPABASE_URL`: Backend API URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Public API key
- Edge function secrets managed via Lovable secrets system

---

## 11. Conclusion

The Football Rivalry Tracker is a full-stack social gaming platform that successfully combines match tracking, social networking, and competitive analysis. With its AI-powered features, comprehensive statistics tracking, and engaging social features, it provides football gaming enthusiasts with a unique platform to enhance their gaming experience and connect with fellow players.

The system's modular architecture, robust security model, and scalable infrastructure position it well for future growth and feature expansion.
