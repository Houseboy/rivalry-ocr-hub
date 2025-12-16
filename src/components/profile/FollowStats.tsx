import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const FollowStats = ({ userId }: { userId: string }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    isCurrentUser: false,
  });

  const fetchStats = async () => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),
        
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);

      setStats({
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
        isCurrentUser: user?.id === userId,
      });
    } catch (error) {
      console.error("Error fetching follow stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <User className="w-4 h-4" />
        <span className="font-medium">{stats.followers}</span>
        <span>{stats.followers === 1 ? " Follower" : " Followers"}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4" />
        <span className="font-medium">{stats.following}</span>
        <span> Following</span>
      </div>
      
      {stats.isCurrentUser && (
        <Link 
          to="/following" 
          className="text-primary hover:underline text-sm font-medium"
        >
          View All
        </Link>
      )}
    </div>
  );
};
