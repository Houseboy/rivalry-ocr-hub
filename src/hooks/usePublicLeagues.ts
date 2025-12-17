import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PublicLeague {
  id: string;
  name: string;
  description: string | null;
  league_type: string;
  selected_team: string;
  is_public: boolean;
  max_participants?: number;
  has_started?: boolean;
  created_at: string;
  host_id: string;
  member_count: number;
}

export function usePublicLeagues(limit: number = 6) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<PublicLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMemberships, setUserMemberships] = useState<Set<string>>(new Set());

  const fetchPublicLeagues = async () => {
    try {
      setLoading(true);
      
      // Fetch public leagues
      const { data: leaguesData, error: leaguesError } = await supabase
        .from("leagues")
        .select(`
          id,
          name,
          description,
          league_type,
          selected_team,
          is_public,
          created_at,
          host_id
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (leaguesError) throw leaguesError;

      // Get member counts for each league
      const leagueIds = leaguesData?.map((league: any) => league.id) || [];
      
      if (leagueIds.length === 0) {
        setLeagues([]);
        return;
      }

      const { data: memberCounts, error: countError } = await supabase
        .from("league_members")
        .select("league_id")
        .in("league_id", leagueIds);

      if (countError) throw countError;

      // Count members per league
      const counts: { [key: string]: number } = {};
      memberCounts?.forEach((member: any) => {
        counts[member.league_id] = (counts[member.league_id] || 0) + 1;
      });

      const processedLeagues = leaguesData?.map((league: any) => ({
        ...league,
        member_count: counts[league.id] || 0,
        max_participants: 20, // Default value since field doesn't exist in database
        has_started: false   // Default value since field doesn't exist in database
      })) || [];

      setLeagues(processedLeagues);
    } catch (error: any) {
      console.error("Error fetching public leagues:", error);
      // Don't show toast error on home page to avoid disrupting user experience
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMemberships = async () => {
    if (!user) return;
    
    try {
      const { data: memberships } = await supabase
        .from("league_members")
        .select("league_id")
        .eq("user_id", user.id);

      const membershipSet = new Set(memberships?.map(m => m.league_id) || []);
      setUserMemberships(membershipSet);
    } catch (error) {
      console.error("Error fetching user memberships:", error);
    }
  };

  const handleJoinLeague = async (leagueId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a league",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find the league details
      const league = leagues.find((l: any) => l.id === leagueId);
      if (!league) {
        toast({
          title: "League Not Found",
          description: "The league could not be found",
          variant: "destructive"
        });
        return;
      }

      // Check if league is full (using default max of 20 since field doesn't exist)
      const currentMembers = league.member_count || 0;
      const maxParticipants = 20; // Default value
      const hasStarted = false;   // Default value since field doesn't exist
      
      if (currentMembers >= maxParticipants) {
        toast({
          title: "League Full",
          description: "This league is full",
          variant: "destructive"
        });
        return;
      }

      if (hasStarted) {
        toast({
          title: "League Started",
          description: "This league has already started",
          variant: "destructive"
        });
        return;
      }

      // Check if user is already a member
      if (userMemberships.has(leagueId)) {
        toast({
          title: "Already a Member",
          description: "You're already a member of this league",
          variant: "destructive"
        });
        return;
      }

      // Navigate to team selection page with league details
      const state = {
        leagueId: league.id,
        leagueName: league.name,
        leagueType: league.league_type
      };

      // Store the state in sessionStorage for the team select page
      sessionStorage.setItem('leagueJoinState', JSON.stringify(state));
      
      // Use React Router's navigate with state
      navigate("/league/join/team-select", { state });

    } catch (error: any) {
      console.error("Error joining league:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join league",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchPublicLeagues();
    if (user) {
      fetchUserMemberships();
    }
  }, [user, limit]);

  return {
    leagues,
    loading,
    userMemberships,
    handleJoinLeague,
    refetch: fetchPublicLeagues
  };
}
