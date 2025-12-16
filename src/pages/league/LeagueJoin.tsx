import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const LeagueJoin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to join a league");
      return;
    }

    if (joinCode.length !== 6) {
      toast.error("Join code must be 6 characters");
      return;
    }

    setLoading(true);
    try {
      // Find the league by join code
      const { data: league, error: findError } = await supabase
        .from("leagues")
        .select("*")
        .eq("join_code", joinCode.toUpperCase())
        .single();

      if (findError || !league) {
        toast.error("Invalid join code. Please check and try again.");
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("league_members")
        .select("*")
        .eq("league_id", league.id)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        toast.info("You're already a member of this league!");
        navigate(`/league/dashboard/${league.id}`);
        return;
      }

      // Navigate to team selection instead of joining directly
      navigate("/league/join/team-select", {
        state: {
          leagueId: league.id,
          leagueName: league.name,
          leagueType: league.league_type
        }
      });
    } catch (error: any) {
      console.error("Error finding league:", error);
      toast.error(error.message || "Failed to find league");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 md:pt-20">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/league")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-secondary" />
            </div>
            <CardTitle>Join a League</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Enter the 6-character code shared by the league host
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="joinCode">Join Code</Label>
                <Input
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="XXXXXX"
                  className="font-mono text-2xl tracking-[0.5em] text-center uppercase"
                  maxLength={6}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                disabled={loading || joinCode.length !== 6}
              >
                {loading ? (
                  "Joining..."
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Join League
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeagueJoin;
