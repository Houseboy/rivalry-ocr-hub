import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Upload, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ManualMatchUpload from "@/components/ManualMatchUpload";
import { EmptyState } from "../components/EmptyState";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { CareerStats } from "../components/profile/CareerStats";
import { RivalriesOverview } from "../components/profile/RivalriesOverview";
import { PerformanceTrends } from "../components/profile/PerformanceTrends";
import { AchievementsBadges } from "../components/profile/AchievementsBadges";
import { MatchHistoryFeed } from "../components/profile/MatchHistoryFeed";
import { SquadManager } from "../components/profile/SquadManager";
import { NotificationsBell } from "../components/profile/NotificationsBell";
import { VideoUpload } from "../components/VideoUpload";
import { GalleryTab } from "../components/profile/GalleryTab";
import { FollowersList } from "../components/profile/FollowersList";
import { FollowingList } from "../components/profile/FollowingList";
import { MyLeagues } from "../components/profile/MyLeagues";
import { useFollowStats } from "../hooks/useFollowStats";
import { FollowButton } from "../components/profile/FollowButton";

interface ProfileData {
  id?: string;
  username?: string;
  avatarUrl?: string;
  favoriteTeam?: string;
  playstyle?: string;
  rankPoints: number;
}

interface MatchData {
  id?: string;
  userScore: number;
  rivalScore: number;
  rivalName: string;
  screenshotUrl?: string;
  platform: string;
  date: string;
  result: "win" | "draw" | "loss";
}

interface RivalryData {
  rivalName: string;
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const viewingUserId = searchParams.get("userId") || user?.id;
  const isOwnProfile = !searchParams.get("userId") || searchParams.get("userId") === user?.id;
  
  const [showUpload, setShowUpload] = useState(false);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    rankPoints: 0,
  });
  const [rivalries, setRivalries] = useState<RivalryData[]>([]);
  const [squads, setSquads] = useState<any[]>([]);
  
  const { followersCount, followingCount, refresh: refreshFollowStats } = useFollowStats(viewingUserId);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Check if current user is following the viewed profile
  useEffect(() => {
    if (!user?.id || !viewingUserId || user.id === viewingUserId) return;
    
    const checkIfFollowing = async () => {
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', viewingUserId)
          .maybeSingle();
          
        if (error) throw error;
        
        // Only update state if the value has changed to prevent unnecessary re-renders
        setIsFollowing(prev => (!!data) !== prev ? !!data : prev);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };
    
    checkIfFollowing();
    
    // Set up real-time subscription for follow status changes
    const channel = supabase
      .channel(`follow-status-${user.id}-${viewingUserId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `follower_id=eq.${user.id} AND following_id=eq.${viewingUserId}`
        },
        (payload) => {
          console.log('Follow status changed:', payload);
          setIsFollowing(payload.eventType !== 'DELETE');
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, viewingUserId]);

  // Check if current user is following the viewed profile
  useEffect(() => {
    const checkIfFollowing = async () => {
      if (!user?.id || !viewingUserId || user.id === viewingUserId) return;
      
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', viewingUserId)
        .maybeSingle();
        
      if (!error) {
        setIsFollowing(!!data);
      }
    };
    
    checkIfFollowing();
  }, [user?.id, viewingUserId]);

  useEffect(() => {
    if (viewingUserId) {
      fetchProfile();
      fetchMatches();
      fetchRivalries();
      fetchSquads();
    }
  }, [viewingUserId]);

  const fetchProfile = async () => {
    if (!viewingUserId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, favorite_team, playstyle, rank_points")
        .eq("id", viewingUserId)
        .single();

      if (error) throw error;

      setProfileData({
        id: data.id,
        username: data.username,
        avatarUrl: data.avatar_url,
        favoriteTeam: data.favorite_team,
        playstyle: data.playstyle || "Balanced",
        rankPoints: data.rank_points || 0,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchMatches = async () => {
    if (!viewingUserId) return;

    try {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("user_id", viewingUserId)
        .order("match_date", { ascending: false });

      if (error) throw error;

      const formattedMatches = data.map((match: any) => ({
        id: match.id,
        userScore: match.user_score,
        rivalScore: match.rival_score,
        rivalName: match.rival_name,
        platform: match.platform,
        date: new Date(match.match_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        result: match.result as "win" | "draw" | "loss",
        screenshotUrl: match.screenshot_url,
      }));

      setMatches(formattedMatches);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRivalries = async () => {
    if (!viewingUserId) return;

    try {
      const { data, error } = await supabase
        .from("rivalry_stats")
        .select("*")
        .eq("user_id", viewingUserId)
        .order("total_matches", { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedRivalries = data.map((rivalry: any) => ({
        rivalName: rivalry.rival_name,
        totalMatches: rivalry.total_matches,
        wins: rivalry.wins,
        draws: rivalry.draws,
        losses: rivalry.losses,
        winRate: rivalry.win_rate,
      }));

      setRivalries(formattedRivalries);
    } catch (error) {
      console.error("Error fetching rivalries:", error);
    }
  };

  const fetchSquads = async () => {
    if (!viewingUserId) return;

    try {
      const { data, error } = await supabase
        .from("squads")
        .select("*")
        .eq("user_id", viewingUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSquads(data || []);
    } catch (error) {
      console.error("Error fetching squads:", error);
    }
  };

  const handleMatchSaved = async () => {
    await fetchMatches();
    await fetchRivalries();
    setShowUpload(false);
    toast({
      title: "Match logged!",
      description: "Your match has been added successfully.",
    });
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Are you sure you want to delete this match?")) return;
    
    try {
      const { error } = await supabase
        .from("matches")
        .delete()
        .eq("id", matchId);

      if (error) throw error;

      await fetchMatches();
      await fetchRivalries();
      toast({
        title: "Match deleted",
        description: "Your match has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting match:", error);
      toast({
        title: "Error",
        description: "Failed to delete match. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async (updatedData: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: updatedData.username,
          favorite_team: updatedData.favoriteTeam,
          playstyle: updatedData.playstyle,
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfileData((prev) => ({
        ...prev,
        ...updatedData,
      }));

      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const stats = {
    wins: matches.filter((m) => m.result === "win").length,
    draws: matches.filter((m) => m.result === "draw").length,
    losses: matches.filter((m) => m.result === "loss").length,
    totalMatches: matches.length,
  };

  const winRate = stats.totalMatches > 0
    ? Math.round((stats.wins / stats.totalMatches) * 100)
    : 0;

  const goalsFor = matches.reduce((sum, m) => sum + m.userScore, 0);
  const goalsAgainst = matches.reduce((sum, m) => sum + m.rivalScore, 0);
  const fifaMatches = matches.filter((m) => m.platform === "FIFA").length;
  const efootballMatches = matches.filter((m) => m.platform === "eFootball").length;

  if (loading) {
    return (
      <div className="min-h-screen pb-20 md:pb-8 md:pt-20 flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 md:pt-20">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <ProfileHeader
              userId={profileData.id}
              username={profileData.username}
              avatarUrl={profileData.avatarUrl}
              favoriteTeam={profileData.favoriteTeam}
              playstyle={profileData.playstyle}
              rankPoints={profileData.rankPoints}
              onUpdateProfile={handleUpdateProfile}
              isOwnProfile={isOwnProfile}
              followersCount={followersCount}
              followingCount={followingCount}
            />
          </div>
          {isOwnProfile && (
            <div className="flex justify-end md:justify-start">
              <NotificationsBell />
            </div>
          )}
        </div>

        {/* Upload Section - Only for own profile */}
        {isOwnProfile && (
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto w-[98vw] md:w-[95vw] lg:w-[90vw] xl:w-full m-4">
              <DialogHeader>
                <DialogTitle>Upload Match Result</DialogTitle>
                <DialogDescription>
                  Enter the match result details manually
                </DialogDescription>
              </DialogHeader>
              <ManualMatchUpload
                onMatchSaved={handleMatchSaved}
                onClose={() => setShowUpload(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Follow Button and Stats - Only for other profiles */}
        {!isOwnProfile && user && (
          <div className="flex items-center gap-6 mb-6">
            <FollowButton 
              userId={viewingUserId} 
              onFollowChange={async (newFollowingState) => {
                // The actual follow/unfollow action is handled by the FollowButton component
                // This callback is just for any additional actions after the state changes
                console.log(`User ${newFollowingState ? 'followed' : 'unfollowed'} profile`, viewingUserId);
              }}
              variant={isFollowing ? "outline" : "default"}
              className="px-6 py-2 text-base"
              // Pass the current follow status to ensure the button is in sync
              initialIsFollowing={isFollowing}
            />
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{followersCount}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{followingCount}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <Tabs defaultValue="leagues" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-7 mb-6 min-w-[600px]">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="leagues" className="text-xs">Leagues</TabsTrigger>
              <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
              <TabsTrigger value="rivalries" className="text-xs">Rivalries</TabsTrigger>
              <TabsTrigger value="followers" className="text-xs">Followers</TabsTrigger>
              <TabsTrigger value="following" className="text-xs">Following</TabsTrigger>
              <TabsTrigger value="gallery" className="text-xs">Gallery</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Upload Section - Always visible for own profile */}
            {isOwnProfile && (
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowUpload(true)} 
                  className="gap-2 text-sm px-3 py-2 h-auto md:text-base md:px-4 md:py-2"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload Match</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              </div>
            )}
            
            {matches.length === 0 ? (
              <EmptyState
                icon={Upload}
                title="No Matches Yet"
                description="Upload your first match result to start tracking your football journey with detailed stats, rivalries, and achievements."
                actionLabel="Record First Match"
                onAction={() => setShowUpload(true)}
              />
            ) : (
              <>
                <CareerStats
                  wins={stats.wins}
                  draws={stats.draws}
                  losses={stats.losses}
                  totalMatches={stats.totalMatches}
                  goalsFor={goalsFor}
                  goalsAgainst={goalsAgainst}
                  fifaMatches={fifaMatches}
                  efootballMatches={efootballMatches}
                />

                <AchievementsBadges
                  totalMatches={stats.totalMatches}
                  wins={stats.wins}
                  goalsScored={goalsFor}
                  winRate={winRate}
                />

                <SquadManager
                  userId={user?.id || ""}
                  squads={squads}
                  onSquadsUpdate={fetchSquads}
                />

                <MyLeagues key={viewingUserId} userId={viewingUserId || ""} isOwnProfile={isOwnProfile} />

                <MatchHistoryFeed 
                matches={matches} 
                onDeleteMatch={handleDeleteMatch}
                showDeleteButtons={isOwnProfile}
              />
              </>
            )}
          </TabsContent>

          {/* Leagues Tab */}
          <TabsContent value="leagues" className="space-y-6">
            <MyLeagues key={viewingUserId} userId={viewingUserId || ""} isOwnProfile={isOwnProfile} />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <CareerStats
              wins={stats.wins}
              draws={stats.draws}
              losses={stats.losses}
              totalMatches={stats.totalMatches}
              goalsFor={goalsFor}
              goalsAgainst={goalsAgainst}
              fifaMatches={fifaMatches}
              efootballMatches={efootballMatches}
            />
            <PerformanceTrends matches={matches} />
          </TabsContent>

          {/* Rivalries Tab */}
          <TabsContent value="rivalries">
            <RivalriesOverview rivalries={rivalries} />
          </TabsContent>

          {/* Followers Tab */}
          <TabsContent value="followers">
            {viewingUserId && <FollowersList userId={viewingUserId} />}
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following">
            {viewingUserId && <FollowingList userId={viewingUserId} />}
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            {isOwnProfile && <VideoUpload />}
            <GalleryTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
