import { Card, CardContent } from "@/components/ui/card";
import { LeagueIcon } from "./LeagueIcon";
import { cn } from "@/lib/utils";

interface LeagueTheme {
  primary: string;
  gradient: string;
  accent: string;
}

interface LeagueCardProps {
  id: string;
  name: string;
  country?: string;
  icon: string;
  logoUrl?: string;
  theme: LeagueTheme;
  onClick: () => void;
}

export const LeagueCard = ({ 
  name, 
  country, 
  icon, 
  logoUrl,
  theme, 
  onClick 
}: LeagueCardProps) => {
  return (
    <Card 
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-300 h-full flex flex-col",
        "hover:shadow-xl hover:scale-[1.02] hover:ring-2 hover:ring-white/20",
        "border-0 bg-gradient-to-br",
        theme.gradient
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex-1 flex flex-col items-center justify-between text-center relative">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3" />
        </div>
        
        {/* League name */}
        <div className="w-full mb-3">
          <h3 className="text-lg font-bold text-white relative z-10 line-clamp-2 h-12 flex items-center justify-center">
            {name}
          </h3>
          {country && (
            <p className="text-xs text-white/80 relative z-10 mt-1">{country}</p>
          )}
        </div>
        
        {/* Icon container */}
        <div className={cn(
          "relative my-2 rounded-xl backdrop-blur-sm transition-all duration-300 flex-shrink-0",
          "flex items-center justify-center",
          logoUrl ? "p-2 bg-white/90" : "p-3 bg-white/10 group-hover:bg-white/20",
          "w-20 h-20" // Fixed size for consistency
        )}>
          <LeagueIcon 
            icon={icon} 
            logoUrl={logoUrl}
            alt={name}
            size="lg"
            className={cn(
              "w-full h-full object-contain transition-transform duration-300 group-hover:scale-110",
              logoUrl ? "p-1" : ""
            )}
          />
        </div>
        
        {/* Stats/Info section */}
        <div className="w-full mt-3 pt-2 border-t border-white/10">
          <div className="text-xs text-white/70">
            Tap to view details
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueCard;
