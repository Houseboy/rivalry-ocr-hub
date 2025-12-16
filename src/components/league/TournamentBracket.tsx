import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface BracketMatch {
  id: string;
  round: string;
  match_number: number;
  home_user_id: string | null;
  away_user_id: string | null;
  home_team: string | null;
  away_team: string | null;
  home_score: number | null;
  away_score: number | null;
  winner_user_id: string | null;
  status: string;
  home_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  away_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface TournamentBracketProps {
  matches: BracketMatch[];
  themeGradient?: string;
  currentUserId?: string;
}

const ROUND_ORDER = [
  "group_stage",
  "round_of_16",
  "quarter_finals",
  "semi_finals",
  "third_place",
  "final"
];

const ROUND_LABELS: Record<string, string> = {
  group_stage: "Group Stage",
  round_of_16: "Round of 16",
  quarter_finals: "Quarter Finals",
  semi_finals: "Semi Finals",
  third_place: "3rd Place",
  final: "Final"
};

export const TournamentBracket = ({ 
  matches, 
  themeGradient,
  currentUserId 
}: TournamentBracketProps) => {
  const matchesByRound = ROUND_ORDER.reduce((acc, round) => {
    acc[round] = matches.filter(m => m.round === round);
    return acc;
  }, {} as Record<string, BracketMatch[]>);

  const activeRounds = ROUND_ORDER.filter(round => matchesByRound[round]?.length > 0);

  const BracketMatchCard = ({ match }: { match: BracketMatch }) => {
    const isCompleted = match.status === "completed";
    const isUserMatch = match.home_user_id === currentUserId || match.away_user_id === currentUserId;
    
    return (
      <Card className={cn(
        "w-full transition-all",
        isUserMatch && "ring-1 ring-primary/30",
        match.round === "final" && "shadow-lg"
      )}>
        <CardContent className="p-3 space-y-2">
          {/* Home Team */}
          <div className={cn(
            "flex items-center justify-between p-2 rounded-lg",
            isCompleted && match.winner_user_id === match.home_user_id && "bg-green-500/10",
            isCompleted && match.winner_user_id !== match.home_user_id && match.winner_user_id && "opacity-50"
          )}>
            <div className="flex items-center gap-2">
              {isCompleted && match.winner_user_id === match.home_user_id && (
                <Trophy className="w-4 h-4 text-yellow-500" />
              )}
              <span className={cn(
                "font-medium text-sm",
                match.home_user_id === currentUserId && "text-primary"
              )}>
                {match.home_team || "TBD"}
              </span>
            </div>
            {isCompleted && match.home_score !== null && (
              <span className={cn(
                "font-bold text-lg",
                match.winner_user_id === match.home_user_id && "text-green-500"
              )}>
                {match.home_score}
              </span>
            )}
          </div>
          
          {/* Away Team */}
          <div className={cn(
            "flex items-center justify-between p-2 rounded-lg",
            isCompleted && match.winner_user_id === match.away_user_id && "bg-green-500/10",
            isCompleted && match.winner_user_id !== match.away_user_id && match.winner_user_id && "opacity-50"
          )}>
            <div className="flex items-center gap-2">
              {isCompleted && match.winner_user_id === match.away_user_id && (
                <Trophy className="w-4 h-4 text-yellow-500" />
              )}
              <span className={cn(
                "font-medium text-sm",
                match.away_user_id === currentUserId && "text-primary"
              )}>
                {match.away_team || "TBD"}
              </span>
            </div>
            {isCompleted && match.away_score !== null && (
              <span className={cn(
                "font-bold text-lg",
                match.winner_user_id === match.away_user_id && "text-green-500"
              )}>
                {match.away_score}
              </span>
            )}
          </div>
          
          {!isCompleted && (
            <Badge variant="outline" className="w-full justify-center text-xs">
              {match.status === "pending" ? "Pending" : "Scheduled"}
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {activeRounds.map(round => (
        <div key={round} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-1 flex-1 rounded-full bg-gradient-to-r",
              themeGradient || "from-primary/50 to-transparent"
            )} />
            <h3 className={cn(
              "font-bold text-lg px-4 py-1 rounded-full",
              round === "final" 
                ? themeGradient 
                  ? cn("bg-gradient-to-r text-white", themeGradient)
                  : "bg-primary text-primary-foreground"
                : "bg-muted"
            )}>
              {ROUND_LABELS[round]}
            </h3>
            <div className={cn(
              "h-1 flex-1 rounded-full bg-gradient-to-l",
              themeGradient || "from-primary/50 to-transparent"
            )} />
          </div>
          
          <div className={cn(
            "grid gap-4",
            round === "final" ? "grid-cols-1 max-w-md mx-auto" :
            round === "semi_finals" || round === "third_place" ? "grid-cols-1 md:grid-cols-2" :
            round === "quarter_finals" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" :
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          )}>
            {matchesByRound[round]
              .sort((a, b) => a.match_number - b.match_number)
              .map(match => (
                <BracketMatchCard key={match.id} match={match} />
              ))}
          </div>
        </div>
      ))}
      
      {activeRounds.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Tournament bracket not yet generated.
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;
