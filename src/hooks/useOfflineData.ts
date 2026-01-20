import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage, networkStatus, CachedAthlete } from '@/lib/offlineStorage';

interface UseOfflineAthletesOptions {
  enabled?: boolean;
}

// Retry delay with exponential backoff
const getRetryDelay = (attemptIndex: number): number => {
  return Math.min(1000 * 2 ** attemptIndex, 10000);
};

export function useOfflineAthletes(options: UseOfflineAthletesOptions = {}) {
  const { enabled = true } = options;
  const [isOnline, setIsOnline] = useState(() => networkStatus.isOnline());
  const [isFromCache, setIsFromCache] = useState(false);
  const queryClient = useQueryClient();

  // Subscribe to network status changes
  useEffect(() => {
    const unsubscribe = networkStatus.subscribe((online) => {
      setIsOnline(online);
      if (online) {
        // Refetch when coming back online
        queryClient.invalidateQueries({ queryKey: ['offline-athletes'] });
      }
    });
    return unsubscribe;
  }, [queryClient]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['offline-athletes'],
    queryFn: async (): Promise<CachedAthlete[]> => {
      const currentlyOnline = networkStatus.isOnline();
      
      // If offline, try to get from cache
      if (!currentlyOnline) {
        const cached = offlineStorage.getAthletes();
        if (cached) {
          setIsFromCache(true);
          return cached;
        }
        throw new Error('Sem conexão e sem dados em cache');
      }

      // Online: fetch from server with calculated points from achievements
      setIsFromCache(false);
      
      try {
        // First, get all athletes
        const { data: athletesData, error: athletesError } = await supabase
          .from('athletes')
          .select('id, name, points, category, city, gender, active_points')
          .order('points', { ascending: false });

        if (athletesError) {
          console.error('Error fetching athletes:', athletesError);
          throw athletesError;
        }

        // Then, get sum of achievements for each athlete
        const { data: achievementSums, error: achievementsError } = await supabase
          .from('achievements')
          .select('athlete_id, points_awarded');

        if (achievementsError) {
          console.error('Error fetching achievements:', achievementsError);
          throw achievementsError;
        }

        // Calculate total points from achievements for each athlete
        const pointsByAthlete: Record<string, number> = {};
        (achievementSums || []).forEach((ach) => {
          pointsByAthlete[ach.athlete_id] = (pointsByAthlete[ach.athlete_id] || 0) + ach.points_awarded;
        });

        // Map athletes with calculated points from achievements (historical points)
        const athletes = (athletesData || []).map((athlete) => ({
          ...athlete,
          // Use calculated points from achievements history
          points: pointsByAthlete[athlete.id] || 0,
          // Keep active_points for category progression
          active_points: athlete.active_points || 0,
        }));

        // Sort by calculated points
        athletes.sort((a, b) => b.points - a.points);
        
        // Save to cache for offline use (non-blocking)
        try {
          offlineStorage.saveAthletes(athletes);
        } catch (cacheError) {
          console.warn('Failed to save to cache:', cacheError);
          // Don't fail the query if caching fails
        }
        
        return athletes;
      } catch (fetchError) {
        // If fetch fails but we have cache, use it
        const cached = offlineStorage.getAthletes();
        if (cached && cached.length > 0) {
          console.warn('Using cached data due to fetch error:', fetchError);
          setIsFromCache(true);
          return cached;
        }
        throw fetchError;
      }
    },
    enabled,
    staleTime: 60000, // 1 minute
    gcTime: 600000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry if definitely offline
      if (!networkStatus.isOnline()) return false;
      // Retry up to 3 times for network errors on mobile
      return failureCount < 3;
    },
    retryDelay: getRetryDelay,
    // Use cached data as placeholder while fetching
    placeholderData: () => {
      try {
        const cached = offlineStorage.getAthletes();
        return cached || undefined;
      } catch {
        return undefined;
      }
    },
    // Refetch on window focus and reconnect for mobile
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const cacheInfo = useMemo(() => ({
    isFromCache,
    cacheAge: offlineStorage.getCacheAge(),
    storageSize: offlineStorage.getStorageSize(),
    lastSync: offlineStorage.getLastSync(),
  }), [isFromCache, data]);

  const clearCache = useCallback(() => {
    offlineStorage.clearCache();
    queryClient.invalidateQueries({ queryKey: ['offline-athletes'] });
  }, [queryClient]);

  return {
    athletes: data || [],
    isLoading: isLoading || isFetching,
    error,
    isOnline,
    isFromCache,
    cacheInfo,
    refetch,
    clearCache,
  };
}

// Hook for offline-first achievements data
export function useOfflineAchievements(athleteIds?: string[]) {
  const [isOnline, setIsOnline] = useState(() => networkStatus.isOnline());

  useEffect(() => {
    return networkStatus.subscribe(setIsOnline);
  }, []);

  return useQuery({
    queryKey: ['offline-achievements', athleteIds],
    queryFn: async () => {
      if (!networkStatus.isOnline()) {
        return []; // Achievements are less critical for offline mode
      }

      let query = supabase.from('achievements').select('athlete_id, position');
      
      if (athleteIds && athleteIds.length > 0) {
        query = query.in('athlete_id', athleteIds);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching achievements:', error);
        throw error;
      }
      return data || [];
    },
    enabled: isOnline,
    staleTime: 120000,
    gcTime: 600000,
    retry: 2,
    retryDelay: getRetryDelay,
  });
}
