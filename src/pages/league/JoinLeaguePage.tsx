import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

export const JoinLeaguePage = () => {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleJoinLeague = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a join code",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a league",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Find the league by join code
      const { data: league, error: leagueError } = await supabase
        .from("leagues")
        .select("*")
        .eq("join_code", joinCode.trim().toUpperCase())
        .single();

      if (leagueError) throw leagueError;
      if (!league) {
        throw new Error("League not found with the provided code");
      }

      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from("league_members")
        .select("*")
        .eq("league_id", league.id)
        .eq("user_id", user.id)
        .single();

      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        throw memberCheckError;
      }

      if (existingMember) {
        toast({
          title: "Already a member",
          description: `You are already a member of ${league.name}`,
        });
        navigate(`/league/${league.id}`);
        return;
      }

      // Navigate to team selection before joining
      navigate("/league/join/team-select", {
        state: {
          leagueId: league.id,
          leagueName: league.name,
          leagueType: league.league_type,
          leagueData: league // Pass the entire league object
        }
      });
    } catch (error: any) {
      console.error("Error joining league:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join league",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button 
            variant="ghost" 
            className="w-fit p-0 mb-2" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <CardTitle>Join a League</CardTitle>
          <CardDescription>
            Enter the league code provided by the league host
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="joinCode">League Code</Label>
              <Input
                id="joinCode"
                placeholder="e.g., ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="uppercase text-center text-lg font-mono tracking-widest"
                maxLength={6}
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Ask the league host for the 6-character join code
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={handleJoinLeague} 
            disabled={loading || joinCode.length < 3}
            className="w-full"
          >
            {loading ? "Joining..." : "Join League"}
          </Button>
          <div className="text-center text-sm text-muted-foreground mt-2">
            Don't have a code?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto"
              onClick={() => navigate('/league/host')}
            >
              Create a league instead
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
