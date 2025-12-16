import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Standing {
  user_id: string;
  team: string | null;
  username: string | null;
  avatar_url: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

interface LeagueStandingsTableProps {
  standings: Standing[];
  themeGradient?: string;
  currentUserId?: string;
}

export const LeagueStandingsTable = ({ 
  standings, 
  themeGradient,
  currentUserId 
}: LeagueStandingsTableProps) => {
  const getPositionStyle = (position: number) => {
    if (position === 1) return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    if (position === 2) return "bg-gray-400/20 text-gray-400 border-gray-400/30";
    if (position === 3) return "bg-amber-600/20 text-amber-600 border-amber-600/30";
    if (position <= 4) return "bg-green-500/10 text-green-500 border-green-500/30";
    return "bg-muted text-muted-foreground border-border";
  };

  const getFormBadges = (wins: number, draws: number, losses: number) => {
    // Simple form representation based on recent-ish results
    const total = Math.min(wins + draws + losses, 5);
    const form: string[] = [];
    for (let i = 0; i < Math.min(wins, 5 - form.length); i++) form.push("W");
    for (let i = 0; i < Math.min(draws, 5 - form.length); i++) form.push("D");
    for (let i = 0; i < Math.min(losses, 5 - form.length); i++) form.push("L");
    return form.slice(0, 5);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground w-10">#</th>
            <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground">Team</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground w-10">P</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground w-10">W</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground w-10">D</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground w-10">L</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground w-10 hidden sm:table-cell">GF</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground w-10 hidden sm:table-cell">GA</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground w-10">GD</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground w-12 hidden md:table-cell">Form</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground w-12">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing, index) => {
            const position = index + 1;
            const form = getFormBadges(standing.wins, standing.draws, standing.losses);
            const isCurrentUser = standing.user_id === currentUserId;
            
            return (
              <tr 
                key={standing.user_id}
                className={cn(
                  "border-b border-border/30 transition-colors hover:bg-muted/30",
                  isCurrentUser && "bg-primary/5"
                )}
              >
                {/* Position */}
                <td className="py-3 px-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border",
                    getPositionStyle(position)
                  )}>
                    {position}
                  </div>
                </td>
                
                {/* Team & Player */}
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={standing.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {standing.username?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className={cn(
                        "font-medium text-sm",
                        isCurrentUser && "text-primary"
                      )}>
                        {standing.team || "No Team"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isCurrentUser ? "You" : standing.username || "Unknown"}
                      </p>
                    </div>
                  </div>
                </td>
                
                {/* Stats */}
                <td className="text-center py-3 px-2 text-sm">{standing.played}</td>
                <td className="text-center py-3 px-2 text-sm text-green-500 font-medium">{standing.wins}</td>
                <td className="text-center py-3 px-2 text-sm text-muted-foreground">{standing.draws}</td>
                <td className="text-center py-3 px-2 text-sm text-red-500">{standing.losses}</td>
                <td className="text-center py-3 px-2 text-sm hidden sm:table-cell">{standing.goals_for}</td>
                <td className="text-center py-3 px-2 text-sm hidden sm:table-cell">{standing.goals_against}</td>
                <td className={cn(
                  "text-center py-3 px-2 text-sm font-medium",
                  standing.goal_difference > 0 && "text-green-500",
                  standing.goal_difference < 0 && "text-red-500"
                )}>
                  {standing.goal_difference > 0 ? "+" : ""}{standing.goal_difference}
                </td>
                
                {/* Form */}
                <td className="py-3 px-2 hidden md:table-cell">
                  <div className="flex gap-0.5 justify-center">
                    {form.map((result, i) => (
                      <span 
                        key={i}
                        className={cn(
                          "w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center",
                          result === "W" && "bg-green-500 text-white",
                          result === "D" && "bg-muted text-muted-foreground",
                          result === "L" && "bg-red-500 text-white"
                        )}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </td>
                
                {/* Points */}
                <td className="text-center py-3 px-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm bg-primary text-primary-foreground">
                    {standing.points}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {standings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No standings data yet. Play some matches!
        </div>
      )}
    </div>
  );
};

export default LeagueStandingsTable;
