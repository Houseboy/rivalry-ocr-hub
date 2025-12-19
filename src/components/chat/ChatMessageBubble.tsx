import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ChatMessageWithProfile } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { MessageCircle, Image, Reply } from 'lucide-react';

interface ChatMessageBubbleProps {
  message: ChatMessageWithProfile;
  isCurrentUser: boolean;
  onReply?: (message: ChatMessageWithProfile) => void;
}

export const ChatMessageBubble = ({ message, isCurrentUser, onReply }: ChatMessageBubbleProps) => {
  const { user } = useAuth();

  const isMentioned = message.mentions?.some(mention => mention.mentioned_user_id === user?.id);
  const mentionedUsernames = message.mentions?.map(m => m.mentioned_profile?.username).filter(Boolean) || [];

  const formatContentWithMentions = (content: string) => {
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
    const formattedContent = formatContentWithMentions(message.content);
    
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
  };

  return (
    <div className={cn(
      "flex gap-2 mb-3 group",
      isCurrentUser && "flex-row-reverse"
    )}>
      <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
        <AvatarImage src={message.profile?.avatar_url || undefined} />
        <AvatarFallback className="text-xs">
          {message.profile?.username?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      <div className={cn(
        "flex-1 min-w-0",
        isCurrentUser && "flex flex-col items-end"
      )}>
        <div className="flex items-center gap-1 sm:gap-2 mb-1">
          {!isCurrentUser && (
            <span className="text-xs sm:text-sm font-medium truncate">
              {message.profile?.username || "Unknown"}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {message.message_type === 'photo' && (
            <Image className="w-3 h-3 text-muted-foreground" />
          )}
          {message.reply_to_id && (
            <Reply className="w-3 h-3 text-muted-foreground" />
          )}
        </div>

        <Card className={cn(
          "relative overflow-hidden",
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
              <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                {renderContent()}
              </div>
            )}

            {message.message_type === 'photo' && (
              <div className="space-y-2">
                {message.photo_url && (
                  <img 
                    src={message.photo_url} 
                    alt="Chat photo" 
                    className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(message.photo_url, '_blank')}
                  />
                )}
                {message.photo_description && (
                  <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                    {renderContent()}
                  </div>
                )}
              </div>
            )}

            {isMentioned && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4 bg-primary text-primary-foreground"
              >
                Mentioned
              </Badge>
            )}
          </CardContent>
        </Card>

        {!isCurrentUser && onReply && (
          <button
            onClick={() => onReply(message)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground mt-1"
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
};
