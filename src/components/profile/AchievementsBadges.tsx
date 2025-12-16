import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Shield, Flame, Award, Star } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  earnedAt?: string;
}

interface AchievementsBadgesProps {
  totalMatches: number;
  wins: number;
  goalsScored: number;
  winRate: number;
}

export const AchievementsBadges = ({
  totalMatches,
  wins,
  goalsScored,
  winRate,
}: AchievementsBadgesProps) => {
  const achievements: Achievement[] = [
    {
      id: "first_win",
      title: "First Victory",
      description: "Win your first match",
      icon: "trophy",
      unlocked: wins >= 1,
    },
    {
      id: "10_wins",
      title: "Winning Streak",
      description: "Achieve 10 total wins",
      icon: "target",
      unlocked: wins >= 10,
    },
    {
      id: "50_matches",
      title: "Veteran Player",
      description: "Play 50 matches",
      icon: "award",
      unlocked: totalMatches >= 50,
    },
    {
      id: "100_goals",
      title: "Century",
      description: "Score 100 goals",
      icon: "flame",
      unlocked: goalsScored >= 100,
    },
    {
      id: "75_win_rate",
      title: "Dominator",
      description: "Maintain 75%+ win rate",
      icon: "star",
      unlocked: winRate >= 75 && totalMatches >= 10,
    },
    {
      id: "clean_sheets",
      title: "Defensive Wall",
      description: "Keep 10 clean sheets",
      icon: "shield",
      unlocked: false, // TODO: Calculate from match data
    },
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "trophy":
        return Trophy;
      case "target":
        return Target;
      case "shield":
        return Shield;
      case "flame":
        return Flame;
      case "award":
        return Award;
      case "star":
        return Star;
      default:
        return Trophy;
    }
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="mb-8 animate-fade-in delay-400">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Achievements
        </h2>
        <Badge variant="outline">
          {unlockedCount} / {achievements.length} Unlocked
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <TooltipProvider>
          {achievements.map((achievement) => {
            const Icon = getIcon(achievement.icon);
            return (
              <Tooltip key={achievement.id}>
                <TooltipTrigger asChild>
                  <Card
                    className={`p-6 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
                      achievement.unlocked
                        ? "hover:scale-110 hover:shadow-card-custom bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30"
                        : "opacity-40 grayscale"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        achievement.unlocked
                          ? "bg-gradient-primary"
                          : "bg-muted"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          achievement.unlocked
                            ? "text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <p className="text-xs font-semibold">{achievement.title}</p>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="bg-card border-border">
                  <div className="max-w-[200px]">
                    <p className="font-semibold mb-1">{achievement.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                    {achievement.unlocked && achievement.earnedAt && (
                      <p className="text-xs text-success mt-2">
                        Unlocked: {achievement.earnedAt}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
};
