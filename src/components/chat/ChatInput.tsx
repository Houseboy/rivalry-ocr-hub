import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Send, 
  Image, 
  X, 
  AtSign,
  Loader2 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, ChatMessageInput } from '@/services/chatService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ChatInputProps {
  leagueId: string;
  onSendMessage: () => void;
  replyToMessage?: {
    id: string;
    content: string;
    profile?: Profile;
  } | null;
  onCancelReply: () => void;
}

export const ChatInput = ({ 
  leagueId, 
  onSendMessage, 
  replyToMessage, 
  onCancelReply 
}: ChatInputProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{ id: string; username: string | null; avatar_url: string | null }>>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch league members for mentions
  useEffect(() => {
    if (leagueId) {
      chatService.getLeagueMembers(leagueId).then(members => {
        setMentionSuggestions(members.map(m => ({
          id: m.id,
          username: m.username,
          avatar_url: m.avatar_url,
          bio: '',
          created_at: '',
          favorite_team: '',
          playstyle: '',
          privacy_public: false,
          rank_points: 0,
          theme_preference: '',
          updated_at: ''
        })));
      });
    }
  }, [leagueId]);

  // Handle mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setMessage(value);
    setCursorPosition(cursorPos);

    // Check if we're typing a mention
    const beforeCursor = value.substring(0, cursorPos);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  // Filter mention suggestions
  const filteredSuggestions = mentionSuggestions.filter(profile => 
    profile.username?.toLowerCase().includes(mentionQuery.toLowerCase()) &&
    profile.id !== user?.id
  );

  // Handle mention selection
  const selectMention = (profile: Profile) => {
    const beforeCursor = message.substring(0, cursorPosition);
    const afterCursor = message.substring(cursorPosition);
    
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const newMessage = 
        beforeCursor.substring(0, mentionMatch.index) + 
        `@${profile.username} ` + 
        afterCursor;
      
      setMessage(newMessage);
      setShowMentions(false);
      setMentionQuery('');
      
      // Set cursor position after the mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = (mentionMatch.index || 0) + profile.username!.length + 2;
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  // Handle keyboard navigation for mentions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredSuggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        selectMention(filteredSuggestions[mentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Photo must be smaller than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSendMessage = async () => {
    console.log('handleSendMessage called', { message: message.trim(), selectedFile, isSending, user: user?.id, leagueId });
    
    if ((!message.trim() && !selectedFile) || isSending) {
      console.log('Early return from handleSendMessage');
      return;
    }

    setIsSending(true);
    try {
      let photoUrl: string | null = null;
      let content = message.trim();

      // Upload photo if selected
      if (selectedFile) {
        console.log('Uploading photo...');
        setIsUploading(true);
        photoUrl = await chatService.uploadPhoto(selectedFile, leagueId);
        setIsUploading(false);
        console.log('Photo uploaded:', photoUrl);
      }

      // Parse mentions from content
      const { mentionedUsernames } = chatService.parseMentions(content);
      console.log('Parsed mentions:', mentionedUsernames);
      
      // Send message
      const messageInput = {
        user_id: user?.id || '',
        league_id: leagueId,
        content,
        message_type: (selectedFile ? 'photo' : 'text') as 'text' | 'photo',
        reply_to_id: replyToMessage?.id || null,
        photo_url: photoUrl,
        photo_description: selectedFile ? content : null
      };
      
      console.log('Sending message:', messageInput);

      // Send message
      const newMessage = await chatService.sendMessage(messageInput);
      console.log('Message sent successfully:', newMessage);

      // Create mentions
      if (mentionedUsernames.length > 0) {
        // Get user IDs from usernames
        const mentionedProfiles = mentionSuggestions.filter(profile => 
          mentionedUsernames.includes(profile.username || '')
        );
        
        if (mentionedProfiles.length > 0) {
          await chatService.createMentions(
            newMessage.id, 
            mentionedProfiles.map(p => p.id)
          );
        }
      }

      // Reset form
      setMessage('');
      setSelectedFile(null);
      onCancelReply();
      setShowMentions(false);
      onSendMessage();

      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-t">
      <CardContent className="p-3 sm:p-4">
        {/* Reply to message */}
        {replyToMessage && (
          <div className="mb-2 sm:mb-3 p-2 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Avatar className="w-5 h-5 sm:w-6 sm:h-6">
                <AvatarImage src={replyToMessage.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {replyToMessage.profile?.username?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">Replying to</span>
              <span className="font-medium truncate">{replyToMessage.profile?.username}</span>
              <span className="text-muted-foreground truncate ml-1 sm:ml-2">
                {replyToMessage.content}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="h-5 w-5 sm:h-6 sm:w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Selected file preview */}
        {selectedFile && (
          <div className="mb-2 sm:mb-3 p-2 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Image className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">{selectedFile.name}</span>
              {isUploading && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
              className="h-5 w-5 sm:h-6 sm:w-6 p-0"
              disabled={isUploading}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Input area */}
        <div className="flex gap-2 sm:gap-3">
          <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="text-xs">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (@ to mention someone)"
              className="min-h-[36px] sm:min-h-[40px] max-h-32 resize-none pr-16 sm:pr-20 text-sm"
              rows={1}
            />

            {/* Mention suggestions dropdown */}
            {showMentions && filteredSuggestions.length > 0 && (
              <Card className="absolute bottom-full left-0 right-0 mb-2 z-10 max-h-48 overflow-y-auto">
                <div className="p-1">
                  {filteredSuggestions.map((profile, index) => (
                    <button
                      key={profile.id}
                      onClick={() => selectMention(profile)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors text-left",
                        index === mentionIndex && "bg-muted"
                      )}
                    >
                      <Avatar className="w-5 h-5 sm:w-6 sm:h-6">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {profile.username?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs sm:text-sm font-medium">{profile.username}</span>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Action buttons */}
            <div className="absolute right-1 sm:right-2 bottom-1 sm:bottom-2 flex gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                disabled={isSending || isUploading}
              >
                <Image className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMentions(!showMentions)}
                className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                disabled={isSending || isUploading}
              >
                <AtSign className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>

              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={(!message.trim() && !selectedFile) || isSending || isUploading}
                className="h-5 w-5 sm:h-6 sm:w-6 sm:px-2"
              >
                {isSending ? (
                  <Loader2 className="w-2 h-2 sm:w-3 sm:h-3 animate-spin" />
                ) : (
                  <Send className="w-2 h-2 sm:w-3 sm:h-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
