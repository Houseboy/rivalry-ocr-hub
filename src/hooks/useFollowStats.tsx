import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FollowStats {
  followersCount: number;
  followingCount: number;
}

export const useFollowStats = (userId: string | undefined) => {
  const [stats, setStats] = useState<FollowStats>({
    followersCount: 0,
    followingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  
  const refresh = async () => {
    if (!userId) return;
    await fetchStats();
  };

  useEffect(() => {
    if (!userId) return;
    
    let mounted = true;
    let channel: any = null;

    const setupRealtime = async () => {
      // Initial fetch
      await fetchStats();

      // Only set up realtime if we're still mounted
      if (mounted) {
        // Channel for when someone follows/unfollows this user
        channel = supabase
          .channel(`follow-stats-${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'follows',
              filter: `following_id=eq.${userId}`, // When someone follows/unfollows this user
            },
            (payload) => {
              console.log('Follower change detected:', payload);
              fetchStats();
            }
          )
          // Also listen for when this user follows/unfollows others
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'follows',
              filter: `follower_id=eq.${userId}`, // When this user follows/unfollows someone
            },
            (payload) => {
              console.log('Following change detected:', payload);
              fetchStats();
            }
          )
          .subscribe(status => {
            if (status === 'SUBSCRIBED') {
              console.log('Listening for all follow changes for user:', userId);
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Error subscribing to follow changes');
            }
          });
      }
    };

    setupRealtime();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  const fetchStats = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      console.log('Fetching follow stats for user:', userId);
      
      // Get followers count (people who follow this user)
      const { count: followersCount, error: followersError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      // Get following count (people this user follows)
      const { count: followingCount, error: followingError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      if (followersError || followingError) {
        console.error('Error fetching follow stats:', { followersError, followingError });
        return;
      }

      console.log('Fetched stats:', { 
        userId,
        followersCount: followersCount || 0, 
        followingCount: followingCount || 0 
      });
      
      setStats({
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      });
    } catch (error) {
      console.error("Error fetching follow stats:", error);
      // Optionally set error state here if needed
    } finally {
      setLoading(false);
    }
  };

  return {
    ...stats,
    loading,
    refresh,
  };
};
