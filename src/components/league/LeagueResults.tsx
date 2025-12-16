import { useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Result {
  id: string;
  home_user_id: string;
  away_user_id: string;
  home_score: number;
  away_score: number;
  played_at: string;
  fixture?: {
    home_team: string;
    away_team: string;
    gameweek: number;
  };
  home_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  away_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface LeagueResultsProps {
  results: Result[];
  themeGradient?: string;
  currentUserId?: string;
}

export const LeagueResults = ({ 
  results, 
  themeGradient,
  currentUserId 
}: LeagueResultsProps) => {
  // Group results by gameweek
  const resultsByGameweek = useMemo(() => {
    const grouped: Record<number, Result[]> = {};
    
    results.forEach(result => {
      const gameweek = result.fixture?.gameweek || 0;
      if (!grouped[gameweek]) {
        grouped[gameweek] = [];
      }
      grouped[gameweek].push(result);
    });

    // Sort gameweeks in descending order (newest first)
    return Object.entries(grouped)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([gameweek, gameweekResults]) => ({
        gameweek: parseInt(gameweek),
        results: gameweekResults.sort((a, b) => 
          new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
        )
      }));
  }, [results]);

  const getMatchOutcome = (result: Result) => {
    if (!currentUserId) return null;
    
    const isHome = result.home_user_id === currentUserId;
    const isAway = result.away_user_id === currentUserId;
    
    if (!isHome && !isAway) return null;
    
    if (result.home_score === result.away_score) return "draw";
    if (isHome && result.home_score > result.away_score) return "win";
    if (isAway && result.away_score > result.home_score) return "win";
    return "loss";
  };

  return (
    <div className="space-y-6">
      {resultsByGameweek.map(({ gameweek, results: gameweekResults }) => (
        <div key={gameweek}>
          {/* Gameweek Header */}
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="text-lg font-bold px-3 py-1">
              GW {gameweek}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {gameweekResults.length} matches
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(gameweekResults[0]?.played_at), "MMM d, yyyy")}
            </span>
          </div>

          {/* Gameweek Results */}
          <div className="space-y-3">
            {gameweekResults.map((result) => {
              const outcome = getMatchOutcome(result);
              const isUserMatch = result.home_user_id === currentUserId || result.away_user_id === currentUserId;
              
              return (
                <Card 
                  key={result.id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    outcome === "win" && "ring-1 ring-green-500/30",
                    outcome === "loss" && "ring-1 ring-red-500/30",
                    outcome === "draw" && "ring-1 ring-muted-foreground/30"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Home Team */}
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={result.home_profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {result.home_profile?.username?.charAt(0).toUpperCase() || "H"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-right flex-1">
                          <p className={cn(
                            "font-semibold text-sm",
                            result.home_user_id === currentUserId && "text-primary",
                            result.home_score > result.away_score && "flex items-center justify-end gap-1"
                          )}>
                            {result.fixture?.home_team || "Home"}
                            {result.home_score > result.away_score && (
                              <Trophy className="w-3 h-3 text-yellow-500" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.home_user_id === currentUserId ? "You" : result.home_profile?.username || "Player"}
                          </p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-lg min-w-[80px] justify-center",
                        themeGradient 
                          ? cn("bg-gradient-to-r text-white", themeGradient)
                          : "bg-primary text-primary-foreground"
                      )}>
                        <span className="text-lg font-bold">{result.home_score}</span>
                        <span className="text-sm">-</span>
                        <span className="text-lg font-bold">{result.away_score}</span>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <p className={cn(
                            "font-semibold text-sm",
                            result.away_user_id === currentUserId && "text-primary",
                            result.away_score > result.home_score && "flex items-center gap-1"
                          )}>
                            {result.away_score > result.home_score && (
                              <Trophy className="w-3 h-3 text-yellow-500" />
                            )}
                            {result.fixture?.away_team || "Away"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.away_user_id === currentUserId ? "You" : result.away_profile?.username || "Player"}
                          </p>
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={result.away_profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {result.away_profile?.username?.charAt(0).toUpperCase() || "A"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    
                    {/* Outcome Badge - Positioned below to not affect alignment */}
                    {outcome && (
                      <div className="mt-3 flex justify-center">
                        <span className={cn(
                          "text-xs font-bold uppercase px-3 py-1 rounded-full",
                          outcome === "win" && "bg-green-500/20 text-green-600 border border-green-500/30",
                          outcome === "loss" && "bg-red-500/20 text-red-600 border border-red-500/30",
                          outcome === "draw" && "bg-muted text-muted-foreground border border-muted-foreground/30"
                        )}>
                          {outcome}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
      
      {results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No results available yet</p>
        </div>
      )}
    </div>
  );
};

export default LeagueResults;
