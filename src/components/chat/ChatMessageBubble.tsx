import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ChatMessageWithProfile } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { MessageCircle, Image, Reply } from 'lucide-react';
import { MessageReactions } from './MessageReactions';

interface ChatMessageBubbleProps {
  message: ChatMessageWithProfile;
  isCurrentUser: boolean;
  onReply?: (message: ChatMessageWithProfile) => void;
  onReactionUpdate?: () => void;
  onDeleteMessage?: (messageId: string) => void;
}

export const ChatMessageBubble = ({ 
  message, 
  isCurrentUser, 
  onReply, 
  onReactionUpdate, 
  onDeleteMessage 
}: ChatMessageBubbleProps) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isMentioned = message.mentions?.some(mention => mention.mentioned_user_id === user?.id);
  const mentionedUsernames = message.mentions?.map(m => m.mentioned_profile?.username).filter(Boolean) || [];

  const formatContentWithMentions = (content: string) => {
    if (!content) return '';
    
    let formattedContent = content;
    
    mentionedUsernames.forEach(username => {
      if (username) {
        const mentionRegex = new RegExp(`@${username}`, 'g');
        formattedContent = formattedContent.replace(mentionRegex, `**@${username}**`);
      }
    });

    return formattedContent;
  };

  const renderContent = () => {
    try {
      const formattedContent = formatContentWithMentions(message.content || '');
      
      // Simple markdown parser for mentions and basic formatting
      const parts = formattedContent.split(/(\*\*[^*]+\*\*)/g);
      
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={index} className="font-semibold text-primary bg-primary/10 px-1 rounded">
              {part.slice(2, -2)}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      });
    } catch (error) {
      console.error('Error rendering content:', error);
      return <span>{message.content || ''}</span>;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'just now';
    }
  };

  return (
    <div 
      className={cn(
        "flex gap-2 mb-3 group w-full",
        isCurrentUser && "flex-row-reverse"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setShowActions(!showActions)}
    >
      <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex-shrink-0">
        <AvatarImage src={message.profile?.avatar_url || undefined} />
        <AvatarFallback className="text-xs">
          {message.profile?.username?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      <div className={cn(
        "flex-1 min-w-0 max-w-full",
        isCurrentUser && "flex flex-col items-end"
      )}>
        <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
          {!isCurrentUser && (
            <span className="text-xs sm:text-sm font-medium truncate">
              {message.profile?.username || "Unknown"}
            </span>
          )}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTime(message.created_at)}
          </span>
          {message.message_type === 'photo' && (
            <Image className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
          {message.reply_to_id && (
            <Reply className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
        </div>

        <Card className={cn(
          "relative overflow-hidden max-w-full",
          "break-words", // Ensure long words break
          isCurrentUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted",
          isMentioned && "ring-2 ring-primary/50 ring-offset-2"
        )}>
          <CardContent className="p-2 sm:p-3">
            {message.reply_to_id && (
              <div className="mb-2 p-1 sm:p-2 bg-background/10 rounded text-xs opacity-80">
                <Reply className="w-3 h-3 inline mr-1" />
                Replying to a message
              </div>
            )}

            {message.message_type === 'text' && (
              <div className="text-xs sm:text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {renderContent()}
              </div>
            )}

            {message.message_type === 'photo' && (
              <div className="space-y-2">
                {message.photo_url && (
                  <div className="relative group">
                    <img 
                      src={message.photo_url} 
                      alt="Chat photo" 
                      className="rounded-lg cursor-pointer hover:opacity-90 transition-all duration-200 block w-full h-auto object-cover"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        width: 'auto',
                        height: 'auto'
                      }}
                      onClick={() => {
                        try {
                          window.open(message.photo_url, '_blank');
                        } catch (error) {
                          console.error('Error opening photo:', error);
                        }
                      }}
                      loading="lazy"
                    />
                    {/* Hover overlay for better UX */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-lg pointer-events-none flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-2">
                        <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                {message.photo_description && (
                  <div className="text-xs sm:text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {renderContent()}
                  </div>
                )}
              </div>
            )}

            {isMentioned && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4 bg-primary text-primary-foreground flex-shrink-0"
              >
                Mentioned
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Message Reactions */}
        <MessageReactions
          message={message}
          onReactionUpdate={onReactionUpdate || (() => {})}
          onDeleteMessage={onDeleteMessage || (() => {})}
          showActions={isHovered || showActions}
        />

        {!isCurrentUser && onReply && (
          <button
            onClick={() => onReply(message)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground mt-1 flex-shrink-0"
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
};
