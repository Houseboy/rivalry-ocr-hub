import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Activity, TrendingUp, Users, Filter, Trophy, Target, Newspaper, UserPlus, UserMinus, Loader2, Crown, Award, BarChart2 } from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { FeedCard } from "../components/feed/FeedCard";
import { PostCard } from "../components/feed/PostCard";
import { EmptyState } from "../components/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Card } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { SystemUpdatesNews } from "../components/analytics/SystemUpdatesNews";
import { toast } from "sonner";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { leaderboardService, LeagueTier } from "../services/leaderboardService";

interface FeedMatch {
  id: string;
  user_id: string;
  user_score: number;
  rival_score: number;
  rival_name: string;
  platform: string;
  match_date: string;
  result: "win" | "draw" | "loss";
  screenshot_url?: string;
  possession?: number;
  total_shots?: number;
  shots_on_target?: number;
  username?: string;
  avatar_url?: string;
  reactions: any[];
  commentCount: number;
}

interface FeedPost {
  id: string;
  user_id: string;
  type: "image" | "video";
  url: string;
  caption: string;
  tags: string[];
  created_at: string;
  username?: string;
  avatar_url?: string;
  reactions: any[];
  commentCount: number;
}

type FeedItem = (FeedMatch & { itemType: "match" }) | (FeedPost & { itemType: "post" });

interface PlayerStats {
  id: string;
  username: string;
  avatar_url: string | null;
  rank_points: number;
  total_matches: number;
  wins: number;
  win_rate: number;
}

// Follow button component for the leaderboard
const FollowButton = ({ 
  userId, 
  size = "default", 
  variant = "default",
  onFollowChange
}: { 
  userId: string, 
  size?: "default" | "sm" | "lg" | "icon", 
  variant?: "default" | "outline" | "secondary",
  onFollowChange?: (userId: string, isFollowing: boolean) => void
}) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const checkFollowStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
      toast.error("Failed to check follow status");
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
    try {
      const newFollowingState = !isFollowing;
      
      try {
        if (newFollowingState) {
          // Follow
          const { error } = await supabase
            .from("follows")
            .insert([
              { 
                follower_id: user.id, 
                following_id: userId,
                created_at: new Date().toISOString()
              }
            ]);
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
        } else {
          // Unfollow
          const { error } = await supabase
            .from("follows")
            .delete()
            .eq("follower_id", user.id)
            .eq("following_id", userId);
          if (error) throw error;
        }
        
        // Update local state optimistically
        setIsFollowing(newFollowingState);
        
        // Notify parent component about the follow change
        if (onFollowChange) {
          onFollowChange(userId, newFollowingState);
        }
        
        toast.success(newFollowingState ? "You're now following this user!" : "Unfollowed successfully");
      } catch (error) {
        console.error("Error updating follow status:", error);
        toast.error(error instanceof Error ? error.message : "Failed to update follow status");
        // Revert optimistic update on error
        setIsFollowing(!newFollowingState);
        throw error; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update follow status");
      
      // Revert optimistic update on error
      setIsFollowing(!isFollowing);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    checkFollowStatus();
  }, [user, userId]);

  if (loading) {
    return <Button size={size} variant={variant} disabled><Loader2 className="w-4 h-4 animate-spin" /></Button>;
  }
  
  if (!user) {
    return null; // Don't show follow button if user is not logged in
  }
  
  if (user.id === userId) {
    return null; // Don't show follow button for the current user
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleFollow}
      disabled={actionLoading}
      className="whitespace-nowrap"
    >
      {actionLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
};

const Analytics = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<"all" | "following">("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [trendingMatches, setTrendingMatches] = useState<FeedItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d">("7d");
  
  // League leaderboard state
  const [selectedTier, setSelectedTier] = useState<LeagueTier | undefined>(undefined);
  const { data: leaderboardData, loading: leaderboardLoading, error: leaderboardError, refetch: refetchLeaderboard } = useLeaderboard({
    tier: selectedTier,
    limit: 50
  });
  
  const ITEMS_PER_PAGE = 10;

  // Initialize data when component mounts
  useEffect(() => {
    // Load feed matches
    setFeedItems([]);
    setPage(0);
    setHasMore(true);
    fetchFeedMatches(0, true);
  }, [filter, sortBy]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchFeedMatches(nextPage, false);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadingMore, hasMore, page]);

  useEffect(() => {
    const itemId = searchParams.get("matchId") || searchParams.get("postId");
    if (itemId && itemRefs.current[itemId]) {
      setTimeout(() => {
        itemRefs.current[itemId]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setSearchParams({});
      }, 500);
    }
  }, [feedItems, searchParams]);

  const fetchFeedMatches = async (pageNum: number, isInitial: boolean) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const offset = pageNum * ITEMS_PER_PAGE;
      
      // Fetch matches with pagination
      let matchQuery = supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);
      
      if (filter === "following") {
        matchQuery = matchQuery.eq("user_id", user?.id || "");
      }
      const { data: matchesData, error: matchesError } = await matchQuery;
      if (matchesError) throw matchesError;

      // Fetch posts with pagination - temporarily disabled since posts table doesn't exist
      // let postQuery = supabase
      //   .from("posts" as any)
      //   .select("*")
      //   .order("created_at", { ascending: false })
      //   .range(offset, offset + ITEMS_PER_PAGE - 1);
      
      // if (filter === "following") {
      //   postQuery = postQuery.eq("user_id", user?.id || "");
      // }
      // const { data: postsData, error: postsError } = await postQuery;
      // if (postsError) throw postsError;
      
      const postsData = null; // No posts data for now
      
      if ((!matchesData || matchesData.length === 0) && (!postsData || postsData.length === 0)) {
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      // Get all unique user IDs
      const matchUserIds = matchesData?.map(m => m.user_id) || [];
      const postUserIds = postsData?.map((p: any) => p.user_id) || [];
      const userIds = [...new Set([...matchUserIds, ...postUserIds])];

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      // Fetch match reactions and comments
      const matchIds = matchesData?.map(m => m.id) || [];
      const [
        { data: matchReactionsData },
        { data: matchCommentsData }
      ] = await Promise.all([
        supabase.from("match_reactions").select("match_id, reaction_type").in("match_id", matchIds),
        supabase.from("match_comments").select("match_id").in("match_id", matchIds)
      ]);

      const matchReactionsMap = new Map<string, any[]>();
      matchReactionsData?.forEach(r => {
        if (!matchReactionsMap.has(r.match_id)) matchReactionsMap.set(r.match_id, []);
        matchReactionsMap.get(r.match_id)!.push(r);
      });

      const matchCommentsMap = new Map<string, number>();
      matchCommentsData?.forEach(c => {
        matchCommentsMap.set(c.match_id, (matchCommentsMap.get(c.match_id) || 0) + 1);
      });

      // Fetch post reactions and comments
      const postIds = postsData?.map((p: any) => p.id) || [];
      const [
        { data: postReactionsData },
        { data: postCommentsData }
      ] = await Promise.all([
        supabase.from("post_reactions" as any).select("post_id, reaction_type").in("post_id", postIds),
        supabase.from("post_comments" as any).select("post_id").in("post_id", postIds)
      ]);

      const postReactionsMap = new Map<string, any[]>();
      postReactionsData?.forEach((r: any) => {
        if (!postReactionsMap.has(r.post_id)) postReactionsMap.set(r.post_id, []);
        postReactionsMap.get(r.post_id)!.push(r);
      });

      const postCommentsMap = new Map<string, number>();
      postCommentsData?.forEach((c: any) => {
        postCommentsMap.set(c.post_id, (postCommentsMap.get(c.post_id) || 0) + 1);
      });

      // Enrich matches
      const enrichedMatches: FeedItem[] = matchesData?.map(match => {
        const profile = profilesMap.get(match.user_id);
        return {
          ...match,
          itemType: "match" as const,
          result: match.result as "win" | "draw" | "loss",
          username: profile?.username || "Unknown User",
          avatar_url: profile?.avatar_url,
          reactions: matchReactionsMap.get(match.id) || [],
          commentCount: matchCommentsMap.get(match.id) || 0
        };
      }) || [];

      // Enrich posts
      const enrichedPosts: FeedItem[] = postsData?.map((post: any) => {
        const profile = profilesMap.get(post.user_id);
        return {
          ...post,
          itemType: "post" as const,
          username: profile?.username || "Unknown User",
          avatar_url: profile?.avatar_url,
          reactions: postReactionsMap.get(post.id) || [],
          commentCount: postCommentsMap.get(post.id) || 0
        };
      }) || [];

      // Combine and sort
      let allItems = [...enrichedMatches, ...enrichedPosts];

      if (sortBy === "recent") {
        allItems = allItems.sort((a, b) => {
          const aDate = a.itemType === "match" ? new Date(a.match_date) : new Date(a.created_at);
          const bDate = b.itemType === "match" ? new Date(b.match_date) : new Date(b.created_at);
          return bDate.getTime() - aDate.getTime();
        });
      } else {
        allItems = allItems.sort((a, b) => b.reactions.length - a.reactions.length);
      }

      setFeedItems(allItems);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getReactionCounts = (reactions: any[]) => {
    const counts: { [key: string]: number } = {};
    reactions?.forEach((r) => {
      counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
    });
    return counts;
  };

  const fetchTrendingMatches = async () => {
    setTrendingLoading(true);
    try {
      const now = new Date();
      const timeMap = {
        "24h": 1,
        "7d": 7,
        "30d": 30
      };
      const daysAgo = new Date(now.getTime() - timeMap[timeFilter] * 24 * 60 * 60 * 1000);

      // Fetch matches from selected time period
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .gte("created_at", daysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (matchesError) throw matchesError;
      if (!matchesData || matchesData.length === 0) {
        setTrendingMatches([]);
        setTrendingLoading(false);
        return;
      }

      const userIds = [...new Set(matchesData.map(m => m.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      const matchIds = matchesData.map(m => m.id);
      const [
        { data: matchReactionsData },
        { data: matchCommentsData }
      ] = await Promise.all([
        supabase.from("match_reactions").select("match_id, reaction_type").in("match_id", matchIds),
        supabase.from("match_comments").select("match_id").in("match_id", matchIds)
      ]);

      const matchReactionsMap = new Map<string, any[]>();
      matchReactionsData?.forEach(r => {
        if (!matchReactionsMap.has(r.match_id)) matchReactionsMap.set(r.match_id, []);
        matchReactionsMap.get(r.match_id)!.push(r);
      });

      const matchCommentsMap = new Map<string, number>();
      matchCommentsData?.forEach(c => {
        matchCommentsMap.set(c.match_id, (matchCommentsMap.get(c.match_id) || 0) + 1);
      });

      const enrichedMatches: FeedItem[] = matchesData.map(match => {
        const profile = profilesMap.get(match.user_id);
        const reactions = matchReactionsMap.get(match.id) || [];
        const commentCount = matchCommentsMap.get(match.id) || 0;
        return {
          ...match,
          itemType: "match" as const,
          result: match.result as "win" | "draw" | "loss",
          username: profile?.username || "Unknown User",
          avatar_url: profile?.avatar_url,
          reactions,
          commentCount,
          engagement: reactions.length + commentCount
        };
      });

      // Sort by engagement score
      enrichedMatches.sort((a: any, b: any) => b.engagement - a.engagement);

      setTrendingMatches(enrichedMatches);
    } catch (error) {
      console.error("Error fetching trending:", error);
    } finally {
      setTrendingLoading(false);
    }
  };

  // Enhanced refresh function to update league rankings and check ongoing leagues
  const handleRefreshLeaderboard = async () => {
    try {
      toast.loading("Updating league rankings...");
      
      // Get all active leagues to update their rankings
      const { data: leagues, error: leaguesError } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('is_public', true);
      
      if (leaguesError) {
        console.warn('Could not fetch leagues for ranking update:', leaguesError);
      } else if (leagues && leagues.length > 0) {
        // Update rankings for each league
        const updatePromises = leagues.map(async (league) => {
          try {
            await leaderboardService.updateLeagueRankings(league.id);
            return { success: true, leagueName: league.name };
          } catch (error) {
            console.warn(`Failed to update rankings for league ${league.name}:`, error);
            return { success: false, leagueName: league.name, error };
          }
        });
        
        const results = await Promise.all(updatePromises);
        const successful = results.filter(r => r.success).length;
        
        if (successful > 0) {
          toast.success(`Updated rankings for ${successful} league${successful > 1 ? 's' : ''}`);
        }
      }
      
      // Check for ongoing leagues (leagues with recent activity)
      const { data: ongoingLeagues, error: ongoingError } = await supabase
        .from('leagues')
        .select(`
          id,
          name,
          tier,
          created_at,
          league_members!inner(
            user_id,
            joined_at
          ),
          matches!inner(
            created_at
          )
        `)
        .eq('is_public', true)
        .gte('matches.created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .limit(5);
      
      if (!ongoingError && ongoingLeagues && ongoingLeagues.length > 0) {
        const activeLeagues = ongoingLeagues.map(league => ({
          id: league.id,
          name: league.name,
          tier: league.tier,
          memberCount: new Set(league.league_members.map((m: any) => m.user_id)).size,
          recentMatches: league.matches.length
        }));
        
        console.log('Active leagues found:', activeLeagues);
        
        if (activeLeagues.length > 0) {
          toast.success(`Found ${activeLeagues.length} active league${activeLeagues.length > 1 ? 's' : ''} with recent activity`);
        }
      }
      
      // Refresh the leaderboard data
      await refetchLeaderboard();
      
      toast.success("Leaderboard refreshed successfully!");
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
      toast.error("Failed to refresh leaderboard");
    }
  };

  // Simple error boundary to prevent blank page on errors
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">Failed to load the analytics page.</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 md:pt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Community Feed
          </h1>
          <p className="text-muted-foreground">
            See what the community is playing and share your victories! 🎮
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="feed" className="mb-6 animate-fade-in delay-100">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feed" className="gap-2">
              <Activity className="w-4 h-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="players" className="gap-2">
              <Users className="w-4 h-4" />
              Players
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg animate-fade-in delay-200">
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger className="sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Matches</SelectItem>
                  <SelectItem value="following">Following</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>

            <Button
              variant="outline"
              onClick={() => {
                setFeedItems([]);
                setPage(0);
                setHasMore(true);
                fetchFeedMatches(0, true);
              }}
              className="sm:ml-auto gap-2"
            >
              <Activity className="w-4 h-4" />
              Refresh
            </Button>
            </div>

            {/* Feed */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse text-lg">Loading feed...</div>
              </div>
            ) : feedItems.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No Content Yet"
                description="Be the first to share your match results or videos with the community!"
                actionLabel="Go to Profile"
                onAction={() => (window.location.href = "/profile")}
              />
            ) : (
              <div className="space-y-6">
                {feedItems.map((item, index) => (
                  <div
                    key={item.id}
                    ref={(el) => (itemRefs.current[item.id] = el)}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {item.itemType === "match" ? (
                      <FeedCard
                        matchId={item.id}
                        userId={item.user_id}
                        username={item.username || "Unknown User"}
                        avatarUrl={item.avatar_url}
                        userScore={item.user_score}
                        rivalScore={item.rival_score}
                        rivalName={item.rival_name}
                        platform={item.platform}
                        matchDate={new Date(item.match_date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                        result={item.result}
                        screenshotUrl={item.screenshot_url}
                        possession={item.possession}
                        totalShots={item.total_shots}
                        shotsOnTarget={item.shots_on_target}
                        initialReactions={getReactionCounts(item.reactions)}
                        initialCommentCount={item.commentCount}
                        currentUserId={user?.id || ""}
                      />
                    ) : (
                      <PostCard
                        postId={item.id}
                        userId={item.user_id}
                        username={item.username || "Unknown User"}
                        avatarUrl={item.avatar_url}
                        type={item.type}
                        url={item.url}
                        caption={item.caption}
                        tags={item.tags}
                        createdAt={new Date(item.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                        initialReactions={getReactionCounts(item.reactions)}
                        initialCommentCount={item.commentCount}
                        currentUserId={user?.id || ""}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            {/* System News Section */}
            <div className="animate-fade-in">
              <SystemUpdatesNews />
            </div>

            {/* Divider */}
            <div className="border-t border-border my-6" />

            {/* Trending Matches Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Trending Matches</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg animate-fade-in mb-4">
                <Select value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)}>
                  <SelectTrigger className="sm:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={fetchTrendingMatches}
                  className="sm:ml-auto gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Load Trending
                </Button>
              </div>

              {trendingLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse text-lg">Loading trending matches...</div>
                </div>
              ) : trendingMatches.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No Trending Matches Yet"
                  description="Check back later to see the hottest matches!"
                />
              ) : (
                <div className="space-y-6">
                  {trendingMatches.map((item, index) => (
                    <div
                      key={item.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {item.itemType === "match" && (
                        <FeedCard
                          matchId={item.id}
                          userId={item.user_id}
                          username={item.username || "Unknown User"}
                          avatarUrl={item.avatar_url}
                          userScore={item.user_score}
                          rivalScore={item.rival_score}
                          rivalName={item.rival_name}
                          platform={item.platform}
                          matchDate={new Date(item.match_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          result={item.result}
                          screenshotUrl={item.screenshot_url}
                          possession={item.possession}
                          totalShots={item.total_shots}
                          shotsOnTarget={item.shots_on_target}
                          initialReactions={getReactionCounts(item.reactions)}
                          initialCommentCount={item.commentCount}
                          currentUserId={user?.id || ""}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="players" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Global Leaderboard</h3>
              </div>
              <div className="w-full sm:w-auto flex flex-col xs:flex-row gap-2">
                <Select value={selectedTier?.toString() || "all"} onValueChange={(value) => {
                  setSelectedTier(value === "all" ? undefined : Number(value) as LeagueTier);
                }}>
                  <SelectTrigger className="w-full xs:w-[180px]">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value={LeagueTier.CHAMPIONS.toString()}>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <span className="truncate">Champions</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={LeagueTier.ELITE.toString()}>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-500" />
                        <span className="truncate">Elite</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={LeagueTier.COMPETITIVE.toString()}>
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-blue-500" />
                        <span className="truncate">Competitive</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={LeagueTier.AMATEUR.toString()}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="truncate">Amateur</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleRefreshLeaderboard}
                  className="gap-2 w-full xs:w-auto"
                  disabled={leaderboardLoading}
                  size="sm"
                >
                  {leaderboardLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                  <span className="hidden xs:inline">
                    {leaderboardLoading ? "Updating..." : "Refresh"}
                  </span>
                </Button>
              </div>
            </div>

            {leaderboardError ? (
              <div className="p-8 text-center">
                <p className="text-red-500 mb-4">Failed to load leaderboard. Please try again.</p>
                <Button onClick={refetchLeaderboard}>Retry</Button>
              </div>
            ) : leaderboardLoading && leaderboardData.length === 0 ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="w-20 h-8" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : leaderboardData.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Players Found"
                description="There are no players to display. Join a league to appear on the leaderboard!"
              />
            ) : (
              <div className="space-y-3">
                {leaderboardData.map((player, index) => (
                  <Card
                    key={player.userId}
                    className="p-3 sm:p-4 hover:shadow-card-custom transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary font-bold text-sm sm:text-base">
                        {index < 3 ? (
                          <Trophy className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            index === 0 ? "text-yellow-500" : 
                            index === 1 ? "text-gray-400" : "text-amber-600"
                          }`} />
                        ) : (
                          index + 1
                        )}
                      </div>
                      
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                        <AvatarImage src={player.avatarUrl || ""} />
                        <AvatarFallback className="text-xs sm:text-sm">
                          {player.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{player.username}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Users className="w-3 h-3 hidden xs:inline" />
                            {player.stats.totalLeagues} {window.innerWidth < 400 ? 'L' : 'leagues'}
                          </span>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Target className="w-3 h-3 hidden xs:inline" />
                            {player.stats.totalMatches} {window.innerWidth < 400 ? 'M' : 'matches'}
                          </span>
                          <span className="whitespace-nowrap">{player.stats.totalWins}W</span>
                          <span className="whitespace-nowrap">{Math.round(player.stats.winRate)}% WR</span>
                        </div>
                        {player.bestLeague.leagueName && player.bestLeague.leagueName !== 'No League Data' && (
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 text-xs">
                            <span className="text-muted-foreground hidden sm:inline">Best League:</span>
                            <span className="font-medium truncate max-w-[120px] sm:max-w-none">{player.bestLeague.leagueName}</span>
                            <span className="text-muted-foreground">#{player.bestLeague.position}/{player.bestLeague.totalPlayers}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-2xs sm:text-xs ${leaderboardService.getTierColor(player.bestLeague.tier)}`}>
                              {leaderboardService.getTierName(player.bestLeague.tier)}
                            </span>
                          </div>
                        )}
                        {player.leagues.length > 0 && (
                          <div className="hidden sm:flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">Performance Score:</span>
                            <span className="text-xs font-semibold text-primary">
                              {player.leagues.length} league{player.leagues.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="hidden sm:block">
                        <FollowButton 
                          userId={player.userId} 
                          size="sm" 
                          variant="outline"
                          onFollowChange={() => {}}
                          variant={player.userId === user?.id ? "outline" : "default"}
                          onFollowChange={async (userId, isFollowing) => {
                            // This will trigger a refresh of the follow stats on the profile
                            if (user?.id) {
                              // If the current user's profile is being viewed, refresh the follow stats
                              const currentPath = window.location.pathname;
                              if (currentPath.includes('/profile')) {
                                const searchParams = new URLSearchParams(window.location.search);
                                const viewedUserId = searchParams.get('userId');
                                
                                if ((!viewedUserId && player.userId === user.id) || viewedUserId === player.userId) {
                                  // Refresh the follow stats for the viewed profile
                                  const { data: stats } = await supabase
                                    .from('follows')
                                    .select('*', { count: 'exact', head: true })
                                    .eq('following_id', player.userId);
                                    
                                  // Update the leaderboard count
                                  refetchLeaderboard();
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;