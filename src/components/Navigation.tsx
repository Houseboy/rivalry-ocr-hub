import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, Trophy, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import frtLogo from "@/assets/frt-logo.png";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/league", label: "League", icon: Trophy },
  { path: "/profile", label: "Profile", icon: User },
];

export const Navigation = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - desktop only */}
          <Link to="/" className="hidden md:flex items-center gap-3 font-bold text-xl group">
            <div className="w-10 h-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <img src={frtLogo} alt="FRT Logo" className="w-full h-full rounded-full shadow-primary" />
            </div>
            <span className="bg-gradient-primary bg-clip-text text-transparent transition-all duration-300 group-hover:tracking-wider">
              Football Rivalry Tracker
            </span>
          </Link>

          {/* Nav items - Desktop right aligned, Mobile full width */}
          <div className="flex items-center justify-around w-full md:justify-end md:gap-2 md:w-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 group relative",
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive && "text-primary",
                    !isActive && "group-hover:scale-110"
                  )} />
                  <span className="text-xs md:text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-0.5 bg-gradient-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Sign out - desktop */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
