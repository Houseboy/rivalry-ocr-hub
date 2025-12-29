import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ChatMessageWithProfile } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chatService';
import { toast } from 'sonner';

interface MessageReactionsProps {
  message: ChatMessageWithProfile;
  onReactionUpdate: () => void;
  onDeleteMessage: (messageId: string) => void;
  showActions?: boolean;
}

export const MessageReactions = ({ 
  message, 
  onReactionUpdate, 
  onDeleteMessage,
  showActions = false
}: MessageReactionsProps) => {
  const { user } = useAuth();

  // Reactions feature is disabled
  const canDelete = user && (message.user_id === user.id || message.profile?.is_admin);

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      {/* Only show delete button for owner/admin */}
      {showActions && canDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (!user) return;

            const isOwner = message.user_id === user.id;
            const isAdmin = message.profile?.is_admin;

            if (!isOwner && !isAdmin) {
              return;
            }

            try {
              if (isOwner) {
                chatService.deleteMessage(message.id, user.id);
              } else {
                chatService.adminDeleteMessage(message.id);
              }
              onDeleteMessage(message.id);
              toast.success('Message deleted');
            } catch (error) {
              console.error('Error deleting message:', error);
              toast.error('Failed to delete message');
            }
          }}
          className="h-6 px-2 text-xs hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};
