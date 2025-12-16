import {
  Crown,
  Sun,
  Shield,
  Target,
  Hexagon,
  Gem,
  Flag,
  Palmtree,
  Star,
  Flame,
  Sparkles,
  Trophy,
  Globe,
  Medal,
  CircleDot,
  Zap,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Crown,
  Sun,
  Shield,
  Target,
  Hexagon,
  Gem,
  Flag,
  Palmtree,
  Star,
  Flame,
  Sparkles,
  Trophy,
  Globe,
  Medal,
  CircleDot,
  Zap,
};

interface LeagueIconProps {
  icon: string;
  logoUrl?: string;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

export const LeagueIcon = ({ icon, logoUrl, alt, className, size = "md" }: LeagueIconProps) => {
  const IconComponent = iconMap[icon] || Trophy;
  
  return logoUrl ? (
    <img
      src={logoUrl}
      alt={alt || icon}
      className={cn(sizeClasses[size], "object-contain", className)}
      loading="lazy"
      draggable={false}
    />
  ) : (
    <IconComponent className={cn(sizeClasses[size], "text-current", className)} />
  );
};

export default LeagueIcon;
