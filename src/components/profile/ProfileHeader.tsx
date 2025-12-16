import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Settings, Edit, Trophy, Users } from "lucide-react";
import { EditProfileDialog } from "./EditProfileDialog";
import { FollowButton } from "./FollowButton";
import { NotificationsBell } from "./NotificationsBell";
import { useFollowStats } from "@/hooks/useFollowStats";

interface ProfileHeaderProps {
  userId?: string;
  username?: string;
  avatarUrl?: string;
  favoriteTeam?: string;
  playstyle?: string;
  rankPoints: number;
  onUpdateProfile: (data: any) => void;
  isOwnProfile?: boolean;
  followersCount?: number;
  followingCount?: number;
}

export const ProfileHeader = ({
  userId,
  username,
  avatarUrl,
  favoriteTeam,
  playstyle = "Balanced",
  rankPoints,
  onUpdateProfile,
  isOwnProfile = false,
  followersCount = 0,
  followingCount = 0,
}: ProfileHeaderProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);

  return (
    <>
      <Card className="p-6 mb-8 animate-fade-in">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-primary transition-all duration-300 group-hover:scale-105">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer">
              <Edit className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{username || "Player"}</h1>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {rankPoints} pts
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {favoriteTeam && (
                <Badge variant="outline" className="text-sm">
                  🏆 {favoriteTeam}
                </Badge>
              )}
              <Badge variant="outline" className="text-sm">
                ⚽ {playstyle}
              </Badge>
            </div>

            <div className="flex gap-4 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{followersCount}</span>
                <span className="text-muted-foreground">Followers</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{followingCount}</span>
                <span className="text-muted-foreground">Following</span>
              </div>
            </div>

            <p className="text-muted-foreground">
              Track your journey, showcase your victories
            </p>
          </div>

          <div className="flex gap-2">
            {isOwnProfile ? (
              <>
                <NotificationsBell />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Settings className="w-5 h-5" />
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowEditDialog(true)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Button>
              </>
            ) : (
              userId && <FollowButton userId={userId} />
            )}
          </div>
        </div>
      </Card>

      <EditProfileDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        currentData={{
          username,
          avatarUrl,
          favoriteTeam,
          playstyle,
        }}
        onSave={onUpdateProfile}
      />
    </>
  );
};
