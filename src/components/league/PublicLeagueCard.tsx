import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Lock, Play, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeagueIcon } from "./LeagueIcon";

interface PublicLeagueCardProps {
  id: string;
  name: string;
  description?: string;
  leagueType: string;
  selectedTeam: string;
  currentParticipants: number;
  maxParticipants: number;
  hasStarted: boolean;
  isPublic: boolean;
  onJoin?: () => void;
  onView?: () => void;
  isUserMember?: boolean;
}

const getLeagueTheme = (leagueType: string) => {
  const themes = {
    "Premier League": {
      gradient: "from-slate-900 via-blue-900 to-slate-950",
      accent: "#1E3A8A"
    },
    "La Liga": {
      gradient: "from-orange-500 via-red-500 to-pink-500", 
      accent: "#FF6B35"
    },
    "Serie A": {
      gradient: "from-blue-600 via-blue-500 to-cyan-500",
      accent: "#0066CC"
    },
    "Bundesliga": {
      gradient: "from-red-600 via-red-500 to-rose-500",
      accent: "#DC143C"
    },
    "Ligue 1": {
      gradient: "from-blue-700 via-blue-600 to-indigo-600",
      accent: "#0055A4"
    }
  };
  return themes[leagueType as keyof typeof themes] || themes["Premier League"];
};

export const PublicLeagueCard = ({
  id,
  name,
  description,
  leagueType,
  selectedTeam,
  currentParticipants,
  maxParticipants,
  hasStarted,
  isPublic,
  onJoin,
  onView,
  isUserMember = false
}: PublicLeagueCardProps) => {
  const theme = getLeagueTheme(leagueType);
  const isFull = currentParticipants >= maxParticipants;
  const canJoin = !isUserMember && !hasStarted && !isFull && isPublic;

  const getJoinStatus = () => {
    if (isUserMember) return { text: "Joined", variant: "secondary" as const, disabled: true };
    if (hasStarted) return { text: "Started", variant: "secondary" as const, disabled: true };
    if (isFull) return { text: "Full", variant: "destructive" as const, disabled: true };
    return { text: "Join", variant: "default" as const, disabled: false };
  };

  const joinStatus = getJoinStatus();
  const fillPercentage = (currentParticipants / maxParticipants) * 100;

  return (
    <Card 
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
        "border-0 bg-gradient-to-br",
        theme.gradient
      )}
    >
      <div className="p-6 text-white relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3" />
        </div>

        {/* Header */}
        <div className="relative z-10 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {!isPublic && <Lock className="w-4 h-4 text-white/80" />}
              {hasStarted && <Play className="w-4 h-4 text-white/80" />}
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                {hasStarted ? "In Progress" : isFull ? "Full" : "Open"}
              </Badge>
            </div>
            <Trophy className="w-5 h-5 text-white/80" />
          </div>
          
          <h3 className="text-xl font-bold mb-2 line-clamp-2">{name}</h3>
          {description && (
            <p className="text-sm text-white/80 line-clamp-2 mb-3">{description}</p>
          )}
        </div>

        {/* League Icon */}
        <div className="relative z-10 mb-4">
          <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <LeagueIcon 
              icon={selectedTeam}
              alt={name}
              size="md"
              className="w-12 h-12 object-contain"
            />
          </div>
        </div>

        {/* Participants */}
        <div className="relative z-10 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-white/90" />
              <span className="text-sm font-medium text-white/90">
                {currentParticipants}/{maxParticipants} players
              </span>
            </div>
            <span className="text-xs text-white/70">
              {Math.round(fillPercentage)}% full
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                isFull ? "bg-red-400" : hasStarted ? "bg-yellow-400" : "bg-green-400"
              )}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="relative z-10 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
            onClick={onView}
          >
            <ArrowRight className="w-4 h-4 mr-1" />
            View
          </Button>
          {onJoin && (
            <Button 
              size="sm" 
              className="flex-1 bg-gradient-to-r from-white/20 to-white/10 border border-white/30 text-white hover:from-white/30 hover:to-white/20 hover:border-white/40 backdrop-blur-sm font-medium"
              variant={joinStatus.variant}
              disabled={joinStatus.disabled}
              onClick={onJoin}
            >
              {joinStatus.text}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PublicLeagueCard;
