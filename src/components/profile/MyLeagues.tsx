import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Trophy, Users, Crown, ArrowRight, Plus, Search, Trash2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CopyButton } from "@/components/ui/copy-button";

interface League {
  id: string;
  name: string;
  league_type: string;
  selected_team: string;
  is_public: boolean;
  host_id: string;
  join_code?: string;
  description?: string | null;
  created_at: string;
  member_count?: number;
  is_host?: boolean;
}

interface MyLeaguesProps {
  userId: string;
  isOwnProfile: boolean;
}

const JoinLeagueDialog = ({ onJoin }: { onJoin: () => void }) => {
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
        .eq("user_id", user?.id)
        .single();

      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        throw memberCheckError;
      }

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You are already a member of this league",
        });
        navigate(`/league/${league.id}`);
        return;
      }

      // Navigate to team selection before joining
      navigate("/league/join/team-select", {
        state: {
          leagueId: league.id,
          leagueName: league.name,
          leagueType: league.league_type
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mb-4">
          <Plus className="w-4 h-4 mr-2" /> Join League with Code
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a League</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="joinCode">Enter League Code</Label>
            <Input
              id="joinCode"
              placeholder="e.g., ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="uppercase"
              maxLength={6}
            />
          </div>
          <Button 
            onClick={handleJoinLeague} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Joining..." : "Join League"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const MyLeagues = ({ userId, isOwnProfile }: MyLeaguesProps) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchUserLeagues();
    }
  }, [userId]);

  const fetchUserLeagues = async () => {
    try {
      setLoading(true);
      
      console.log("Fetching leagues for userId:", userId);
      console.log("Is userId valid:", !!userId);
      
      if (!userId) {
        console.log("No userId provided, returning empty leagues");
        setLeagues([]);
        setLoading(false);
        return;
      }
      
      // First, get all leagues where the user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('league_members')
        .select(`
          league:leagues!inner(
            id,
            name,
            description,
            league_type,
            selected_team,
            is_public,
            host_id,
            join_code,
            created_at
          )
        `)
        .eq('user_id', userId);

      console.log("Supabase query error:", memberError);
      console.log("Member data found:", memberData);

      if (memberError) {
        console.error("Supabase error:", memberError);
        throw memberError;
      }

      if (!memberData || memberData.length === 0) {
        console.log("No member data found, setting empty leagues");
        setLeagues([]);
        setLoading(false);
        return;
      }

      // Get all league IDs
      const leagueIds = memberData.map(item => item.league.id);
      
      // Get member counts for each league in a single query
      const { data: memberCounts, error: countError } = await supabase
        .from('league_members')
        .select('league_id')
        .in('league_id', leagueIds);

      if (countError) throw countError;

      // Count members per league
      const memberCountMap = new Map<string, number>();
      memberCounts?.forEach(({ league_id }) => {
        memberCountMap.set(league_id, (memberCountMap.get(league_id) || 0) + 1);
      });

      // Transform the data with member counts
      const leaguesWithCounts = memberData.map(item => ({
        ...item.league,
        is_host: item.league.host_id === userId,
        member_count: memberCountMap.get(item.league.id) || 1, // At least 1 (the host)
      }));

      console.log("Final leagues array:", leaguesWithCounts);
      setLeagues(leaguesWithCounts);
    } catch (error) {
      console.error("Error fetching leagues:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load leagues. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLeagues = leagues.filter(league => 
    league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    league.league_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (league.description && league.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  
  const handleLeaveLeague = async (leagueId: string) => {
    try {
      // Remove user from league_members
      const { error: leaveError } = await supabase
        .from('league_members')
        .delete()
        .eq('league_id', leagueId)
        .eq('user_id', userId);

      if (leaveError) throw leaveError;

      // Update the UI by removing the left league
      setLeagues(leagues.filter(league => league.id !== leagueId));
      
      toast({
        title: "Success",
        description: "You have left the league",
      });
    } catch (error) {
      console.error("Error leaving league:", error);
      toast({
        title: "Error",
        description: "Failed to leave league. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLeague = async (leagueId: string) => {
    try {
      // Delete league members first (due to foreign key constraint)
      const { error: membersError } = await supabase
        .from('league_members')
        .delete()
        .eq('league_id', leagueId);

      if (membersError) throw membersError;

      // Then delete the league
      const { error: leagueError } = await supabase
        .from('leagues')
        .delete()
        .eq('id', leagueId);

      if (leagueError) throw leagueError;

      // Update the UI by removing the deleted league
      setLeagues(leagues.filter(league => league.id !== leagueId));
      
      toast({
        title: "Success",
        description: "League deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting league:", error);
      toast({
        title: "Error",
        description: "Failed to delete league. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    console.log("MyLeagues component is loading...");
    return <div className="py-8 text-center">Loading leagues...</div>;
  }

  console.log("MyLeagues component rendering with leagues:", leagues);
  console.log("Filtered leagues count:", filteredLeagues.length);

  return (
    <div className="space-y-4">
      {isOwnProfile && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search leagues..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <JoinLeagueDialog onJoin={fetchUserLeagues} />
          <Button onClick={() => navigate('/league/host')}>
            <Plus className="w-4 h-4 mr-2" /> Create League
          </Button>
        </div>
      )}

      {filteredLeagues.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">No leagues found</h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? "No leagues match your search. Try a different term."
              : isOwnProfile 
                ? "You haven't joined any leagues yet." 
                : "This user hasn't joined any leagues yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLeagues.map((league) => (
            <Card key={league.id} className="flex flex-col h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{league.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {league.league_type} • {league.member_count || 1} member{league.member_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isOwnProfile && !league.is_host && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to leave this league?')) {
                            handleLeaveLeague(league.id);
                          }
                        }}
                        title="Leave League"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {league.is_host && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this league? This action cannot be undone.')) {
                            handleDeleteLeague(league.id);
                          }
                        }}
                        title="Delete League"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {league.is_host && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Host
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {league.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {league.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{league.member_count || 1} member{league.member_count !== 1 ? 's' : ''}</span>
                  </div>
                  {league.join_code && isOwnProfile && (
                    <CopyButton 
                      text={league.join_code!}
                      variant="ghost"
                      size="sm"
                      showText={true}
                      textLabel={league.join_code!}
                      successMessage="Join code copied!"
                      className="text-xs text-muted-foreground"
                    />
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/league/${league.id}`)}
                >
                  View League <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
