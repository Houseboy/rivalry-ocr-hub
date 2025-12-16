import { useState, useEffect, useCallback } from 'react';
import { leaderboardService, LeagueTier, GlobalPlayerStats } from '@/services/leaderboardService';

export function useLeaderboard(options: {
  tier?: LeagueTier;
  limit?: number;
  offset?: number;
} = {}) {
  const [data, setData] = useState<GlobalPlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const result = await leaderboardService.getGlobalLeaderboard(options);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      console.error('Error in useLeaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [options.tier, options.limit, options.offset]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchLeaderboard
  };
}
