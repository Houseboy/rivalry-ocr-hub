import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  UserPlus, 
  Calendar, 
  Trophy, 
  Trash2, 
  Edit, 
  RefreshCw,
  Plus,
  Save,
  X,
  AlertTriangle,
  Play,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  user_id: string;
  team: string | null;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface Fixture {
  id: string;
  home_user_id: string;
  away_user_id: string;
  home_team: string;
  away_team: string;
  gameweek: number;
  status: string;
}

interface AdminPanelProps {
  leagueId: string;
  leagueName: string;
  leagueType?: string;
  members: Member[];
  fixtures: Fixture[];
  themeGradient?: string;
  onRefresh: () => void;
}

export const AdminPanel = ({ 
  leagueId,
  leagueName,
  leagueType,
  members, 
  fixtures,
  themeGradient,
  onRefresh 
}: AdminPanelProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [addResultOpen, setAddResultOpen] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [bulkResultsOpen, setBulkResultsOpen] = useState(false);
  const [bulkResults, setBulkResults] = useState<{fixtureId: string; homeScore: string; awayScore: string}[]>([]);
  const [tournamentFormat, setTournamentFormat] = useState<string>(leagueType || "standard");

  const generateUEFAFixtures = async () => {
    if (members.length < 16) {
      toast.error("UEFA format requires at least 16 teams");
      return;
    }

    setLoading(true);
    try {
      // Find the highest existing gameweek number
      const existingFixtures = fixtures.filter(f => f.status !== "completed");
      const maxGameweek = existingFixtures.length > 0 
        ? Math.max(...existingFixtures.map(f => f.gameweek))
        : 0;
      
      let startingGameweek = maxGameweek + 1;
      const fixtureList: { home: Member; away: Member; gameweek: number; stage: string }[] = [];

      // TABLE PHASE - Single round robin for all teams
      const memberList = [...members];
      const numRounds = memberList.length - 1;
      const halfSize = memberList.length / 2;
      
      for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < halfSize; i++) {
          const home = memberList[i];
          const away = memberList[memberList.length - 1 - i];
          
          fixtureList.push({
            home,
            away,
            gameweek: startingGameweek++,
            stage: "table_phase"
          });
        }
        
        // Rotate teams (keep first team fixed)
        const last = memberList.pop()!;
        memberList.splice(1, 0, last);
      }

      // KNOCKOUT STAGES
      // R16 - 1st vs 16th, 2nd vs 15th, etc. (positions from table phase)
      const knockoutTeams = members.length >= 16 ? 16 : members.length;
      for (let i = 0; i < knockoutTeams / 2; i++) {
        fixtureList.push({
          home: members[i], // 1st, 2nd, 3rd, 4th...
          away: members[knockoutTeams - 1 - i], // 16th, 15th, 14th, 13th...
          gameweek: startingGameweek++,
          stage: "round_of_16"
        });
      }

      // Quarter-finals
      for (let i = 0; i < knockoutTeams / 4; i++) {
        fixtureList.push({
          home: members[i * 2], // Winners from R16
          away: members[i * 2 + 1],
          gameweek: startingGameweek++,
          stage: "quarter_final"
        });
      }

      // Semi-finals
      for (let i = 0; i < knockoutTeams / 8; i++) {
        fixtureList.push({
          home: members[i * 2], // Winners from QF
          away: members[i * 2 + 1],
          gameweek: startingGameweek++,
          stage: "semi_final"
        });
      }

      // Final
      fixtureList.push({
        home: members[0], // Winner SF1
        away: members[1], // Winner SF2
        gameweek: startingGameweek++,
        stage: "final"
      });

      // Insert fixtures with stage information
      const { error } = await supabase
        .from("league_fixtures")
        .insert(
          fixtureList.map(f => ({
            league_id: leagueId,
            home_user_id: f.home.user_id,
            away_user_id: f.away.user_id,
            home_team: f.home.team || "Unknown",
            away_team: f.away.team || "Unknown",
            gameweek: f.gameweek,
            status: "scheduled",
            stage: f.stage
          }))
        );

      if (error) throw error;
      
      toast.success(`Generated UEFA tournament: ${fixtureList.filter(f => f.stage === "table_phase").length} table phase matches + knockout stages!`);
      onRefresh();
    } catch (error: any) {
      console.error("Error generating UEFA fixtures:", error);
      toast.error(error.message || "Failed to generate UEFA fixtures");
    } finally {
      setLoading(false);
    }
  };

  const generateFixtures = async () => {
    if (members.length < 2) {
      toast.error("Need at least 2 members to generate fixtures");
      return;
    }

    setLoading(true);
    try {
      // Find the highest existing gameweek number
      const existingFixtures = fixtures.filter(f => f.status !== "completed");
      const maxGameweek = existingFixtures.length > 0 
        ? Math.max(...existingFixtures.map(f => f.gameweek))
        : 0;
      
      // Start from the next gameweek
      const startingGameweek = maxGameweek + 1;
      
      // Round-robin fixture generation
      const fixtureList: { home: Member; away: Member; gameweek: number }[] = [];
      const memberList = [...members];
      
      // If odd number of teams, add a "bye"
      if (memberList.length % 2 !== 0) {
        memberList.push({ id: "bye", user_id: "bye", team: null });
      }
      
      const numRounds = memberList.length - 1;
      const halfSize = memberList.length / 2;
      
      for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < halfSize; i++) {
          const home = memberList[i];
          const away = memberList[memberList.length - 1 - i];
          
          if (home.user_id !== "bye" && away.user_id !== "bye") {
            fixtureList.push({
              home,
              away,
              gameweek: startingGameweek + round
            });
          }
        }
        
        // Rotate teams (keep first team fixed)
        const last = memberList.pop()!;
        memberList.splice(1, 0, last);
      }

      // Insert fixtures
      const { error } = await supabase
        .from("league_fixtures")
        .insert(
          fixtureList.map(f => ({
            league_id: leagueId,
            home_user_id: f.home.user_id,
            away_user_id: f.away.user_id,
            home_team: f.home.team || "Unknown",
            away_team: f.away.team || "Unknown",
            gameweek: f.gameweek,
            status: "scheduled"
          }))
        );

      if (error) throw error;
      
      toast.success(`Generated ${fixtureList.length} fixtures starting from GW${startingGameweek}!`);
      onRefresh();
    } catch (error: any) {
      console.error("Error generating fixtures:", error);
      toast.error(error.message || "Failed to generate fixtures");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkResults = async () => {
    const validResults = bulkResults.filter(r => r.homeScore !== "" && r.awayScore !== "");
    
    if (validResults.length === 0) {
      toast.error("Please enter at least one result");
      return;
    }

    setLoading(true);
    try {
      // Process all results in parallel
      const resultsPromises = validResults.map(async (result) => {
        const fixture = fixtures.find(f => f.id === result.fixtureId);
        if (!fixture) return null;

        // Insert result
        const { error: resultError } = await supabase
          .from("league_results")
          .insert({
            fixture_id: fixture.id,
            league_id: leagueId,
            home_user_id: fixture.home_user_id,
            away_user_id: fixture.away_user_id,
            home_score: parseInt(result.homeScore),
            away_score: parseInt(result.awayScore),
            verified: true
          });

        if (resultError) throw resultError;

        // Update fixture status
        const { error: fixtureError } = await supabase
          .from("league_fixtures")
          .update({ status: "completed" })
          .eq("id", fixture.id);

        if (fixtureError) throw fixtureError;

        return fixture.id;
      });

      const completedFixtures = await Promise.all(resultsPromises);
      const successCount = completedFixtures.filter(f => f !== null).length;

      toast.success(`Successfully added ${successCount} results!`);
      setBulkResultsOpen(false);
      setBulkResults([]);
      onRefresh();
    } catch (error: any) {
      console.error("Error adding bulk results:", error);
      toast.error(error.message || "Failed to add some results");
    } finally {
      setLoading(false);
    }
  };

  const updateBulkResult = (fixtureId: string, homeScore: string, awayScore: string) => {
    setBulkResults(prev => {
      const existing = prev.find(r => r.fixtureId === fixtureId);
      if (existing) {
        return prev.map(r => 
          r.fixtureId === fixtureId 
            ? { ...r, homeScore, awayScore }
            : r
        );
      } else {
        return [...prev, { fixtureId, homeScore, awayScore }];
      }
    });
  };

  const handleAddResult = async () => {
    if (!selectedFixture || homeScore === "" || awayScore === "") {
      toast.error("Please fill in all fields");
      return;
    }

    const fixture = fixtures.find(f => f.id === selectedFixture);
    if (!fixture) return;

    setLoading(true);
    try {
      // Insert result
      const { error: resultError } = await supabase
        .from("league_results")
        .insert({
          fixture_id: fixture.id,
          league_id: leagueId,
          home_user_id: fixture.home_user_id,
          away_user_id: fixture.away_user_id,
          home_score: parseInt(homeScore),
          away_score: parseInt(awayScore),
          verified: true
        });

      if (resultError) throw resultError;

      // Update fixture status
      const { error: fixtureError } = await supabase
        .from("league_fixtures")
        .update({ status: "completed" })
        .eq("id", fixture.id);

      if (fixtureError) throw fixtureError;

      toast.success("Result added successfully!");
      setAddResultOpen(false);
      setSelectedFixture(null);
      setHomeScore("");
      setAwayScore("");
      onRefresh();
    } catch (error: any) {
      console.error("Error adding result:", error);
      toast.error(error.message || "Failed to add result");
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const { error } = await supabase
        .from("league_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      
      toast.success("Member removed");
      onRefresh();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error(error.message || "Failed to remove member");
    }
  };

  const deleteLeague = async () => {
    if (deleteConfirmText !== leagueName) {
      toast.error("Please type the league name correctly to confirm");
      return;
    }

    setLoading(true);
    try {
      // Delete the league (cascade will handle members, fixtures, results)
      const { error } = await supabase
        .from("leagues")
        .delete()
        .eq("id", leagueId);

      if (error) throw error;

      toast.success("League deleted successfully");
      setDeleteDialogOpen(false);
      navigate("/league");
    } catch (error: any) {
      console.error("Error deleting league:", error);
      toast.error(error.message || "Failed to delete league");
    } finally {
      setLoading(false);
    }
  };

  const pendingFixtures = fixtures.filter(f => f.status !== "completed");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fixtures">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="danger">Danger</TabsTrigger>
            </TabsList>

            {/* Fixtures Tab */}
            <TabsContent value="fixtures" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Tournament Format Selection - Only for UEFA leagues */}
                {(leagueType === "uefa" || leagueType === "champions-league" || leagueType === "europa-league" || leagueType === "conference-league") && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Tournament Format</Label>
                      <Select value={tournamentFormat} onValueChange={setTournamentFormat}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard League</SelectItem>
                          <SelectItem value="uefa">UEFA Tournament</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground max-w-xs">
                      {tournamentFormat === "uefa" 
                        ? "Table phase + knockout stages (1-8 auto-qualify to R16)"
                        : "Traditional round-robin league format"
                      }
                    </div>
                  </div>
                )}

                {/* Generate Buttons */}
                <div className="flex gap-3">
                  {(leagueType === "uefa" || leagueType === "champions-league" || leagueType === "europa-league" || leagueType === "conference-league") && tournamentFormat === "uefa" ? (
                    <Button 
                      onClick={generateUEFAFixtures}
                      disabled={loading || members.length < 16}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Generate UEFA Tournament
                    </Button>
                  ) : (
                    <Button 
                      onClick={generateFixtures}
                      disabled={loading || members.length < 2}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Generate Fixtures
                    </Button>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {fixtures.length === 0 
                  ? "No fixtures yet. Generate fixtures to start the league."
                  : `${fixtures.length} fixtures total, ${pendingFixtures.length} pending`}
              </p>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4 mt-4">
              <div className="flex gap-3">
                <Dialog open={addResultOpen} onOpenChange={setAddResultOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={pendingFixtures.length === 0}
                      className={cn(
                        themeGradient && cn("bg-gradient-to-r text-white border-0", themeGradient)
                      )}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Single Result
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Match Result</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Select Fixture</Label>
                        <Select value={selectedFixture || ""} onValueChange={setSelectedFixture}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a fixture" />
                          </SelectTrigger>
                          <SelectContent>
                            {pendingFixtures.map(f => (
                              <SelectItem key={f.id} value={f.id}>
                                GW{f.gameweek}: {f.home_team} vs {f.away_team}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedFixture && (
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <div className="space-y-2">
                            <Label>
                              {fixtures.find(f => f.id === selectedFixture)?.home_team}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              value={homeScore}
                              onChange={(e) => setHomeScore(e.target.value)}
                              placeholder="0"
                              className="text-center text-lg font-bold"
                            />
                          </div>
                          <div className="text-center text-muted-foreground">vs</div>
                          <div className="space-y-2">
                            <Label>
                              {fixtures.find(f => f.id === selectedFixture)?.away_team}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              value={awayScore}
                              onChange={(e) => setAwayScore(e.target.value)}
                              placeholder="0"
                              className="text-center text-lg font-bold"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setAddResultOpen(false)}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleAddResult} disabled={loading}>
                          <Save className="w-4 h-4 mr-2" />
                          Save Result
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={bulkResultsOpen} onOpenChange={setBulkResultsOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={pendingFixtures.length === 0}
                      variant="outline"
                      className="border-2"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Bulk Results
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Multiple Results</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        Enter scores for multiple matches at once to save time
                      </p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-3">
                        {pendingFixtures.map((fixture) => {
                          const currentResult = bulkResults.find(r => r.fixtureId === fixture.id);
                          return (
                            <div key={fixture.id} className="flex items-center gap-4 p-3 border rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  GW{fixture.gameweek}: {fixture.home_team} vs {fixture.away_team}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={currentResult?.homeScore || ""}
                                  onChange={(e) => updateBulkResult(fixture.id, e.target.value, currentResult?.awayScore || "")}
                                  className="w-16 text-center font-bold"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={currentResult?.awayScore || ""}
                                  onChange={(e) => updateBulkResult(fixture.id, currentResult?.homeScore || "", e.target.value)}
                                  className="w-16 text-center font-bold"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 justify-end pt-4 border-t">
                        <Button variant="outline" onClick={() => {
                          setBulkResultsOpen(false);
                          setBulkResults([]);
                        }}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleBulkResults} disabled={loading}>
                          <Save className="w-4 h-4 mr-2" />
                          Save All Results
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {pendingFixtures.length === 0 
                  ? "All fixtures have results!"
                  : `${pendingFixtures.length} fixtures pending results`}
              </p>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4 mt-4">
              <div className="space-y-2">
                {members.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {member.profile?.username?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {member.profile?.username || "Player"}
                        </p>
                        {member.team && (
                          <p className="text-xs text-muted-foreground">{member.team}</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeMember(member.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Danger Zone Tab */}
            <TabsContent value="danger" className="space-y-4 mt-4">
              <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">Danger Zone</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete a league, there is no going back. All fixtures, results, and member data will be permanently removed.
                </p>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete League
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        Delete League
                      </DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete the league
                        <strong> "{leagueName}"</strong> and all associated data including fixtures, results, and member records.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Type <strong>{leagueName}</strong> to confirm</Label>
                        <Input
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Enter league name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setDeleteDialogOpen(false);
                        setDeleteConfirmText("");
                      }}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={deleteLeague}
                        disabled={loading || deleteConfirmText !== leagueName}
                      >
                        {loading ? "Deleting..." : "Delete League"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
