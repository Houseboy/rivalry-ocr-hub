import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Send, Trash2, Reply, X } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { useToast } from "../../hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { EmojiPicker } from "./EmojiPicker";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
  parent_id?: string | null;
  replies?: Comment[];
}

interface CommentSectionProps {
  matchId?: string;
  postId?: string;
  currentUserId: string;
  onCommentCountChange: (count: number) => void;
}

export const CommentSection = ({
  matchId,
  postId,
  currentUserId,
  onCommentCountChange,
}: CommentSectionProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEmojiSelect = (emoji: string) => {
    setNewComment((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    fetchComments();
  }, [matchId, postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      let commentsData: any;
      
      if (postId) {
        const { data, error: commentsError } = await supabase
          .from("post_comments" as any)
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: false });

        if (commentsError) throw commentsError;
        commentsData = data;
      } else if (matchId) {
        const { data, error: commentsError } = await supabase
          .from("match_comments")
          .select("*")
          .eq("match_id", matchId)
          .order("created_at", { ascending: false });

        if (commentsError) throw commentsError;
        commentsData = data;
      }

      // Fetch usernames separately
      const userIds = [...new Set(commentsData?.map((c: any) => c.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds as string[]);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.username]));

      const enrichedComments = commentsData?.map((comment: any) => ({
        ...comment,
        username: profilesMap.get(comment.user_id) || "Unknown User"
      })) || [];

      // Organize comments into threads (top-level and replies)
      const topLevelComments: Comment[] = [];
      const repliesMap = new Map<string, Comment[]>();

      enrichedComments.forEach((comment: Comment) => {
        if (comment.parent_id) {
          const existing = repliesMap.get(comment.parent_id) || [];
          existing.push(comment);
          repliesMap.set(comment.parent_id, existing);
        } else {
          topLevelComments.push(comment);
        }
      });

      // Attach replies to their parent comments
      const threaded = topLevelComments.map((comment) => ({
        ...comment,
        replies: repliesMap.get(comment.id) || []
      }));

      setComments(threaded);
      onCommentCountChange(enrichedComments.length);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (postId) {
        const { error } = await supabase.from("post_comments" as any).insert({
          post_id: postId,
          user_id: currentUserId,
          content: newComment.trim(),
          parent_id: replyingTo?.id || null,
        } as any);

        if (error) throw error;
      } else if (matchId) {
        const { error } = await supabase.from("match_comments").insert({
          match_id: matchId,
          user_id: currentUserId,
          content: newComment.trim(),
        });

        if (error) throw error;
      }

      setNewComment("");
      setReplyingTo(null);
      await fetchComments();

      toast({
        title: replyingTo ? "Reply posted!" : "Comment posted!",
        description: replyingTo ? "Your reply has been added." : "Your comment has been added.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      if (postId) {
        const { error } = await supabase
          .from("post_comments" as any)
          .delete()
          .eq("id", commentId);

        if (error) throw error;
      } else if (matchId) {
        const { error } = await supabase
          .from("match_comments")
          .delete()
          .eq("id", commentId);

        if (error) throw error;
      }

      await fetchComments();

      toast({
        title: "Comment deleted",
        description: "Your comment has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in ${isReply ? "ml-8 border-l-2 border-primary/20" : ""}`}
    >
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {comment.username?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <p className="font-semibold text-sm">
            {comment.username || "Unknown User"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
        <p className="text-sm break-words">{comment.content}</p>
        {!isReply && postId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 mt-1 text-xs text-muted-foreground hover:text-primary"
            onClick={() => handleReply(comment)}
          >
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </Button>
        )}
      </div>
      {comment.user_id === currentUserId && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => handleDelete(comment.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 pt-4 border-t animate-fade-in">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg text-sm">
          <Reply className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Replying to</span>
          <span className="font-semibold text-primary">{replyingTo.username}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={cancelReply}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Add a comment..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] resize-none pr-10"
            disabled={submitting}
          />
          <div className="absolute bottom-2 right-2">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!newComment.trim() || submitting}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              {renderComment(comment)}
              {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-2">
                  {comment.replies.map((reply) => renderComment(reply, true))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};