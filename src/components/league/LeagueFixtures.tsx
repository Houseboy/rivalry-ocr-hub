import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Fixture {
  id: string;
  home_user_id: string;
  away_user_id: string;
  home_team: string;
  away_team: string;
  gameweek: number;
  scheduled_date: string | null;
  status: string;
  home_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  away_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  result?: {
    home_score: number;
    away_score: number;
  };
}

interface LeagueFixturesProps {
  fixtures: Fixture[];
  themeGradient?: string;
  currentUserId?: string;
}

export const LeagueFixtures = ({ 
  fixtures, 
  themeGradient,
  currentUserId 
}: LeagueFixturesProps) => {
  const [selectedGameweek, setSelectedGameweek] = useState<number | null>(null);
  
  const gameweeks = [...new Set(fixtures.map(f => f.gameweek))].sort((a, b) => a - b);
  const filteredFixtures = selectedGameweek 
    ? fixtures.filter(f => f.gameweek === selectedGameweek)
    : fixtures;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="font-medium text-green-600">Completed</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 font-medium animate-pulse">Live</Badge>;
      case "postponed":
        return <Badge variant="secondary" className="bg-red-500/20 text-red-600 font-medium">Postponed</Badge>;
      default:
        return <Badge variant="outline" className="font-medium">Scheduled</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Gameweek Filter */}
      {gameweeks.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedGameweek(null)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
              selectedGameweek === null
                ? themeGradient 
                  ? cn("bg-gradient-to-r text-white shadow-md", themeGradient)
                  : "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            All
          </button>
          {gameweeks.map(gw => (
            <button
              key={gw}
              onClick={() => setSelectedGameweek(gw)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
                selectedGameweek === gw
                  ? themeGradient 
                    ? cn("bg-gradient-to-r text-white shadow-md", themeGradient)
                    : "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              GW {gw}
            </button>
          ))}
        </div>
      )}

      {/* Fixtures List */}
      <div className="space-y-3">
        {filteredFixtures.map((fixture) => {
          const isUserMatch = fixture.home_user_id === currentUserId || fixture.away_user_id === currentUserId;
          
          return (
            <Card 
              key={fixture.id}
              className={cn(
                "overflow-hidden transition-all duration-200 hover:shadow-lg",
                isUserMatch && "ring-2 ring-primary/30"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs font-medium">
                      GW {fixture.gameweek}
                    </Badge>
                    {fixture.scheduled_date && (
                      <>
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(fixture.scheduled_date), "MMM d, yyyy")}</span>
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(fixture.scheduled_date), "HH:mm")}</span>
                      </>
                    )}
                  </div>
                  {getStatusBadge(fixture.status)}
                </div>

                <div className="flex items-center justify-between gap-4">
                  {/* Home Team */}
                  <div className="flex-1 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={fixture.home_profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                        {fixture.home_profile?.username?.charAt(0).toUpperCase() || "H"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-right flex-1">
                      <p className={cn(
                        "font-semibold text-sm",
                        fixture.home_user_id === currentUserId && "text-primary"
                      )}>
                        {fixture.home_team}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fixture.home_user_id === currentUserId ? "You" : fixture.home_profile?.username || "Player"}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                    fixture.status === "completed" 
                      ? "bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg"
                      : "bg-muted"
                  )}>
                    <span className="text-sm font-medium px-2">vs</span>
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1">
                      <p className={cn(
                        "font-semibold text-sm",
                        fixture.away_user_id === currentUserId && "text-primary"
                      )}>
                        {fixture.away_team}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fixture.away_user_id === currentUserId ? "You" : fixture.away_profile?.username || "Player"}
                      </p>
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={fixture.away_profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold">
                        {fixture.away_profile?.username?.charAt(0).toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {filteredFixtures.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No fixtures available.
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueFixtures;
