import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Plus, LogIn, Sparkles, Swords, Shield } from "lucide-react";

const LeagueHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20 md:pb-8 md:pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center mb-4 px-6 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <Swords className="w-4 h-4 mr-2" />
            Competitive Leagues
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
            Join the Competition
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create your own league or join an existing one to compete with friends and climb the leaderboards.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create League Card */}
            <Card 
              className="group cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl overflow-hidden relative"
              onClick={() => navigate("/league/host")}
            >
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-cyan-500" />
              <CardContent className="p-8 flex flex-col items-center text-center h-full">
                <div className="mt-4 w-24 h-24 rounded-2xl bg-primary/5 border-2 border-primary/10 flex items-center justify-center mb-6 p-4 group-hover:bg-primary/10 transition-colors">
                  <Plus className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Create a League</h2>
                <p className="text-muted-foreground mb-6">
                  Start your own competitive league, set the rules, and invite others to join your challenge.
                </p>
                <div className="mt-auto w-full">
                  <Button className="w-full group-hover:shadow-lg group-hover:scale-[1.02] transition-transform" size="lg">
                    <Trophy className="w-5 h-5 mr-2" />
                    Create League
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Join League Card */}
            <Card 
              className="group cursor-pointer border-2 border-transparent hover:border-secondary/20 transition-all duration-300 hover:shadow-xl overflow-hidden relative"
              onClick={() => navigate("/league/join/code")}
            >
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-secondary via-purple-500 to-pink-500" />
              <CardContent className="p-8 flex flex-col items-center text-center h-full">
                <div className="mt-4 w-24 h-24 rounded-2xl bg-secondary/5 border-2 border-secondary/10 flex items-center justify-center mb-6 p-4 group-hover:bg-secondary/10 transition-colors">
                  <LogIn className="w-10 h-10 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Join a League</h2>
                <p className="text-muted-foreground mb-6">
                  Enter a join code to compete in an existing league and test your skills against others.
                </p>
                <div className="mt-auto w-full">
                  <Button variant="secondary" className="w-full group-hover:shadow-lg group-hover:scale-[1.02] transition-transform" size="lg">
                    <Users className="w-5 h-5 mr-2" />
                    Join with Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info Section */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-muted/30 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-primary/10 flex items-center justify-center p-3">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Why Join a League?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Compete in organized tournaments, track your progress, and climb the leaderboards in a structured competitive environment.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Exclusive Rewards</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Leaderboards</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Community</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueHome;
