import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "./FollowButton";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  favorite_team: string | null;
  rank_points: number;
}

interface FollowingListProps {
  userId: string;
}

export const FollowingList = ({ userId }: FollowingListProps) => {
  const [following, setFollowing] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFollowing();
  }, [userId]);

  const fetchFollowing = async () => {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          following_id,
          profiles!follows_following_id_fkey(
            id,
            username,
            avatar_url,
            favorite_team,
            rank_points
          )
        `)
        .eq("follower_id", userId);

      if (error) throw error;

      const profilesData = data
        .map((f: any) => f.profiles)
        .filter((p): p is Profile => p !== null);
      
      setFollowing(profilesData);
    } catch (error) {
      console.error("Error fetching following:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (following.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Not following anyone yet
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {following.map((profile) => (
        <Card key={profile.id} className="hover:bg-accent/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div 
              className="flex items-center gap-4 cursor-pointer flex-1"
              onClick={() => navigate(`/profile?userId=${profile.id}`)}
            >
              <Avatar className="w-12 h-12">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>
                  {profile.username?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{profile.username || "Anonymous"}</p>
                {profile.favorite_team && (
                  <p className="text-sm text-muted-foreground">{profile.favorite_team}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {profile.rank_points} rank points
                </p>
              </div>
            </div>
            <FollowButton userId={profile.id} size="sm" variant="outline" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
