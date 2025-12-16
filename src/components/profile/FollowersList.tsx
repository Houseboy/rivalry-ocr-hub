import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FollowButton } from "./FollowButton";
import { useNavigate } from "react-router-dom";
import { Search, Users, Trophy, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  favorite_team: string | null;
  rank_points: number;
  created_at?: string;
}

interface FollowersListProps {
  userId: string;
}

export const FollowersList = ({ userId }: FollowersListProps) => {
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [filteredFollowers, setFilteredFollowers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "rank" | "name">("recent");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  useEffect(() => {
    filterAndSortFollowers();
  }, [followers, searchTerm, sortBy]);

  const fetchFollowers = async () => {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          follower_id,
          created_at,
          profiles!follows_follower_id_fkey(
            id,
            username,
            avatar_url,
            favorite_team,
            rank_points
          )
        `)
        .eq("following_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const profilesData = data
        .map((f: any) => ({
          ...f.profiles,
          created_at: f.created_at
        }))
        .filter((p): p is Profile => p !== null);
      
      setFollowers(profilesData);
    } catch (error) {
      console.error("Error fetching followers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortFollowers = () => {
    let filtered = followers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(follower =>
        follower.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        follower.favorite_team?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort followers
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rank":
          return b.rank_points - a.rank_points;
        case "name":
          return (a.username || "").localeCompare(b.username || "");
        case "recent":
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    setFilteredFollowers(filtered);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search followers..."
              className="pl-10"
              disabled
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <Users className="mr-2 h-4 w-4" />
              Recent
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-muted" />
                      <div className="h-3 w-24 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="h-9 w-20 rounded-md bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const displayFollowers = searchTerm || sortBy !== "recent" ? filteredFollowers : followers;

  if (followers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No followers yet</h3>
        <p className="text-muted-foreground text-sm mt-1">
          When someone follows you, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search followers..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={sortBy === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("recent")}
            className="shrink-0"
          >
            <Users className="mr-2 h-4 w-4" />
            Recent
          </Button>
          <Button
            variant={sortBy === "rank" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("rank")}
            className="shrink-0"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Rank
          </Button>
          <Button
            variant={sortBy === "name" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("name")}
            className="shrink-0"
          >
            A-Z
          </Button>
        </div>
      </div>

      {displayFollowers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No matching followers</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {displayFollowers.map((follower) => (
            <Card 
              key={follower.id} 
              className="hover:bg-accent/50 transition-colors overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4">
                  <div 
                    className="flex items-center gap-4 cursor-pointer flex-1 group"
                    onClick={() => navigate(`/profile?userId=${follower.id}`)}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                        <AvatarImage src={follower.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted">
                          {follower.username?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "absolute -bottom-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold",
                          {
                            "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400": follower.rank_points >= 1000,
                            "bg-purple-500/20 text-purple-600 dark:text-purple-400": 
                              follower.rank_points >= 500 && follower.rank_points < 1000,
                            "bg-blue-500/20 text-blue-600 dark:text-blue-400": 
                              follower.rank_points >= 100 && follower.rank_points < 500,
                            "bg-muted-foreground/10 text-muted-foreground": follower.rank_points < 100
                          }
                        )}
                      >
                        {follower.rank_points >= 1000 ? '★' : follower.rank_points}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">
                          {follower.username || "Anonymous"}
                        </p>
                      </div>
                      {follower.favorite_team && (
                        <p className="text-sm text-muted-foreground truncate">
                          {follower.favorite_team}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className="text-xs h-5 px-1.5 py-0.5 font-normal"
                        >
                          {follower.rank_points} pts
                        </Badge>
                        {sortBy === "recent" && follower.created_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(follower.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <FollowButton 
                      userId={follower.id} 
                      size="sm" 
                      variant="outline"
                      showStats={false}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
