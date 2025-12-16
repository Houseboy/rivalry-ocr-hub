import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeagueCard } from "@/components/league/LeagueCard";
import leaguesData from "@/data/leagues.json";

const LeagueHost = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20 md:pb-8 md:pt-20">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/league")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Select League Type</h1>
          <p className="text-muted-foreground">Choose a domestic league or international tournament to host</p>
        </div>

        {/* Domestic Leagues */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Domestic Leagues</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {leaguesData.domestic.map((league) => (
              <LeagueCard
                key={league.id}
                id={league.id}
                name={league.name}
                country={league.country}
                icon={league.icon}
                logoUrl={league.logoUrl}
                theme={league.theme}
                onClick={() => navigate(`/league/host/${league.id}`)}
              />
            ))}
          </div>
        </section>

        {/* International Tournaments */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Globe2 className="w-6 h-6 text-secondary" />
            </div>
            <h2 className="text-xl font-semibold">International Tournaments</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {leaguesData.international.map((tournament) => (
              <LeagueCard
                key={tournament.id}
                id={tournament.id}
                name={tournament.name}
                icon={tournament.icon}
                logoUrl={tournament.logoUrl}
                theme={tournament.theme}
                onClick={() => navigate(`/league/host/${tournament.id}`)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LeagueHost;
