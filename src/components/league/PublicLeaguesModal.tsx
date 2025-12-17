import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Trophy, Users, Lock, Play, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicLeagueCard } from "./PublicLeagueCard";
import { usePublicLeagues } from "@/hooks/usePublicLeagues";

interface PublicLeaguesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getLeagueTheme = (leagueType: string) => {
  const themes = {
    "Premier League": {
      gradient: "from-purple-600 via-purple-500 to-indigo-600",
      accent: "#6C0EE4"
    },
    "La Liga": {
      gradient: "from-orange-500 via-red-500 to-pink-500", 
      accent: "#FF6B35"
    },
    "Serie A": {
      gradient: "from-blue-600 via-blue-500 to-cyan-500",
      accent: "#0066CC"
    },
    "Bundesliga": {
      gradient: "from-red-600 via-red-500 to-rose-500",
      accent: "#DC143C"
    },
    "Ligue 1": {
      gradient: "from-blue-700 via-blue-600 to-indigo-600",
      accent: "#0055A4"
    }
  };
  return themes[leagueType as keyof typeof themes] || themes["Premier League"];
};

export const PublicLeaguesModal = ({ isOpen, onClose }: PublicLeaguesModalProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeagueType, setSelectedLeagueType] = useState<string>("all");
  
  const { leagues: allLeagues, loading, userMemberships, handleJoinLeague } = usePublicLeagues(50); // Fetch more leagues

  // Filter leagues based on search and type
  const filteredLeagues = allLeagues.filter(league => {
    const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (league.description && league.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedLeagueType === "all" || league.league_type === selectedLeagueType;
    return matchesSearch && matchesType;
  });

  // Get unique league types for filter
  const leagueTypes = Array.from(new Set(allLeagues.map(league => league.league_type)));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              All Public Leagues
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search leagues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedLeagueType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLeagueType("all")}
              >
                All Types
              </Button>
              {leagueTypes.map(type => (
                <Button
                  key={type}
                  variant={selectedLeagueType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLeagueType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4 text-sm text-gray-600">
            {loading ? (
              <span>Loading leagues...</span>
            ) : (
              <span>Found {filteredLeagues.length} public league{filteredLeagues.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* Leagues Grid */}
          <ScrollArea className="h-[500px] pr-4">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredLeagues.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leagues found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLeagues.map((league) => (
                  <PublicLeagueCard
                    key={league.id}
                    id={league.id}
                    name={league.name}
                    description={league.description || undefined}
                    leagueType={league.league_type}
                    selectedTeam={league.selected_team}
                    currentParticipants={league.member_count}
                    maxParticipants={league.max_participants || 20}
                    hasStarted={league.has_started || false}
                    isPublic={league.is_public}
                    isUserMember={userMemberships.has(league.id)}
                    onJoin={() => handleJoinLeague(league.id)}
                    onView={() => {
                      onClose();
                      navigate(`/league/${league.id}`);
                    }}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublicLeaguesModal;
