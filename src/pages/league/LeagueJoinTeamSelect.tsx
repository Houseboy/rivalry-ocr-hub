import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, AlertCircle, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeagueIcon } from "@/components/league/LeagueIcon";
import { StadiumBackground } from "@/components/league/StadiumBackground";
import { TeamLogoGrid } from "@/components/league/TeamLogoGrid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import leaguesData from "@/data/leagues.json";

interface LocationState {
  leagueId: string;
  leagueName: string;
  leagueType: string;
}

const LeagueJoinTeamSelect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [takenTeams, setTakenTeams] = useState<string[]>([]);
  const [takenTeamUsers, setTakenTeamUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Get state from location or sessionStorage (for public league joins)
  let state = location.state as (LocationState & { leagueData?: any }) || null;
  
  if (!state) {
    try {
      const storedState = sessionStorage.getItem('leagueJoinState');
      if (storedState) {
        sessionStorage.removeItem('leagueJoinState'); // Clean up
        state = JSON.parse(storedState) as LocationState;
      }
    } catch (error) {
      console.error('Error parsing stored state:', error);
    }
  }

  // Handle missing state or league type
  if (!state?.leagueType) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">League Information Missing</h2>
          <p className="text-muted-foreground mb-6">
            Could not load league information. Please try joining again.
          </p>
          <Button onClick={() => navigate("/league/join")} className="mt-4">
            Back to Join Page
          </Button>
        </div>
      </div>
    );
  }

  const leagueInfo = useMemo(() => {
    if (!state?.leagueType) return null;
    const domestic = leaguesData.domestic.find(l => l.id === state.leagueType);
    if (domestic) return { ...domestic, country: domestic.country as string };
    const international = leaguesData.international.find(l => l.id === state.leagueType);
    if (international) return { ...international, country: undefined as string | undefined };
    return null;
  }, [state?.leagueType]);

  useEffect(() => {
    if (!state?.leagueId) {
      navigate("/league/join");
      return;
    }
    fetchTakenTeams();
  }, [state?.leagueId]);

  const fetchTakenTeams = async () => {
    if (!state?.leagueId) return;
    
    try {
      const { data, error } = await supabase
        .from("league_members")
        .select("team, user_id")
        .eq("league_id", state.leagueId)
        .not("team", "is", null);

      if (error) throw error;
      
      // Get user information for taken teams
      const teamUserMap: Record<string, string> = {};
      if (data) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: users } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);
        
        if (users) {
          users.forEach(user => {
            const member = data.find(m => m.user_id === user.id);
            if (member?.team) {
              teamUserMap[member.team] = user.username || 'Unknown User';
            }
          });
        }
      }
      
      setTakenTeamUsers(teamUserMap);
      setTakenTeams(data?.map(m => m.team!).filter(Boolean) || []);
    } catch (error) {
      console.error("Error fetching taken teams:", error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !selectedTeam || !state?.leagueId) return;

    setLoading(true);
    try {
      // Insert member with selected team
      const { error: joinError } = await supabase
        .from("league_members")
        .insert({
          league_id: state.leagueId,
          user_id: user.id,
          team: selectedTeam
        });

      if (joinError) {
        if (joinError.code === "23505") {
          toast({
            title: "Team Taken",
            description: "This team has already been selected by another player",
            variant: "destructive"
          });
          await fetchTakenTeams();
          setSelectedTeam(null);
          return;
        }
        throw joinError;
      }

      toast({
        title: "Success!",
        description: `Successfully joined "${state.leagueName}" as ${selectedTeam}!`,
        variant: "default"
      });
      // Navigate to league dashboard to show the standings
      navigate(`/league/${state.leagueId}`);
    } catch (error: any) {
      console.error("Error joining league:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join league",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!leagueInfo) {
    return (
      <div className="min-h-screen pb-20 md:pb-8 md:pt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">League Type Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The league type "{state.leagueType}" is not recognized.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate("/league/join")} className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Back to Join Page
              </Button>
              <Button variant="outline" onClick={() => navigate("/league")} className="w-full">
                Browse Leagues
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const availableTeams = leagueInfo.teams.filter(team => !takenTeams.includes(team));

  return (
    <StadiumBackground
      className="min-h-screen pb-20 md:pb-8 md:pt-20"
      gradientClass={leagueInfo.theme.gradient}
      watermarkUrl={leagueInfo.logoUrl}
      watermarkAlt={leagueInfo.name}
    >
      <div className="container mx-auto px-4 py-8 relative">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/league/join")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* League Header */}
        <div className="mb-8">
          <div className="flex flex-col items-center text-center gap-4 mb-4">
            <div className={cn(
              "rounded-3xl bg-gradient-to-br shadow-xl",
              "p-6",
              leagueInfo.theme.gradient
            )}>
              <div className={cn(
                "rounded-2xl",
                leagueInfo.logoUrl ? "bg-white/90 p-4" : ""
              )}>
                <LeagueIcon
                  icon={leagueInfo.icon}
                  logoUrl={leagueInfo.logoUrl}
                  alt={leagueInfo.name}
                  size="xl"
                  className={cn(leagueInfo.logoUrl ? "" : "text-white")}
                />
              </div>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{state.leagueName}</h1>
              <p className="text-muted-foreground mt-1">{leagueInfo.name}</p>
            </div>
          </div>

          <p className="text-muted-foreground">Select your team to join the league</p>
          <p className="text-sm text-amber-500 flex items-center gap-1 mt-2">
            <AlertCircle className="w-4 h-4" />
            Team selection is permanent and cannot be changed
          </p>
        </div>

        {loadingTeams ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : availableTeams.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Teams Available</h3>
            <p className="text-muted-foreground mb-4">
              All teams in this league have been taken.
            </p>
            <Button onClick={() => navigate("/league")}>
              Browse Other Leagues
            </Button>
          </Card>
        ) : (
          <>
            <TeamLogoGrid
              leagueType={leagueInfo.id}
              items={leagueInfo.teams.map((team) => {
                const isTaken = takenTeams.includes(team);
                return {
                  name: team,
                  disabled: isTaken,
                  selected: selectedTeam === team && !isTaken,
                  onClick: () => !isTaken && setSelectedTeam(team),
                  takenBy: isTaken ? takenTeamUsers[team] : undefined,
                };
              })}
            />

            {selectedTeam && (
              <div className="fixed bottom-24 md:bottom-8 left-0 right-0 px-4">
                <div className="container mx-auto max-w-md">
                  <Button 
                    onClick={handleJoin}
                    disabled={loading}
                    size="lg" 
                    className={cn(
                      "w-full shadow-lg bg-gradient-to-r text-white border-0",
                      leagueInfo.theme.gradient
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      `Join as ${selectedTeam}`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </StadiumBackground>
  );
};

export default LeagueJoinTeamSelect;