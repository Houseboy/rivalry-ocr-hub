import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, TrendingUp } from "lucide-react";
import { HeadToHeadDialog } from "./HeadToHeadDialog";

interface Rivalry {
  rivalName: string;
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

interface RivalriesOverviewProps {
  rivalries: Rivalry[];
}

export const RivalriesOverview = ({ rivalries }: RivalriesOverviewProps) => {
  const [selectedRivalry, setSelectedRivalry] = useState<Rivalry | null>(null);
  const topRivalries = rivalries.slice(0, 3);

  if (topRivalries.length === 0) {
    return (
      <div className="mb-8 animate-fade-in delay-200">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Top Rivalries
        </h2>
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Play more matches to build your rivalries
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8 animate-fade-in delay-200">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Users className="w-6 h-6 text-primary" />
        Top Rivalries
      </h2>

      <div className="grid md:grid-cols-3 gap-4">
        {topRivalries.map((rivalry) => {
          const record = `${rivalry.wins}-${rivalry.draws}-${rivalry.losses}`;
          const isBalanced = Math.abs(rivalry.wins - rivalry.losses) <= 1;

          return (
            <Card
              key={rivalry.rivalName}
              className="p-5 hover:shadow-card-custom transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-foreground font-semibold">
                    {rivalry.rivalName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{rivalry.rivalName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {rivalry.totalMatches} matches
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Record</span>
                  <Badge variant="outline">{record}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  <span className="font-semibold text-success">
                    {rivalry.winRate}%
                  </span>
                </div>
                {isBalanced && (
                  <Badge variant="secondary" className="w-full justify-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Balanced Rivalry
                  </Badge>
                )}
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4" 
                size="sm"
                onClick={() => setSelectedRivalry(rivalry)}
              >
                View Head-to-Head
              </Button>
            </Card>
          );
        })}
      </div>

      {selectedRivalry && (
        <HeadToHeadDialog
          open={!!selectedRivalry}
          onOpenChange={(open) => !open && setSelectedRivalry(null)}
          rivalName={selectedRivalry.rivalName}
          wins={selectedRivalry.wins}
          draws={selectedRivalry.draws}
          losses={selectedRivalry.losses}
          totalMatches={selectedRivalry.totalMatches}
          winRate={selectedRivalry.winRate}
        />
      )}
    </div>
  );
};
