import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Trophy, Users, Lock, Play, ArrowRight, Filter, Grid, List, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicLeagueCard } from "@/components/league/PublicLeagueCard";
import { usePublicLeagues } from "@/hooks/usePublicLeagues";
import { Link, useNavigate } from "react-router-dom";

const PublicLeagues = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeagueType, setSelectedLeagueType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const { leagues: allLeagues, loading, userMemberships, handleJoinLeague } = usePublicLeagues(50);

  // Filter leagues based on search and type
  const filteredLeagues = allLeagues.filter(league => {
    const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (league.description && league.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedLeagueType === "all" || league.league_type === selectedLeagueType;
    return matchesSearch && matchesType;
  });

  // Get unique league types for filter
  const leagueTypes = Array.from(new Set(allLeagues.map(league => league.league_type)));

  // Calculate stats
  const totalLeagues = allLeagues.length;
  const availableLeagues = filteredLeagues.filter(league => 
    !league.has_started && 
    (league.member_count < (league.max_participants || 20)) && 
    !userMemberships.has(league.id)
  ).length;
  const userInLeagues = allLeagues.filter(league => userMemberships.has(league.id)).length;

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden h-[300px] sm:h-[350px] md:h-[400px] flex items-center justify-center">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative container mx-auto px-4 sm:px-6 text-center z-10">
          {/* Back Button */}
          <div className="absolute top-0 left-0 animate-fade-in">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="bg-background/50 border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300 hover:scale-105 group text-xs sm:text-sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-8 sm:pt-0">
            <div className="animate-fade-in">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-4 sm:mb-6 text-yellow-400 drop-shadow-lg" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-fade-in delay-100 drop-shadow-lg">
                Public Leagues
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground animate-fade-in delay-200 max-w-2xl mx-auto px-4">
                Join competitive public leagues and compete against players from around the world
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card 
            className="p-4 sm:p-6 hover:shadow-primary transition-all duration-500 hover:scale-105 bg-gradient-card animate-fade-in group"
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Total Leagues</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{totalLeagues}</p>
              </div>
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </div>
          </Card>
          
          <Card 
            className="p-4 sm:p-6 hover:shadow-primary transition-all duration-500 hover:scale-105 bg-gradient-card animate-fade-in group"
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Available to Join</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 group-hover:text-primary transition-colors duration-300">{availableLeagues}</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </div>
          </Card>
          
          <Card 
            className="p-4 sm:p-6 hover:shadow-primary transition-all duration-500 hover:scale-105 bg-gradient-card animate-fade-in group sm:col-span-2 lg:col-span-1"
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Your Leagues</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 group-hover:text-primary transition-colors duration-300">{userInLeagues}</p>
              </div>
              <Play className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 sm:p-6 mb-8 sm:mb-12 hover:shadow-primary transition-all duration-500 bg-gradient-card animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="Search leagues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 sm:pl-12 h-10 sm:h-12 text-sm sm:text-lg bg-background/50 border-primary/20 focus:border-primary transition-colors duration-300"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
                <Filter className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary">Type:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedLeagueType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLeagueType("all")}
                  className="h-8 sm:h-10 text-xs sm:text-sm transition-all duration-300 hover:scale-105"
                >
                  All
                </Button>
                {leagueTypes.map(type => (
                  <Button
                    key={type}
                    variant={selectedLeagueType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLeagueType(type)}
                    className="h-8 sm:h-10 text-xs sm:text-sm transition-all duration-300 hover:scale-105"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 sm:h-10 transition-all duration-300 hover:scale-105"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 sm:h-10 transition-all duration-300 hover:scale-105"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="animate-fade-in">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              {loading ? "Loading..." : `${filteredLeagues.length} Public League${filteredLeagues.length !== 1 ? 's' : ''}`}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {selectedLeagueType === "all" 
                ? "All league types" 
                : `${selectedLeagueType} leagues only`}
            </p>
          </div>
          
          {!loading && filteredLeagues.length > 0 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <Badge variant="secondary" className="px-2 sm:px-3 py-1 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
                {availableLeagues} available
              </Badge>
              <Badge variant="outline" className="px-2 sm:px-3 py-1 border-primary/20 text-xs sm:text-sm">
                {userInLeagues} joined
              </Badge>
            </div>
          )}
        </div>

        {/* Leagues Display */}
        {loading ? (
          <div className={cn(
            "grid gap-4 sm:gap-6",
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse h-48 sm:h-64 bg-muted" />
            ))}
          </div>
        ) : filteredLeagues.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center bg-gradient-card animate-fade-in">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No leagues found</h3>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              {searchTerm || selectedLeagueType !== "all" 
                ? "Try adjusting your search or filters" 
                : "No public leagues are available at the moment"}
            </p>
            {(searchTerm || selectedLeagueType !== "all") && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")} className="transition-all duration-300 hover:scale-105 text-sm sm:text-base">
                    Clear Search
                  </Button>
                )}
                {selectedLeagueType !== "all" && (
                  <Button variant="outline" onClick={() => setSelectedLeagueType("all")} className="transition-all duration-300 hover:scale-105 text-sm sm:text-base">
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </Card>
        ) : (
          <div className={cn(
            "grid gap-4 sm:gap-6",
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {filteredLeagues.map((league, index) => (
              <div 
                key={league.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <PublicLeagueCard
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
                  onView={() => window.location.href = `/league/${league.id}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicLeagues;
