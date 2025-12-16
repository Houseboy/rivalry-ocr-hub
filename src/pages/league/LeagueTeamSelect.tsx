import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeagueIcon } from "@/components/league/LeagueIcon";
import { StadiumBackground } from "@/components/league/StadiumBackground";
import { TeamLogoGrid } from "@/components/league/TeamLogoGrid";
import leaguesData from "@/data/leagues.json";

const LeagueTeamSelect = () => {
  const { leagueType } = useParams<{ leagueType: string }>();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const leagueInfo = useMemo(() => {
    const domestic = leaguesData.domestic.find(l => l.id === leagueType);
    if (domestic) return { ...domestic, country: domestic.country as string };
    const international = leaguesData.international.find(l => l.id === leagueType);
    if (international) return { ...international, country: undefined as string | undefined };
    return null;
  }, [leagueType]);

  if (!leagueInfo) {
    return (
      <div className="min-h-screen pb-20 md:pb-8 md:pt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">League not found</p>
          <Button onClick={() => navigate("/league/host")} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const handleContinue = () => {
    if (selectedTeam) {
      navigate(`/league/create`, { 
        state: { 
          leagueType: leagueInfo.id,
          leagueName: leagueInfo.name,
          selectedTeam 
        } 
      });
    }
  };

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
          onClick={() => navigate("/league/host")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* League Header with themed styling */}
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
              <h1 className="text-3xl md:text-4xl font-bold">{leagueInfo.name}</h1>
              {"country" in leagueInfo && (
                <p className="text-muted-foreground mt-1">{leagueInfo.country}</p>
              )}
            </div>
          </div>
          <p className="text-muted-foreground">Select the team you want to represent</p>
        </div>

        <TeamLogoGrid
          leagueType={leagueInfo.id}
          items={leagueInfo.teams.map((team) => ({
            name: team,
            selected: selectedTeam === team,
            onClick: () => setSelectedTeam(team),
          }))}
        />

        {selectedTeam && (
          <div className="fixed bottom-24 md:bottom-8 left-0 right-0 px-4">
            <div className="container mx-auto max-w-md">
              <Button 
                onClick={handleContinue} 
                size="lg" 
                className={cn(
                  "w-full shadow-lg bg-gradient-to-r text-white border-0",
                  leagueInfo.theme.gradient
                )}
              >
                Continue with {selectedTeam}
              </Button>
            </div>
          </div>
        )}
      </div>
    </StadiumBackground>
  );
};

export default LeagueTeamSelect;
