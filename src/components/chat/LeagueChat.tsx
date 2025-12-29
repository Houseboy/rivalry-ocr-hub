import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInput } from './ChatInput';
import { chatService, ChatMessageWithProfile } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Users, Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false); // Track if messages have been loaded at least once
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is a league member
  useEffect(() => {
    const checkMembership = async () => {
      try {
        const member = members.find(m => m.id === user?.id);
        const isUserMember = !!member;
        setIsMember(isUserMember);
        
        // If user is a member and messages haven't been loaded yet, load them
        if (isUserMember && !messagesLoaded && leagueId) {
          loadMessages();
          setMessagesLoaded(true);
        }
      } catch (error) {
        console.error('Error checking membership:', error);
      }
    };

    checkMembership();
  }, [members, user, leagueId, messagesLoaded]);

  const loadMessages = useCallback(async () => {
    console.log('LeagueChat: Starting message load', { leagueId });
    if (!leagueId) {
      console.log('LeagueChat: Skipping load - missing leagueId');
      return;
    }
    
    try {
      setLoading(true);
      const fetchedMessages = await chatService.getMessages(leagueId);
      console.log('LeagueChat: Messages fetched:', fetchedMessages.length);
      setMessages(fetchedMessages.reverse()); // Show oldest first
      setMessagesLoaded(true); // Mark messages as loaded
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  // Load initial messages when component mounts
  useEffect(() => {
    console.log('LeagueChat: Component mounted', { leagueId, isMember, messagesLoaded });
    
    // Load messages immediately if user is a member
    if (isMember && !messagesLoaded) {
      loadMessages();
    }
  }, [isMember, messagesLoaded, loadMessages]);

  // Refetch messages when component regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('LeagueChat: Visibility changed to:', document.visibilityState);
      if (document.visibilityState === 'visible' && leagueId && isMember) {
        console.log('LeagueChat: Refetching messages due to visibility change');
        loadMessages();
      }
    };

    const handleFocus = () => {
      console.log('LeagueChat: Window focused');
      if (leagueId && isMember) {
        console.log('LeagueChat: Refetching messages due to focus');
        loadMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [leagueId, isMember, loadMessages]);

  // Force refresh messages when leagueId changes
  useEffect(() => {
    if (leagueId) {
      console.log('LeagueChat: LeagueId changed, forcing refresh');
      setMessagesLoaded(false); // Reset loaded state
      if (isMember) {
        loadMessages();
      }
    }
  }, [leagueId, isMember, loadMessages]);

  // Set up real-time subscription
  useEffect(() => {
    if (!leagueId) {
      console.log('Skipping subscription setup - no leagueId');
      return;
    }
    
    if (!isMember) {
      console.log('Skipping subscription - user is not a member');
      return;
    }

    let isMounted = true;
    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        console.log('Setting up real-time subscription for league:', leagueId);
        
        subscription = await chatService.subscribeToChatMessages(
          leagueId,
          (newMessage) => {
            if (!isMounted) return;
            
            console.log('Received new message via real-time:', newMessage);
            setMessages(prev => {
              // Check if message already exists to prevent duplicates
              const messageExists = prev.some(msg => msg.id === newMessage.id);
              if (messageExists) {
                console.log('Message already exists, skipping');
                return prev;
              }
              return [...prev, newMessage];
            });
            
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
        
        if (isMounted) {
          subscriptionRef.current = subscription;
          console.log('Real-time subscription established successfully');
        } else {
          // If component unmounted while setting up, clean up
          subscription.unsubscribe();
        }
      } catch (error) {
        console.error('Error setting up subscription:', error);
        toast.error('Failed to connect to real-time chat');
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (subscription) {
        console.log('Cleaning up real-time subscription');
        subscription.unsubscribe();
        if (subscriptionRef.current === subscription) {
          subscriptionRef.current = null;
        }
      }
    };
  }, [leagueId, isMember, user?.id, leagueName]);

  // Enhanced scroll functionality
  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          if (smooth) {
            scrollElement.scrollTo({
              top: scrollElement.scrollHeight,
              behavior: 'smooth'
            });
          } else {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }
        }
      }
    }, 100);
  };

  // Check if user is at bottom of chat
  const checkIfAtBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        const threshold = 100; // 100px from bottom
        const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
        setIsAtBottom(atBottom);
        setShowScrollToBottom(!atBottom && messages.length > 0);
      }
    }
  };

  // Handle scroll events
  const handleScroll = () => {
    checkIfAtBottom();
  };

  // Auto scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom(false); // No smooth scroll on initial load
    }
  }, [loading, messages.length]);

  // Set up scroll listener
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [messages]);

  // Count unread messages (when not at bottom)
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (!isAtBottom && messages.length > 0) {
      // This is a simplified version - you might want to track the last read message ID
      setUnreadCount(prev => prev + 1);
    } else if (isAtBottom) {
      setUnreadCount(0);
    }
  }, [messages, isAtBottom]);

  const handleReactionUpdate = () => {
    // Refetch messages to update reactions
    loadMessages();
  };

  const handleDeleteMessage = (messageId: string) => {
    // Remove message from local state
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleRefreshMessages = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

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

  const handleSendMessage = () => {
    setReplyToMessage(null);
    // The actual message sending is handled in ChatInput component
    // This callback is just for resetting reply state
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
          <div className="flex items-center gap-2">
            <div className="text-xs sm:text-sm text-muted-foreground truncate">
              {leagueName}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshMessages}
              className="h-7 w-7 p-0 hover:bg-muted"
              disabled={loading}
            >
              <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 relative overflow-hidden">
          <ScrollArea 
            ref={scrollAreaRef}
            className="h-full px-3 sm:px-4"
          >
            <div className="py-3 sm:py-4 min-h-full">
              {/* Scroll to bottom button */}
              {showScrollToBottom && (
                <div className="fixed bottom-20 right-6 z-50">
                  <Button
                    onClick={() => {
                      scrollToBottom(true);
                      setUnreadCount(0);
                    }}
                    size="sm"
                    className="shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-8 w-8 p-0 relative"
                  >
                    <ChevronDown className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </div>
              )}

              <div className="space-y-2 max-w-full">
                {/* New messages indicator */}
                {!isAtBottom && messages.length > 0 && (
                  <div className="text-center py-2">
                    <Badge variant="secondary" className="text-xs">
                      New messages below
                    </Badge>
                  </div>
                )}
                
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
                  <>
                    {messages.map((message) => (
                      <ChatMessageBubble
                        key={message.id}
                        message={message}
                        isCurrentUser={message.user_id === user?.id}
                        onReply={handleReply}
                        onReactionUpdate={handleReactionUpdate}
                        onDeleteMessage={handleDeleteMessage}
                      />
                    ))}
                    {/* Invisible element for scroll reference */}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

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
