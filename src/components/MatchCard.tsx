import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  id?: string;
  userScore: number;
  rivalScore: number;
  rivalName: string;
  platform: string;
  date: string;
  result: "win" | "loss" | "draw";
  screenshotUrl?: string;
  onDelete?: (id: string) => void;
  showDeleteButton?: boolean;
}

export const MatchCard = ({
  id,
  userScore,
  rivalScore,
  rivalName,
  platform,
  date,
  result,
  screenshotUrl,
  onDelete,
  showDeleteButton = false,
}: MatchCardProps) => {
  const resultColors = {
    win: "bg-success/10 border-success text-success",
    loss: "bg-destructive/10 border-destructive text-destructive",
    draw: "bg-draw/10 border-draw text-draw",
  };

  const resultText = {
    win: "Won",
    loss: "Lost",
    draw: "Draw",
  };

  return (
    <Card className="overflow-hidden hover:shadow-card-custom transition-all duration-300 hover:scale-[1.02]">
      {screenshotUrl && (
        <div className="h-32 overflow-hidden bg-muted">
          <img src={screenshotUrl} alt="Match screenshot" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge className={cn("font-semibold", resultColors[result])}>
            {resultText[result]}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date}
            </span>
            {showDeleteButton && id && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">You</p>
              <p className="text-2xl font-bold">{userScore}</p>
            </div>
            <span className="text-muted-foreground font-bold">-</span>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{rivalName}</p>
              <p className="text-2xl font-bold">{rivalScore}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{platform}</span>
        </div>
      </div>
    </Card>
  );
};
