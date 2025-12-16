import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { ReactionBar } from "./ReactionBar";
import { CommentSection } from "./CommentSection";
import { VideoPlayer } from "./VideoPlayer";

interface PostCardProps {
  postId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  type: "image" | "video";
  url: string;
  caption: string;
  tags: string[];
  createdAt: string;
  initialReactions: { [key: string]: number };
  initialCommentCount: number;
  currentUserId: string;
}

export const PostCard = ({
  postId,
  userId,
  username,
  avatarUrl,
  type,
  url,
  caption,
  tags,
  createdAt,
  initialReactions,
  initialCommentCount,
  currentUserId,
}: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  return (
    <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/20 transition-all duration-300">
      {/* User Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <Avatar className="w-10 h-10 border-2 border-primary/20">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{username}</h3>
          <p className="text-xs text-muted-foreground">{createdAt}</p>
        </div>
      </div>

      {/* Media */}
      {type === "video" ? (
        <VideoPlayer
          src={url}
          className="w-full max-h-[500px] object-contain"
        />
      ) : (
        <div className="relative bg-black/5">
          <img
            src={url}
            alt="Post content"
            className="w-full max-h-[500px] object-contain"
          />
        </div>
      )}

      {/* Caption and Tags */}
      <div className="p-4 space-y-2">
        {caption && (
          <p className="text-sm leading-relaxed">{caption}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-0.5"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className="px-4 pb-2">
        <ReactionBar
          postId={postId}
          currentUserId={currentUserId}
          initialReactions={initialReactions}
        />
      </div>

      {/* Comments Toggle */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>
            {commentCount === 0
              ? "Add a comment"
              : `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`}
          </span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-border/50 p-4">
          <CommentSection
            postId={postId}
            currentUserId={currentUserId}
            onCommentCountChange={setCommentCount}
          />
        </div>
      )}
    </Card>
  );
};
