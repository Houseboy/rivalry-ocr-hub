import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Users, 
  Crown, 
  Trophy,
  Calendar,
  ListOrdered,
  Settings,
  MessageCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LeagueIcon } from "@/components/league/LeagueIcon";
import { StadiumBackground } from "@/components/league/StadiumBackground";
import { TeamLogoGrid } from "@/components/league/TeamLogoGrid";
import { LeagueStandingsTable } from "@/components/league/LeagueStandingsTable";
import { LeagueFixtures } from "@/components/league/LeagueFixtures";
import { LeagueResults } from "@/components/league/LeagueResults";
import { TournamentBracket } from "@/components/league/TournamentBracket";
import { AdminPanel } from "@/components/league/AdminPanel";
import { UEFATournamentView } from "@/components/league/UEFATournamentView";
import { CopyButton } from "@/components/ui/copy-button";
import { LeagueChat } from "@/components/chat/LeagueChat";
import leaguesData from "@/data/leagues.json";

interface League {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  league_type: string;
  selected_team: string;
  is_public: boolean;
  host_id: string;
  created_at: string;
  tournament_mode: string | null;
}

interface Member {
  id: string;
  user_id: string;
  team: string | null;
  joined_at: string;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface Standing {
  user_id: string;
  team: string | null;
  username: string | null;
  avatar_url: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

interface Fixture {
  id: string;
  home_user_id: string;
  away_user_id: string;
  home_team: string;
  away_team: string;
  gameweek: number;
  scheduled_date: string | null;
  status: string;
  home_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  away_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  result?: {
    home_score: number;
    away_score: number;
  };
}

interface Result {
  id: string;
  fixture_id: string;
  home_user_id: string;
  away_user_id: string;
  home_score: number;
  away_score: number;
  played_at: string;
  fixture?: {
    home_team: string;
    away_team: string;
    gameweek: number;
  };
  home_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  away_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

const LeagueDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("standings");

  const leagueTheme = useMemo(() => {
    if (!league) return null;
    const domestic = leaguesData.domestic.find(l => l.id === league.league_type);
    if (domestic) return domestic;
    return leaguesData.international.find(l => l.id === league.league_type);
  }, [league]);

  const isHost = user?.id === league?.host_id;

  useEffect(() => {
    if (id) {
      fetchAllData();
    }
  }, [id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLeagueData(),
        fetchStandings(),
        fetchFixtures(),
        fetchResults()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueData = async () => {
    try {
      const { data: leagueData, error: leagueError } = await supabase
        .from("leagues")
        .select("*")
        .eq("id", id)
        .single();

      if (leagueError) throw leagueError;
      setLeague(leagueData);

      const { data: membersData, error: membersError } = await supabase
        .from("league_members")
        .select("*")
        .eq("league_id", id);

      if (membersError) throw membersError;

      const userIds = membersData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const membersWithProfiles = membersData.map(member => ({
        ...member,
        profile: profiles?.find(p => p.id === member.user_id)
      }));

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error fetching league:", error);
      toast.error("Failed to load league");
      navigate("/league");
    }
  };

  const fetchStandings = async () => {
    try {
      const { data, error } = await supabase
        .from("league_standings")
        .select("*")
        .eq("league_id", id)
        .order("points", { ascending: false })
        .order("goal_difference", { ascending: false })
        .order("goals_for", { ascending: false });

      if (error) throw error;
      setStandings(data || []);
    } catch (error) {
      console.error("Error fetching standings:", error);
    }
  };

  const fetchFixtures = async () => {
    try {
      const { data: fixturesData, error } = await supabase
        .from("league_fixtures")
        .select("*")
        .eq("league_id", id)
        .order("gameweek", { ascending: true });

      if (error) throw error;

      // Get profiles for fixtures
      const userIds = new Set<string>();
      fixturesData?.forEach(f => {
        userIds.add(f.home_user_id);
        userIds.add(f.away_user_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", Array.from(userIds));

      // Get results for fixtures
      const { data: resultsData } = await supabase
        .from("league_results")
        .select("fixture_id, home_score, away_score")
        .eq("league_id", id);

      const fixturesWithData = fixturesData?.map(fixture => ({
        ...fixture,
        home_profile: profiles?.find(p => p.id === fixture.home_user_id),
        away_profile: profiles?.find(p => p.id === fixture.away_user_id),
        result: resultsData?.find(r => r.fixture_id === fixture.id)
      })) || [];

      setFixtures(fixturesWithData);
    } catch (error) {
      console.error("Error fetching fixtures:", error);
    }
  };

  const fetchResults = async () => {
    try {
      const { data: resultsData, error } = await supabase
        .from("league_results")
        .select("*")
        .eq("league_id", id)
        .order("played_at", { ascending: false });

      if (error) throw error;

      // Get profiles and fixtures
      const userIds = new Set<string>();
      const fixtureIds = new Set<string>();
      resultsData?.forEach(r => {
        userIds.add(r.home_user_id);
        userIds.add(r.away_user_id);
        fixtureIds.add(r.fixture_id);
      });

      const [profilesRes, fixturesRes] = await Promise.all([
        supabase.from("profiles").select("id, username, avatar_url").in("id", Array.from(userIds)),
        supabase.from("league_fixtures").select("id, home_team, away_team, gameweek").in("id", Array.from(fixtureIds))
      ]);

      const resultsWithData = resultsData?.map(result => ({
        ...result,
        home_profile: profilesRes.data?.find(p => p.id === result.home_user_id),
        away_profile: profilesRes.data?.find(p => p.id === result.away_user_id),
        fixture: fixturesRes.data?.find(f => f.id === result.fixture_id)
      })) || [];

      setResults(resultsWithData);
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  
  if (loading) {
    return (
      <div className="min-h-screen pb-20 md:pb-8 md:pt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-pulse">Loading league...</div>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen pb-20 md:pb-8 md:pt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">League not found</p>
          <Button onClick={() => navigate("/league")} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <StadiumBackground
      className="min-h-screen pb-20 md:pb-8 md:pt-20"
      gradientClass={leagueTheme?.theme.gradient}
      watermarkUrl={leagueTheme?.logoUrl}
      watermarkAlt={leagueTheme?.name}
    >
      <div className="container mx-auto px-4 py-8 relative">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/profile")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* League Header */}
        <Card className="mb-6 overflow-hidden shadow-xl">
          {/* Header gradient bar */}
          {leagueTheme && (
            <div className="h-2 bg-muted" />
          )}
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* League Icon */}
                {leagueTheme && (
                  <div className="p-4 rounded-2xl bg-muted shadow-lg shrink-0">
                    <LeagueIcon
                      icon={leagueTheme.icon}
                      logoUrl={leagueTheme.logoUrl}
                      alt={leagueTheme.name}
                      size="lg"
                      className={leagueTheme.logoUrl ? "bg-white/90 rounded-xl p-2" : ""}
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{league.name}</h1>
                    <Badge variant={league.is_public ? "secondary" : "outline"}>
                      {league.is_public ? "Public" : "Private"}
                    </Badge>
                    {isHost && (
                      <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                        <Crown className="w-3 h-3 mr-1" />
                        Host
                      </Badge>
                    )}
                  </div>
                  {league.description && (
                    <p className="text-muted-foreground">{league.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {members.length} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {fixtures.length} fixtures
                    </span>
                  </div>
                </div>
              </div>

              {/* Join Code */}
              <div className="flex items-center gap-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Join Code</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-mono text-xl tracking-widest px-4 py-2 rounded-lg",
                      leagueTheme 
                        ? cn("bg-gradient-to-r text-white", leagueTheme.theme.gradient)
                        : "bg-muted"
                    )}>
                      {league.join_code}
                    </span>
                    <CopyButton 
                      text={league.join_code}
                      variant="outline"
                      size="icon"
                      iconOnly={true}
                      successMessage="Join code copied!"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={cn(
            "grid w-full mb-6",
            isHost && (league.league_type === "uefa" || league.league_type === "champions-league" || league.league_type === "europa-league" || league.league_type === "conference-league") ? "grid-cols-8" : 
            isHost ? "grid-cols-7" : 
            (league.league_type === "uefa" || league.league_type === "champions-league" || league.league_type === "europa-league" || league.league_type === "conference-league") ? "grid-cols-7" : "grid-cols-6"
          )}>
            <TabsTrigger value="standings" className="flex items-center gap-2">
              <ListOrdered className="w-4 h-4" />
              <span className="hidden sm:inline">Standings</span>
            </TabsTrigger>
            <TabsTrigger value="fixtures" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Fixtures</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
            {(league.league_type === "uefa" || league.league_type === "champions-league" || league.league_type === "europa-league" || league.league_type === "conference-league") && (
              <TabsTrigger value="uefa" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">UEFA</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>

            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>

            {isHost && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Standings Tab */}
          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListOrdered className="w-5 h-5" />
                  League Standings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LeagueStandingsTable 
                  standings={standings}
                  themeGradient={leagueTheme?.theme.gradient}
                  currentUserId={user?.id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leagueTheme?.teams?.length ? (
                  <TeamLogoGrid
                    leagueType={leagueTheme.id}
                    items={leagueTheme.teams.map((team) => ({
                      name: team,
                      disabled: members.some((m) => m.team === team),
                    }))}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">No teams available for this league type.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fixtures Tab */}
          <TabsContent value="fixtures">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Fixtures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LeagueFixtures 
                  fixtures={fixtures}
                  themeGradient={leagueTheme?.theme.gradient}
                  currentUserId={user?.id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Match Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LeagueResults 
                  results={results}
                  themeGradient={leagueTheme?.theme.gradient}
                  currentUserId={user?.id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <LeagueChat 
              leagueId={league.id}
              leagueName={league.name}
              members={members.map(m => ({ 
                id: m.user_id, 
                profile: m.profile ? { 
                  id: m.user_id,
                  username: m.profile.username || '',
                  avatar_url: m.profile.avatar_url || ''
                } : { 
                  id: m.user_id,
                  username: '',
                  avatar_url: ''
                }
              }))}
            />
          </TabsContent>

          {/* UEFA Tournament Tab */}
          {(league.league_type === "uefa" || league.league_type === "champions-league" || league.league_type === "europa-league" || league.league_type === "conference-league") && (
            <TabsContent value="uefa">
              <UEFATournamentView 
                members={members}
                fixtures={fixtures}
                themeGradient={leagueTheme?.theme.gradient}
              />
            </TabsContent>
          )}

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Members ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div 
                      key={member.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-colors",
                        "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.profile?.username?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {member.user_id === user?.id 
                                ? "You" 
                                : member.profile?.username || "Player"}
                            </span>
                            {member.user_id === league.host_id && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          {member.team && (
                            <p className="text-sm text-muted-foreground">{member.team}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {members.length === 1 && (
                  <div className="mt-6 text-center p-6 border border-dashed rounded-lg">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-2">
                      Share the join code to invite players
                    </p>
                    <CopyButton 
                      text={league.join_code}
                      variant="outline"
                      showText={true}
                      textLabel="Copy Join Code"
                      successMessage="Join code copied!"
                      className={leagueTheme ? cn(
                        "hover:bg-gradient-to-r hover:text-white hover:border-transparent",
                        leagueTheme.theme.gradient
                      ) : ""}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab */}
          {isHost && (
            <TabsContent value="admin">
              <AdminPanel 
                leagueId={league.id}
                leagueName={league.name}
                members={members}
                fixtures={fixtures}
                themeGradient={leagueTheme?.theme.gradient}
                onRefresh={fetchAllData}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </StadiumBackground>
  );
};

export default LeagueDashboard;
