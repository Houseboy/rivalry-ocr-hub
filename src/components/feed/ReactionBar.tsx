import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Heart, Flame, HandMetal, Trophy, ThumbsUp } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { useToast } from "../../hooks/use-toast";

interface ReactionBarProps {
  matchId?: string;
  postId?: string;
  currentUserId: string;
  initialReactions: { [key: string]: number };
}

const reactionConfig = [
  { type: "like", icon: Heart, label: "Like", color: "text-pink-500" },
  { type: "fire", icon: Flame, label: "Fire", color: "text-orange-500" },
  { type: "clap", icon: HandMetal, label: "Clap", color: "text-yellow-500" },
  { type: "trophy", icon: Trophy, label: "Trophy", color: "text-amber-500" },
];

export const ReactionBar = ({
  matchId,
  postId,
  currentUserId,
  initialReactions,
}: ReactionBarProps) => {
  const { toast } = useToast();
  const [reactions, setReactions] = useState<{ [key: string]: number }>(initialReactions);
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchUserReactions();
  }, [matchId, postId, currentUserId]);

  const fetchUserReactions = async () => {
    if (postId) {
      const { data } = await supabase
        .from("post_reactions" as any)
        .select("reaction_type")
        .eq("post_id", postId)
        .eq("user_id", currentUserId);

      if (data) {
        setUserReactions(new Set(data.map((r: any) => r.reaction_type)));
      }
    } else if (matchId) {
      const { data } = await supabase
        .from("match_reactions")
        .select("reaction_type")
        .eq("match_id", matchId)
        .eq("user_id", currentUserId);

      if (data) {
        setUserReactions(new Set(data.map((r) => r.reaction_type)));
      }
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (loading[reactionType]) return;

    setLoading((prev) => ({ ...prev, [reactionType]: true }));
    const hasReacted = userReactions.has(reactionType);

    try {
      if (hasReacted) {
        // Remove reaction
        if (postId) {
          const { error } = await supabase
            .from("post_reactions" as any)
            .delete()
            .eq("post_id", postId)
            .eq("user_id", currentUserId)
            .eq("reaction_type", reactionType);

          if (error) throw error;
        } else if (matchId) {
          const { error } = await supabase
            .from("match_reactions")
            .delete()
            .eq("match_id", matchId)
            .eq("user_id", currentUserId)
            .eq("reaction_type", reactionType);

          if (error) throw error;
        }

        setReactions((prev) => ({
          ...prev,
          [reactionType]: Math.max(0, (prev[reactionType] || 0) - 1),
        }));
        setUserReactions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(reactionType);
          return newSet;
        });
      } else {
        // Add reaction
        if (postId) {
          const { error } = await supabase.from("post_reactions" as any).insert({
            post_id: postId,
            user_id: currentUserId,
            reaction_type: reactionType,
          } as any);

          if (error) throw error;
        } else if (matchId) {
          const { error } = await supabase.from("match_reactions").insert({
            match_id: matchId,
            user_id: currentUserId,
            reaction_type: reactionType,
          });

          if (error) throw error;
        }

        setReactions((prev) => ({
          ...prev,
          [reactionType]: (prev[reactionType] || 0) + 1,
        }));
        setUserReactions((prev) => new Set([...prev, reactionType]));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, [reactionType]: false }));
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {reactionConfig.map(({ type, icon: Icon, label, color }) => {
        const count = reactions[type] || 0;
        const hasReacted = userReactions.has(type);

        return (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => handleReaction(type)}
            disabled={loading[type]}
            className={`gap-1 transition-all duration-200 ${
              hasReacted
                ? `${color} hover:${color} scale-110 font-semibold`
                : "hover:scale-105"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${hasReacted ? `${color} fill-current` : ""}`}
            />
            {count > 0 && (
              <span className="text-xs">{count > 99 ? "99+" : count}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
};