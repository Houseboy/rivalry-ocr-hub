import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInput } from './ChatInput';
import { chatService, ChatMessageWithProfile } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Users, Loader2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface LeagueChatProps {
  leagueId: string;
  leagueName: string;
  members: Array<{ 
    id: string; 
    profile?: { 
      id: string; 
      username: string; 
      avatar_url: string; 
    } 
  }>;
}

export const LeagueChat = ({ leagueId, leagueName, members }: LeagueChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessageWithProfile | null>(null);
  const [isMember, setIsMember] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  // Check if user is a league member
  useEffect(() => {
    const checkMembership = async () => {
      try {
        const member = members.find(m => m.id === user?.id);
        setIsMember(!!member);
      } catch (error) {
        console.error('Error checking membership:', error);
      }
    };

    checkMembership();
  }, [members, user]);

  // Load initial messages
  useEffect(() => {
    if (!leagueId || !isMember) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const fetchedMessages = await chatService.getMessages(leagueId);
        setMessages(fetchedMessages.reverse()); // Show oldest first
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [leagueId, isMember]);

  // Set up real-time subscription
  useEffect(() => {
    if (!leagueId || !isMember) return;

    const setupSubscription = async () => {
      try {
        subscriptionRef.current = await chatService.subscribeToChatMessages(
          leagueId,
          (newMessage) => {
            setMessages(prev => [...prev, newMessage]);
            
            // Show notification if user is mentioned
            const isMentioned = newMessage.mentions?.some(
              mention => mention.mentioned_user_id === user?.id
            );
            
            if (isMentioned && newMessage.user_id !== user?.id) {
              toast(`${newMessage.profile?.username} mentioned you in ${leagueName}`, {
                description: newMessage.content.substring(0, 100),
                action: {
                  label: 'View',
                  onClick: () => scrollToBottom(),
                },
              });
            }
          }
        );
      } catch (error) {
        console.error('Error setting up subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [leagueId, isMember, user, leagueName]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }
    }, 100);
  };

  const handleSendMessage = () => {
    setReplyToMessage(null);
    // The actual message sending is handled in ChatInput component
    // This callback is just for resetting reply state
  };

  const handleReply = (message: ChatMessageWithProfile) => {
    setReplyToMessage(message);
    // Focus the input
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  if (!isMember) {
    return (
      <Card className="h-[500px] sm:h-[600px] flex items-center justify-center">
        <CardContent className="text-center p-4 sm:p-6">
          <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">Join League to Chat</h3>
          <p className="text-sm text-muted-foreground">
            You need to be a member of this league to participate in chat.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] sm:h-[600px] flex flex-col">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">League Chat</span>
            <Badge variant="secondary" className="text-xs">
              {members.length} members
            </Badge>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground truncate">
            {leagueName}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages area */}
        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-1 px-3 sm:px-4"
        >
          <div className="space-y-1 py-3 sm:py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-6 sm:py-8 px-4">
                <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Be the first to start the conversation!
                </p>
                <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <p>💡 Tips:</p>
                  <p>• Type @ to mention someone</p>
                  <p>• Upload photos with descriptions</p>
                  <p>• Reply to specific messages</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  isCurrentUser={message.user_id === user?.id}
                  onReply={handleReply}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <ChatInput
          leagueId={leagueId}
          onSendMessage={handleSendMessage}
          replyToMessage={replyToMessage}
          onCancelReply={handleCancelReply}
        />
      </CardContent>
    </Card>
  );
};
