import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { EmptyState } from "../components/EmptyState";
import { Trophy, Crown, Medal, Users } from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../contexts/AuthContext";

const League = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Fetch league data and compute player stats
  async function fetchLeagueData() {
    let mounted = true;
    try {
      // Fetch all matches
      const { data: matches, error } = await supabase
        .from("matches")
        .select("user_id, result, user_score, rival_score");

      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }

      // Calculate stats per user
      const userStats: { [key: string]: any } = {};

      (matches ?? []).forEach((match: any) => {
        if (!userStats[match.user_id]) {
          userStats[match.user_id] = {
            userId: match.user_id,
            matches: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
          };
        }

        const stats = userStats[match.user_id];
        stats.matches++;
        stats.goalsFor += Number(match.user_score ?? 0);
        stats.goalsAgainst += Number(match.rival_score ?? 0);

        if (match.result === "win") stats.wins++;
        else if (match.result === "draw") stats.draws++;
        else stats.losses++;
      });

      // Convert to array and calculate points
      const playersArray = Object.values(userStats).map((stats: any) => ({
        ...stats,
        points: stats.wins * 3 + stats.draws,
        goalDifference: stats.goalsFor - stats.goalsAgainst,
        isCurrentUser: stats.userId === user?.id,
      }));

      if (playersArray.length === 0) {
        if (mounted) setPlayers([]);
        return;
      }

      // Fetch profiles for display names only if we have user IDs
      const userIds = playersArray.map((p) => p.userId);
      let profiles: any[] | undefined = [];
      if (userIds.length > 0) {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        if (profileError) {
          console.error("Error fetching profiles:", profileError);
        } else {
          profiles = data as any[] | undefined;
        }
      }

      const playersWithNames = playersArray.map((player: any) => {
        const profile = profiles?.find((p) => p.id === player.userId);
        return {
          ...player,
          name: player.isCurrentUser ? "You" : profile?.username || "Player",
        };
      });

      if (mounted) setPlayers(playersWithNames);
    } catch (err) {
      console.error("fetchLeagueData error:", err);
    } finally {
      if (mounted) setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }

  useEffect(() => {
    fetchLeagueData();
  }, [user]);

  // Sort by points, then goal difference
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.goalDifference - a.goalDifference;
  });

  const hasEnoughPlayers = sortedPlayers.length >= 3;

  const getPositionIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-secondary" />;
    if (index === 1) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (index === 2) return <Medal className="w-5 h-5 text-warning" />;
    return null;
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 md:pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">League Table</h1>
          <p className="text-muted-foreground">Competitive rankings and standings</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse">Loading league table...</div>
          </div>
        ) : !hasEnoughPlayers ? (
          <EmptyState
            icon={Users}
            title="League Table Locked"
            description="League Table unlocks once 3 or more players have logged matches. Upload matches and invite friends to start competing!"
          />
        ) : (
          <Card className="overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-primary p-4 text-primary-foreground">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                <h2 className="text-xl font-bold">Season Rankings</h2>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {sortedPlayers.map((player, index) => (
                  <Card key={player.userId} className={cn(
                    "p-4",
                    player.isCurrentUser && "border-primary bg-primary/5",
                    index === 0 && "border-secondary bg-secondary/5"
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{index + 1}</span>
                          {getPositionIcon(index)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{player.name}</span>
                            {player.isCurrentUser && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{player.points}</div>
                        <div className="text-xs text-muted-foreground">pts</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">MP:</span>
                        <span>{player.matches}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">W:</span>
                        <span className="text-success">{player.wins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">D:</span>
                        <span className="text-draw">{player.draws}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">L:</span>
                        <span className="text-destructive">{player.losses}</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-muted-foreground">GD:</span>
                        <span className={cn(
                          player.goalDifference > 0 && "text-success",
                          player.goalDifference < 0 && "text-destructive"
                        )}>
                          {player.goalDifference > 0 ? "+" : ""}
                          {player.goalDifference}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <table className="w-full hidden md:table">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm">Pos</th>
                    <th className="text-left p-4 font-semibold text-sm">Player</th>
                    <th className="text-center p-4 font-semibold text-sm">MP</th>
                    <th className="text-center p-4 font-semibold text-sm">W</th>
                    <th className="text-center p-4 font-semibold text-sm">D</th>
                    <th className="text-center p-4 font-semibold text-sm">L</th>
                    <th className="text-center p-4 font-semibold text-sm">GD</th>
                    <th className="text-center p-4 font-semibold text-sm">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player, index) => (
                    <tr
                      key={player.userId}
                      className={cn(
                        "border-b border-border hover:bg-muted/30 transition-colors",
                        player.isCurrentUser && "bg-primary/5 font-semibold",
                        index === 0 && "bg-secondary/5"
                      )}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{index + 1}</span>
                          {getPositionIcon(index)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span>{player.name}</span>
                          {player.isCurrentUser && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center p-4">{player.matches}</td>
                      <td className="text-center p-4 text-success">{player.wins}</td>
                      <td className="text-center p-4 text-draw">{player.draws}</td>
                      <td className="text-center p-4 text-destructive">{player.losses}</td>
                      <td
                        className={cn(
                          "text-center p-4",
                          player.goalDifference > 0 && "text-success",
                          player.goalDifference < 0 && "text-destructive"
                        )}
                      >
                        {player.goalDifference > 0 ? "+" : ""}
                        {player.goalDifference}
                      </td>
                      <td className="text-center p-4">
                        <span className="font-bold text-lg">{player.points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
              <p className="mb-2 font-semibold">Points System:</p>
              <div className="flex flex-wrap gap-4">
                <span>Win = 3 pts</span>
                <span>Draw = 1 pt</span>
                <span>Loss = 0 pts</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default League;
