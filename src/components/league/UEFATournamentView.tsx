import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users, Shield, Target, Star, ChevronRight, Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  user_id: string;
  team: string | null;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface Fixture {
  id: string;
  home_user_id: string;
  away_user_id: string;
  home_team: string;
  away_team: string;
  gameweek: number;
  status: string;
  stage?: string;
  result?: {
    home_score: number;
    away_score: number;
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

interface UEFATournamentViewProps {
  members: Member[];
  fixtures: Fixture[];
  themeGradient?: string;
}

export const UEFATournamentView = ({ members, fixtures, themeGradient }: UEFATournamentViewProps) => {
  const [activeStage, setActiveStage] = useState<string>("table_phase");

  // Calculate table phase standings
  const tablePhaseFixtures = useMemo(() => 
    fixtures.filter(f => f.stage === "table_phase"), [fixtures]
  );

  const standings = useMemo(() => {
    const stats: Record<string, {
      team: string;
      profile: any;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      gf: number;
      ga: number;
      gd: number;
      points: number;
    }> = {};

    members.forEach(member => {
      stats[member.user_id] = {
        team: member.team || "Unknown",
        profile: member.profile,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0
      };
    });

    tablePhaseFixtures.forEach(fixture => {
      if (fixture.result && fixture.status === "completed") {
        const homeStats = stats[fixture.home_user_id];
        const awayStats = stats[fixture.away_user_id];

        homeStats.played++;
        awayStats.played++;
        homeStats.gf += fixture.result.home_score;
        homeStats.ga += fixture.result.away_score;
        awayStats.gf += fixture.result.away_score;
        awayStats.ga += fixture.result.home_score;

        if (fixture.result.home_score > fixture.result.away_score) {
          homeStats.won++;
          homeStats.points += 3;
          awayStats.lost++;
        } else if (fixture.result.home_score < fixture.result.away_score) {
          awayStats.won++;
          awayStats.points += 3;
          homeStats.lost++;
        } else {
          homeStats.drawn++;
          awayStats.drawn++;
          homeStats.points += 1;
          awayStats.points += 1;
        }

        homeStats.gd = homeStats.gf - homeStats.ga;
        awayStats.gd = awayStats.gf - awayStats.ga;
      }
    });

    return Object.values(stats)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });
  }, [members, tablePhaseFixtures]);

  // Calculate tournament progress
  const tournamentProgress = useMemo(() => {
    // Only show progress if there are 16+ teams (UEFA requirement)
    if (members.length < 16) {
      return 5; // Default 5% for tournaments with less than 16 teams
    }
    
    const totalFixtures = fixtures.length;
    const completedFixtures = fixtures.filter(f => f.status === "completed").length;
    
    // If no fixtures yet, show 5%
    if (totalFixtures === 0) {
      return 5;
    }
    
    return (completedFixtures / totalFixtures) * 100;
  }, [members.length, fixtures]);

  // Get knockout stage fixtures
  const knockoutStages = useMemo(() => {
    const stages = ["round_of_16", "quarter_final", "semi_final", "final"];
    return stages.map(stage => ({
      name: stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      fixtures: fixtures.filter(f => f.stage === stage),
      completed: fixtures.filter(f => f.stage === stage && f.status === "completed").length
    }));
  }, [fixtures]);

  return (
    <div className="space-y-6 opacity-100">
      {/* Tournament Header */}
      <Card className="border-2 shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full">
                <Trophy className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  UEFA Tournament
                </h2>
                <p className="text-muted-foreground mt-1">
                  Table Phase + Knockout Stages
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" />
                <span className="font-semibold">{members.length} Teams</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {fixtures.filter(f => f.status === "completed").length} / {fixtures.length} Matches
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-blue-900">
                {members.length < 16 ? "UEFA Tournament Requirement" : "Tournament Progress"}
              </span>
              <span className="font-bold text-blue-700">
                {members.length < 16 
                  ? `${members.length}/16 Teams` 
                  : `${tournamentProgress.toFixed(0)}%`
                }
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out shadow-lg",
                  members.length < 16 
                    ? "bg-gradient-to-r from-gray-400 to-gray-500" 
                    : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
                )}
                style={{ width: `${tournamentProgress}%` }}
              >
                <div className="h-full bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
              </div>
            </div>
            {members.length < 16 && (
              <p className="text-xs text-amber-600 mt-2 font-medium">
                UEFA tournaments require 16 teams minimum. Current: {members.length}/16
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stage Navigation */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <Button
          variant={activeStage === "table_phase" ? "default" : "ghost"}
          onClick={() => setActiveStage("table_phase")}
          className="flex-1"
        >
          <Target className="w-4 h-4 mr-2" />
          Table Phase
        </Button>
        <Button
          variant={activeStage === "knockout" ? "default" : "ghost"}
          onClick={() => setActiveStage("knockout")}
          className="flex-1"
        >
          <Trophy className="w-4 h-4 mr-2" />
          Knockout
        </Button>
      </div>

      {/* Table Phase */}
      {activeStage === "table_phase" && (
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Table Phase Standings
              <Badge variant="outline" className="ml-2">
                1-8 Auto-Qualify to R16
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-separate border-spacing-0">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
                    <th className="text-left p-3 font-bold text-sm border-r border-blue-800">#</th>
                    <th className="text-left p-3 font-bold text-sm border-r border-blue-800">Team</th>
                    <th className="text-center p-3 font-bold text-sm border-r border-blue-800">Player</th>
                    <th className="text-center p-3 font-bold text-sm border-r border-blue-800">P</th>
                    <th className="text-center p-3 font-bold text-sm border-r border-blue-800">W</th>
                    <th className="text-center p-3 font-bold text-sm border-r border-blue-800">D</th>
                    <th className="text-center p-3 font-bold text-sm border-r border-blue-800">L</th>
                    <th className="text-center p-3 font-bold text-sm border-r border-blue-800">GD</th>
                    <th className="text-center p-3 font-bold text-sm">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, index) => {
                    const isQualified = index < 8;
                    const isPlayoff = index >= 8 && index < 16;
                    
                    return (
                      <tr
                        key={team.profile?.username || index}
                        className={cn(
                          "border-b transition-all hover:opacity-90",
                          index % 2 === 0 ? "bg-slate-50" : "bg-white",
                          isQualified && "bg-gradient-to-r from-emerald-50 to-teal-50",
                          isPlayoff && "bg-gradient-to-r from-amber-50 to-orange-50"
                        )}
                      >
                        <td className="p-3 border-r border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-bold text-lg w-6 text-center",
                              isQualified && "text-emerald-700",
                              isPlayoff && "text-amber-700",
                              !isQualified && !isPlayoff && "text-slate-700"
                            )}>
                              {index + 1}
                            </span>
                            {isQualified && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                            {isPlayoff && <Star className="w-4 h-4 text-amber-600" />}
                          </div>
                        </td>
                        <td className="p-3 border-r border-gray-200">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={team.profile?.avatar_url || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold">
                                {team.profile?.username?.charAt(0).toUpperCase() || "T"}
                              </AvatarFallback>
                            </Avatar>
                            <span className={cn(
                              "font-medium text-sm",
                              isQualified && "text-emerald-800 font-semibold",
                              isPlayoff && "text-amber-800 font-semibold",
                              !isQualified && !isPlayoff && "text-slate-800"
                            )}>
                              {team.team}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-600 border-r border-gray-200">
                          {team.profile?.username || "Player"}
                        </td>
                        <td className="p-3 text-center font-medium text-sm text-slate-700 border-r border-gray-200">{team.played}</td>
                        <td className="p-3 text-center font-medium text-sm text-slate-700 border-r border-gray-200">{team.won}</td>
                        <td className="p-3 text-center font-medium text-sm text-slate-700 border-r border-gray-200">{team.drawn}</td>
                        <td className="p-3 text-center font-medium text-sm text-slate-700 border-r border-gray-200">{team.lost}</td>
                        <td className="p-3 text-center font-medium text-sm text-slate-700 border-r border-gray-200">{team.gf}/{team.ga}</td>
                        <td className="p-3 text-center font-bold text-sm">
                          <span className={cn(
                            isQualified && "text-emerald-700 text-lg",
                            isPlayoff && "text-amber-700 text-lg",
                            !isQualified && !isPlayoff && "text-slate-700"
                          )}>
                            {team.points}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knockout Stages */}
      {activeStage === "knockout" && (
        <div className="space-y-6">
          {knockoutStages.map(stage => (
            <Card key={stage.name} className="border-2 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {stage.name}
                  </div>
                  <Badge variant="outline">
                    {stage.completed} / {stage.fixtures.length} Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stage.fixtures.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Stage not started yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stage.fixtures.map(fixture => (
                      <div
                        key={fixture.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border transition-all",
                          fixture.status === "completed" 
                            ? "bg-green-50 border-green-200" 
                            : "bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={fixture.home_profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {fixture.home_profile?.username?.charAt(0).toUpperCase() || "H"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{fixture.home_team}</span>
                        </div>

                        <div className="flex items-center gap-3 px-4">
                          {fixture.status === "completed" ? (
                            <div className="flex items-center gap-2 font-bold">
                              <span>{fixture.result?.home_score}</span>
                              <span className="text-muted-foreground">-</span>
                              <span>{fixture.result?.away_score}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">vs</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <span className="font-medium">{fixture.away_team}</span>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={fixture.away_profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {fixture.away_profile?.username?.charAt(0).toUpperCase() || "A"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tournament Info */}
      <Card className="border-2 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Tournament Format
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Table Phase
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5" />
                  All teams play each other once
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5" />
                  3 points for win, 1 for draw
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5" />
                  Positions 1-8 auto-qualify to R16
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5" />
                  Positions 9-16 enter playoffs
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Knockout Stages
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5" />
                  Round of 16 (16 teams)
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5" />
                  Quarter-finals (8 teams)
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5" />
                  Semi-finals (4 teams)
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5" />
                  Final (2 teams) - Winner takes all
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UEFATournamentView;
