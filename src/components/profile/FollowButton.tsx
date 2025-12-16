import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, UserMinus, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  userId: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary";
  showStats?: boolean;
  className?: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton = ({ 
  userId, 
  size = "default", 
  variant = "default", 
  showStats = false,
  className,
  initialIsFollowing = false,
  onFollowChange
}: FollowButtonProps) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing || false);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Update internal state when initialIsFollowing prop changes
  useEffect(() => {
    if (initialIsFollowing !== undefined) {
      setIsFollowing(initialIsFollowing);
    }
  }, [initialIsFollowing]);

  useEffect(() => {
    if (!user) return;
    checkFollowStatus();
  }, [user, userId]);

  const checkFollowStatus = async () => {
    try {
      const [{ data: followData }, { data: countData }] = await Promise.all([
        supabase
          .from("follows")
          .select("*")
          .eq("follower_id", user!.id)
          .eq("following_id", userId)
          .maybeSingle(),
        supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", userId)
      ]);

      setIsFollowing(!!followData);
      setFollowersCount(countData?.length || 0);
    } catch (error) {
      console.error("Error checking follow status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please sign in to follow users");
      return;
    }

    setActionLoading(true);
    const newFollowingState = !isFollowing;
    
    // Optimistic UI update
    setIsFollowing(newFollowingState);
    setFollowersCount(prev => newFollowingState ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      if (!newFollowingState) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", userId);

        if (error) throw error;
        
        toast.success("Unfollowed successfully");
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: userId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        
        // Send follow notification
        await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            actor_id: user.id,
            type: "follow",
            is_read: false,
            created_at: new Date().toISOString()
          });
          
        toast.success("You're now following this user!");
      }
      
      // Notify parent component of the change
      if (onFollowChange) {
        onFollowChange(newFollowingState);
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update follow status");
      
      // Revert optimistic update on error
      setIsFollowing(!newFollowingState);
      setFollowersCount(prev => newFollowingState ? Math.max(0, prev - 1) : prev + 1);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || user.id === userId) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showStats && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{followersCount}</span>
        </div>
      )}
      <Button
        onClick={handleFollow}
        disabled={actionLoading}
        size={size}
        variant={isFollowing ? variant : "default"}
        className={cn(
          "transition-all duration-200",
          isFollowing && "hover:bg-destructive hover:text-destructive-foreground"
        )}
      >
        {actionLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : isFollowing ? (
          <>
            <UserMinus className="w-4 h-4 mr-2" />
            Unfollow
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Follow
          </>
        )}
      </Button>
    </div>
  );
};
