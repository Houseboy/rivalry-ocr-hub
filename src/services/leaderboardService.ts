import { supabase } from '@/integrations/supabase/client';

export enum LeagueTier {
  AMATEUR = 1,
  COMPETITIVE = 2,
  ELITE = 3,
  CHAMPIONS = 4
}

export interface LeaguePerformance {
  leagueId: string;
  leagueName: string;
  tier: LeagueTier;
  points: number;
  position: number;
  totalPlayers: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  form: string[];
  lastMatchAt: string;
}

export interface GlobalPlayerStats {
  userId: string;
  username: string;
  avatarUrl: string | null;
  globalScore: number;
  leagues: Array<{
    leagueId: string;
    leagueName: string;
    tier: LeagueTier;
    position: number;
    totalPlayers: number;
    performanceScore: number;
  }>;
  bestLeague: {
    leagueId: string;
    leagueName: string;
    position: number;
    totalPlayers: number;
    tier: LeagueTier;
  };
  stats: {
    totalLeagues: number;
    totalWins: number;
    totalMatches: number;
    winRate: number;
  };
}

export const leaderboardService = {
  async updateLeagueRankings(leagueId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_league_rankings' as any, {
        league_id: leagueId
      });
      
      if (error) {
        console.error('Error updating league rankings:', error);
        throw error;
      }
    } catch (err) {
      console.error('Failed to update league rankings:', err);
      // Don't throw if the function doesn't exist yet
      if (err instanceof Error && err.message.includes('function')) {
        console.warn('League ranking function not available yet');
      } else {
        throw err;
      }
    }
  },

  async getGlobalLeaderboard(options: {
    tier?: LeagueTier;
    limit?: number;
    offset?: number;
  } = {}): Promise<GlobalPlayerStats[]> {
    const { tier, limit = 100, offset = 0 } = options;

    try {
      // Check if the new columns exist
      const { data: testLeague, error: testError } = await supabase
        .from('leagues')
        .select('tier' as any)
        .limit(1);
      
      // If the tier column doesn't exist, fall back to old leaderboard
      if (testError && testError.message.includes('column')) {
        console.warn('League tiers not available, falling back to simple leaderboard');
        return await this.getSimpleLeaderboard(limit, offset);
      }

      // Get all active ranked leagues
      let query = supabase
        .from('leagues')
        .select('id, name, tier, is_ranked' as any)
        .eq('is_ranked', true);

      if (tier) {
        query = query.eq('tier', tier);
      }

      const { data: leagues, error: leaguesError } = await query;
      if (leaguesError) throw leaguesError;

      if (!leagues.length) {
        return [];
      }

      // Check if performance_data column exists
      const { data: testMember, error: memberError } = await supabase
        .from('league_members')
        .select('performance_data' as any)
        .limit(1);
      
      if (memberError && memberError.message.includes('column')) {
        console.warn('Performance data not available, using simple leaderboard');
        return await this.getSimpleLeaderboard(limit, offset);
      }

      // Get all league members with their performance data
      const { data: members, error: membersError } = await supabase
        .from('league_members')
        .select(`
          user:user_id (
            id,
            username,
            avatar_url
          ),
          league:league_id (
            id,
            name,
            tier
          ),
          position,
          performance_data
        ` as any)
        .in('league_id', leagues.map(l => l.id))
        .not('position', 'is', null);

      if (membersError) throw membersError;

      // Group by user and calculate global scores
      const userMap = new Map<string, GlobalPlayerStats>();

      for (const member of members || []) {
        const userId = (member as any).user?.id;
        const leagueId = (member as any).league?.id;
        const performance = (member as any).performance_data || {};

        if (!userId || !leagueId) continue;

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            username: (member as any).user?.username || 'Unknown',
            avatarUrl: (member as any).user?.avatar_url,
            globalScore: 0,
            leagues: [],
            bestLeague: {
              leagueId: '',
              leagueName: '',
              position: 0,
              totalPlayers: 0,
              tier: LeagueTier.AMATEUR
            },
            stats: {
              totalLeagues: 0,
              totalWins: 0,
              totalMatches: 0,
              winRate: 0
            }
          });
        }

        const user = userMap.get(userId)!;
        const leagueData = {
          leagueId: leagueId,
          leagueName: (member as any).league?.name || 'Unknown League',
          tier: ((member as any).league?.tier || 1) as LeagueTier,
          position: (member as any).position || 0,
          totalPlayers: 0, // Will be updated
          performanceScore: 0 // Will be calculated
        };

        user.leagues.push(leagueData);
        user.stats.totalWins += performance.wins || 0;
        user.stats.totalMatches += performance.matches_played || 0;
      }

      // Calculate league-specific metrics and global scores
      for (const user of userMap.values()) {
        // Get total players in each league
        for (const league of user.leagues) {
          const { count } = await supabase
            .from('league_members')
            .select('*', { count: 'exact', head: true })
            .eq('league_id', league.leagueId);

          league.totalPlayers = count || 0;
          
          // Calculate performance score (0-100)
          const positionWeight = 1 - ((league.position - 1) / Math.max(1, league.totalPlayers - 1));
          const tierMultiplier = this.getTierMultiplier(league.tier);
          league.performanceScore = positionWeight * 100 * tierMultiplier;
        }

        // Sort leagues by performance (best first)
        user.leagues.sort((a, b) => b.performanceScore - a.performanceScore);

        // Set best league
        if (user.leagues.length > 0) {
          const best = user.leagues[0];
          user.bestLeague = {
            leagueId: best.leagueId,
            leagueName: best.leagueName,
            position: best.position,
            totalPlayers: best.totalPlayers,
            tier: best.tier
          };
        }

        // Calculate global score based on actual league performance
        user.globalScore = user.leagues.reduce((score, league) => {
          const tierMultiplier = this.getTierMultiplier(league.tier);
          const leagueSize = Math.max(1, league.totalPlayers);
          
          // Performance factors:
          // 1. Position in league (higher for better positions)
          const positionScore = (leagueSize - league.position + 1) / leagueSize * 100;
          
          // 2. League tier multiplier (higher tiers get more weight)
          const tierWeight = tierMultiplier;
          
          // 3. League size bonus (larger leagues are more competitive)
          const sizeBonus = Math.log(leagueSize + 1) / Math.log(100) * 20; // Max 20 points
          
          // 4. Consistency bonus (players in multiple leagues get bonus)
          const consistencyBonus = user.leagues.length > 1 ? 10 : 0;
          
          // Calculate final score for this league
          const leagueScore = (positionScore * tierWeight) + sizeBonus + consistencyBonus;
          
          return score + leagueScore;
        }, 0) / Math.max(1, user.leagues.length); // Average across all leagues

        // Update stats
        user.stats.totalLeagues = user.leagues.length;
        user.stats.winRate = user.stats.totalMatches > 0 
          ? (user.stats.totalWins / user.stats.totalMatches) * 100 
          : 0;
      }

      // Convert to array, sort by global score, and apply pagination
      return Array.from(userMap.values())
        .sort((a, b) => b.globalScore - a.globalScore)
        .slice(offset, offset + limit);
    } catch (error) {
      console.error('Error in getGlobalLeaderboard:', error);
      // Fallback to simple leaderboard
      return await this.getSimpleLeaderboard(limit, offset);
    }
  },

  // Fallback simple leaderboard for when database features aren't available
  async getSimpleLeaderboard(limit: number = 100, offset: number = 0): Promise<GlobalPlayerStats[]> {
    try {
      // Get all users with rank points
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          rank_points,
          favorite_team,
          playstyle
        `)
        .order('rank_points', { ascending: false })
        .range(offset, offset + limit - 1);

      if (usersError) throw usersError;

      // Get match statistics for each user (simplified approach)
      const userIds = (users || []).map(u => u.id);
      const statsMap = new Map();
      
      // Get stats for each user individually
      for (const userId of userIds) {
        try {
          const { data: matches, error: matchError } = await supabase
            .from('matches')
            .select('result')
            .eq('user_id', userId);
          
          if (!matchError && matches) {
            const totalMatches = matches.length;
            const wins = matches.filter(m => m.result === 'win').length;
            const draws = matches.filter(m => m.result === 'draw').length;
            const losses = matches.filter(m => m.result === 'loss').length;
            const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100 * 10) / 10 : 0;
            
            // Calculate a simple performance score based on win rate and total matches
            const performanceScore = (winRate * 0.7) + (Math.min(totalMatches / 100, 1) * 30);
            
            statsMap.set(userId, {
              total_matches: totalMatches,
              wins,
              draws,
              losses,
              win_rate: winRate,
              performance_score: performanceScore
            });
          }
        } catch (err) {
          console.error(`Error getting stats for user ${userId}:`, err);
          // Set default stats if error
          statsMap.set(userId, {
            total_matches: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            win_rate: 0,
            performance_score: 0
          });
        }
      }

      // Convert to GlobalPlayerStats format
      return (users || []).map(user => {
        const stats = statsMap.get(user.id) || {
          total_matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          win_rate: 0,
          performance_score: 0
        };
        
        return {
          userId: user.id,
          username: user.username,
          avatarUrl: user.avatar_url,
          globalScore: stats.performance_score || 0, // Use performance score instead of rank_points
          leagues: [],
          bestLeague: {
            leagueId: '',
            leagueName: 'No League Data',
            position: 0,
            totalPlayers: 0,
            tier: LeagueTier.AMATEUR
          },
          stats: {
            totalLeagues: 0,
            totalWins: stats.wins || 0,
            totalMatches: stats.total_matches || 0,
            winRate: Number(stats.win_rate) || 0
          }
        };
      });
    } catch (error) {
      console.error('Error in getSimpleLeaderboard:', error);
      // Return empty array if everything fails
      return [];
    }
  },

  getTierMultiplier(tier: LeagueTier): number {
    return {
      [LeagueTier.AMATEUR]: 1.0,
      [LeagueTier.COMPETITIVE]: 1.3,
      [LeagueTier.ELITE]: 1.6,
      [LeagueTier.CHAMPIONS]: 2.0
    }[tier] || 1.0;
  },

  getTierName(tier: LeagueTier): string {
    return {
      [LeagueTier.AMATEUR]: 'Amateur',
      [LeagueTier.COMPETITIVE]: 'Competitive',
      [LeagueTier.ELITE]: 'Elite',
      [LeagueTier.CHAMPIONS]: 'Champions'
    }[tier];
  },

  getTierColor(tier: LeagueTier): string {
    return {
      [LeagueTier.AMATEUR]: 'bg-blue-500/10 text-blue-600',
      [LeagueTier.COMPETITIVE]: 'bg-green-500/10 text-green-600',
      [LeagueTier.ELITE]: 'bg-purple-500/10 text-purple-600',
      [LeagueTier.CHAMPIONS]: 'bg-yellow-500/10 text-yellow-600'
    }[tier] || 'bg-gray-500/10 text-gray-600';
  }
};
