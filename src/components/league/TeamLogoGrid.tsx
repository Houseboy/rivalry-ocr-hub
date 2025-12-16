import { cn } from "@/lib/utils";
import TeamLogo from "./TeamLogo";

type TeamLogoGridItem = {
  id?: string;
  name: string;
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
  takenBy?: string;
};

interface TeamLogoGridProps {
  items?: TeamLogoGridItem[];
  teams?: TeamLogoGridItem[]; // backward compatibility
  className?: string;
  columns?: string;
  size?: "sm" | "md" | "lg";
  leagueType?: string;
  onTeamSelect?: (teamId: string) => void;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64
};

export const TeamLogoGrid = ({
  items,
  teams,
  className,
  columns = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  size = "md",
  onTeamSelect,
}: TeamLogoGridProps) => {
  const data = (items ?? teams ?? []).map((team) => ({
    ...team,
    id: team.id ?? team.name,
  }));

  return (
    <div className={cn("grid gap-4", columns, className)}>
      {data.map((team) => (
        <button
          key={team.id}
          type="button"
          onClick={() =>
            team.onClick ? team.onClick() : onTeamSelect?.(team.id ?? team.name)
          }
          disabled={team.disabled}
          className={cn(
            "group relative flex flex-col items-center p-3 rounded-lg transition-all",
            "bg-card hover:bg-accent/50 border",
            team.selected
              ? "ring-2 ring-primary border-transparent"
              : "border-border/50 hover:border-primary/50",
            team.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div
            className={cn(
              "p-2 rounded-full bg-white/5 mb-2",
              "transition-transform group-hover:scale-105",
              team.selected && "ring-2 ring-primary/30"
            )}
          >
            <TeamLogo
              teamName={team.name}
              size={sizeMap[size]}
              className={cn(team.disabled ? "opacity-70" : "")}
            />
          </div>
          <span
            className={cn(
              "text-sm font-medium text-center",
              team.selected ? "text-foreground" : "text-muted-foreground",
              team.disabled && "line-through"
            )}
          >
            {team.name}
          </span>

          {team.disabled && (
            <div className="absolute top-1 right-1">
              <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/80 text-white">
                Taken
              </span>
              {team.takenBy && (
                <div className="absolute top-full right-0 mt-1 text-xs bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap opacity-90 z-10">
                  by {team.takenBy}
                </div>
              )}
            </div>
          )}

          {team.selected && !team.disabled && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground">
              ✓
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default TeamLogoGrid;
