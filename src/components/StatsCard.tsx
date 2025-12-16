import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "destructive";
}

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  variant = "default",
}: StatsCardProps) => {
  const variantStyles = {
    default: "border-border",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    destructive: "border-destructive/30 bg-destructive/5",
  };

  return (
    <Card className={cn("p-4 hover:shadow-card-custom transition-all duration-300", variantStyles[variant])}>
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </Card>
  );
};
