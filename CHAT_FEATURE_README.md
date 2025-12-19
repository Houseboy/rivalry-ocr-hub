# League Chat Feature

A comprehensive real-time chat system for league members with modern UI and advanced features.

## 🚀 Features

### Core Functionality
- **Real-time messaging** - Instant message delivery using Supabase subscriptions
- **Text messages** - Full markdown support with proper formatting
- **Photo uploads** - Share images with descriptions (5MB limit)
- **@Mentions** - Tag users with autocomplete and visual highlights
- **Reply threading** - Reply to specific messages with context
- **In-chat notifications** - Toast alerts when mentioned

### Security & Access
- **League member only** - Non-members see join prompt
- **Row Level Security** - Users only see their league's messages
- **File restrictions** - 5MB limit, image types only
- **Mention notifications** - Only for league members

### UI/UX
- **WhatsApp-style bubbles** - Clean, familiar message layout
- **Mobile-first design** - Responsive for all devices
- **Dark/light theme** - Matches app theme
- **Auto-scroll** - Always see newest messages
- **Loading states** - Smooth transitions and feedback

## 🛠️ Setup Instructions

### 1. Database Setup

Run the SQL migration in your Supabase SQL editor:

```sql
-- Copy contents from: supabase/migrations/20241219_league_chat.sql
```

Or run the setup script:
```bash
node scripts/setup-chat-db.js
```

### 2. Storage Bucket

The migration creates a `chat-photos` storage bucket automatically with:
- Public access enabled
- 5MB file size limit
- Image MIME types only (JPEG, PNG, GIF, WebP)

### 3. Integration

The chat is automatically integrated into the LeagueDashboard with a new "Chat" tab.

## 📱 Usage

### For League Members
1. Navigate to any league you're a member of
2. Click the "Chat" tab
3. Start chatting immediately

### Sending Messages
- **Text**: Type and press Enter or click Send
- **Photos**: Click the image icon to upload
- **@Mentions**: Type @username to tag someone
- **Replies**: Click Reply on any message

### Mobile Experience
- **Touch-friendly buttons** and optimized spacing
- **Compact layout** for smaller screens
- **Swipe gestures** supported in scroll areas

## 🔧 Technical Details

### Architecture
- **Frontend**: React with TypeScript
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Storage**: Supabase Storage for photos
- **UI**: TailwindCSS + shadcn/ui components

### Database Schema
```sql
league_chat_messages
├── id (UUID, Primary Key)
├── league_id (UUID, Foreign Key)
├── user_id (UUID, Foreign Key)
├── content (TEXT)
├── message_type (ENUM: text, photo)
├── reply_to_id (UUID, Foreign Key, Optional)
├── photo_url (TEXT, Optional)
├── photo_description (TEXT, Optional)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

league_chat_mentions
├── id (UUID, Primary Key)
├── message_id (UUID, Foreign Key)
├── mentioned_user_id (UUID, Foreign Key)
└── created_at (TIMESTAMP)
```

### Security Policies
- **RLS enabled** on all tables
- **League member verification** for all operations
- **User ownership checks** for message updates/deletes
- **Storage policies** for photo uploads

## 🎨 Components

### ChatMessageBubble
- WhatsApp-style message display
- Mention highlighting
- Photo preview with click-to-view
- Reply indicators
- Mobile responsive

### ChatInput
- Smart @mention autocomplete
- Photo upload with preview
- Reply context
- Character limits
- Mobile optimized

### LeagueChat
- Full chat interface
- Real-time updates
- Member access control
- Empty states
- Loading indicators

## 🚀 Performance

### Optimizations
- **Indexed queries** for fast message retrieval
- **Lazy loading** for message history
- **Efficient subscriptions** with proper cleanup
- **Image compression** for photos
- **Debounced input** for mention search

### Caching
- **Profile caching** for user avatars/names
- **Message pagination** for large histories
- **Subscription management** to prevent memory leaks

## 🔍 Troubleshooting

### Common Issues

**Messages not loading**
- Check database migration was applied
- Verify user is league member
- Check network connection

**@Mentions not working**
- Ensure user profiles exist
- Check username spelling
- Verify league membership

**Photo uploads failing**
- Check file size (max 5MB)
- Verify file type (images only)
- Check storage bucket permissions

**Real-time updates not working**
- Verify Supabase realtime enabled
- Check network connection
- Ensure user is authenticated

### Debug Mode
Enable debug logging in browser console:
```javascript
localStorage.setItem('debug', 'chat:*');
```

## 📈 Future Enhancements

### Planned Features
- **Message reactions** (emoji responses)
- **Message editing** and deletion
- **File sharing** (documents, videos)
- **Voice messages**
- **Message search**
- **Online status indicators**
- **Typing indicators**
- **Push notifications**

### Performance
- **Message caching** with Redis
- **CDN integration** for photos
- **WebP conversion** for images
- **Lazy loading** for older messages

## 🤝 Contributing

### Code Style
- TypeScript strict mode enabled
- ESLint rules enforced
- Prettier formatting
- Component documentation

### Testing
- Unit tests for services
- Integration tests for components
- E2E tests for user flows
- Performance testing

---

**Chat feature successfully implemented and ready for production! 🎉**
