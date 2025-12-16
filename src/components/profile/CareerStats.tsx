import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Shield, TrendingUp } from "lucide-react";

interface CareerStatsProps {
  wins: number;
  draws: number;
  losses: number;
  totalMatches: number;
  goalsFor: number;
  goalsAgainst: number;
  fifaMatches: number;
  efootballMatches: number;
}

export const CareerStats = ({
  wins,
  draws,
  losses,
  totalMatches,
  goalsFor,
  goalsAgainst,
  fifaMatches,
  efootballMatches,
}: CareerStatsProps) => {
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const goalDiff = goalsFor - goalsAgainst;

  const stats = [
    {
      title: "Matches Played",
      value: totalMatches,
      icon: Trophy,
      color: "text-primary",
    },
    {
      title: "Win Rate",
      value: `${winRate}%`,
      icon: Target,
      color: "text-success",
      progress: winRate,
    },
    {
      title: "Goal Difference",
      value: goalDiff > 0 ? `+${goalDiff}` : goalDiff,
      icon: TrendingUp,
      color: goalDiff >= 0 ? "text-success" : "text-destructive",
    },
    {
      title: "Clean Sheets",
      value: "0",
      icon: Shield,
      color: "text-warning",
    },
  ];

  return (
    <div className="mb-8 animate-fade-in delay-100">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-primary" />
        Career Statistics
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="p-4 hover:shadow-card-custom transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
            {stat.progress !== undefined && (
              <Progress value={stat.progress} className="mt-2 h-2" />
            )}
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 text-center bg-success/5 border-success/30">
          <p className="text-2xl font-bold text-success">{wins}</p>
          <p className="text-sm text-muted-foreground">Wins</p>
        </Card>
        <Card className="p-4 text-center bg-draw/5 border-draw/30">
          <p className="text-2xl font-bold text-draw">{draws}</p>
          <p className="text-sm text-muted-foreground">Draws</p>
        </Card>
        <Card className="p-4 text-center bg-destructive/5 border-destructive/30">
          <p className="text-2xl font-bold text-destructive">{losses}</p>
          <p className="text-sm text-muted-foreground">Losses</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Platform Split</p>
          <div className="flex items-center justify-between">
            <span className="font-semibold">FIFA: {fifaMatches}</span>
            <span className="text-muted-foreground">|</span>
            <span className="font-semibold">eFootball: {efootballMatches}</span>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Goals</p>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-success">For: {goalsFor}</span>
            <span className="text-muted-foreground">|</span>
            <span className="font-semibold text-destructive">Against: {goalsAgainst}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
