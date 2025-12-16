import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, MessageCircle, Share2 } from "lucide-react";
import { ReactionBar } from "./ReactionBar";
import { CommentSection } from "./CommentSection";

interface FeedCardProps {
  matchId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  userScore: number;
  rivalScore: number;
  rivalName: string;
  platform: string;
  matchDate: string;
  result: "win" | "draw" | "loss";
  screenshotUrl?: string;
  possession?: number;
  totalShots?: number;
  shotsOnTarget?: number;
  initialReactions: { [key: string]: number };
  initialCommentCount: number;
  currentUserId: string;
}

export const FeedCard = ({
  matchId,
  userId,
  username,
  avatarUrl,
  userScore,
  rivalScore,
  rivalName,
  platform,
  matchDate,
  result,
  screenshotUrl,
  possession,
  totalShots,
  shotsOnTarget,
  initialReactions,
  initialCommentCount,
  currentUserId,
}: FeedCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  const getResultColor = () => {
    switch (result) {
      case "win":
        return "text-success border-success/20 bg-success/5";
      case "draw":
        return "text-draw border-draw/20 bg-draw/5";
      case "loss":
        return "text-destructive border-destructive/20 bg-destructive/5";
    }
  };

  const getResultText = () => {
    if (result === "win") return "Victory! 🎉";
    if (result === "draw") return "Draw";
    return "Defeat";
  };

  return (
    <Card className="overflow-hidden animate-fade-in hover:shadow-lg transition-all duration-300 max-w-2xl mx-auto w-full">
      {/* User Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm sm:text-base">
              {username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm sm:text-base">{username}</p>
            <p className="text-xs text-muted-foreground">{matchDate}</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 text-xs sm:text-sm">
          <Trophy className="w-3 h-3" />
          <span className="hidden sm:inline">{platform}</span>
          <span className="sm:hidden" title={platform}>{platform.substring(0, 3)}</span>
        </Badge>
      </div>

      {/* Match Screenshot */}
      {screenshotUrl && (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={screenshotUrl}
            alt="Match screenshot"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            style={{ maxHeight: '70vh' }}
          />
          <div className="absolute top-2 right-2">
            <Badge className={`${getResultColor()} font-bold backdrop-blur-sm text-xs sm:text-sm`}>
              {getResultText()}
            </Badge>
          </div>
        </div>
      )}

      {/* Match Score */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <div className="text-center flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1 line-clamp-1">{username}</p>
            <p className={`text-2xl sm:text-4xl font-bold ${result === "win" ? "text-success" : result === "loss" ? "text-destructive" : ""}`}>
              {userScore}
            </p>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-muted-foreground">-</div>
          <div className="text-center flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1 line-clamp-1">{rivalName}</p>
            <p className={`text-2xl sm:text-4xl font-bold ${result === "loss" ? "text-success" : result === "win" ? "text-destructive" : ""}`}>
              {rivalScore}
            </p>
          </div>
        </div>

        {/* Match Stats */}
        {(possession || totalShots || shotsOnTarget) && (
          <div className="grid grid-cols-3 gap-1 sm:gap-2 pt-2 sm:pt-3 border-t">
            {possession && (
              <div className="text-center p-1 sm:p-2 bg-muted/30 rounded">
                <p className="text-[10px] xs:text-xs text-muted-foreground">Possession</p>
                <p className="text-xs sm:text-sm font-semibold">{possession}%</p>
              </div>
            )}
            {totalShots && (
              <div className="text-center p-1 sm:p-2 bg-muted/30 rounded">
                <p className="text-[10px] xs:text-xs text-muted-foreground">Shots</p>
                <p className="text-xs sm:text-sm font-semibold">{totalShots}</p>
              </div>
            )}
            {shotsOnTarget && (
              <div className="text-center p-1 sm:p-2 bg-muted/30 rounded">
                <p className="text-[10px] xs:text-xs text-muted-foreground">On Target</p>
                <p className="text-xs sm:text-sm font-semibold">{shotsOnTarget}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-2">
          <ReactionBar
            matchId={matchId}
            initialReactions={initialReactions}
            currentUserId={currentUserId}
          />
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 sm:gap-1.5 text-muted-foreground px-2 sm:px-3"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs sm:text-sm">
              {commentCount > 0 ? commentCount : ''} 
              <span className="hidden xs:inline">{commentCount === 1 ? ' Comment' : ' Comments'}</span>
              <span className="xs:hidden">{commentCount > 0 ? '' : 'Comment'}</span>
            </span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1 sm:gap-1.5 text-muted-foreground px-2 sm:px-3"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Share</span>
            </span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <CommentSection
            matchId={matchId}
            currentUserId={currentUserId}
            onCommentCountChange={setCommentCount}
          />
        )}
      </div>
    </Card>
  );
};