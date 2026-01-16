import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage, networkStatus, CachedAthlete } from '@/lib/offlineStorage';

interface UseOfflineAthletesOptions {
  enabled?: boolean;
}

export function useOfflineAthletes(options: UseOfflineAthletesOptions = {}) {
  const { enabled = true } = options;
  const [isOnline, setIsOnline] = useState(networkStatus.isOnline());
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['offline-athletes'],
    queryFn: async (): Promise<CachedAthlete[]> => {
      // If offline, try to get from cache
      if (!networkStatus.isOnline()) {
        const cached = offlineStorage.getAthletes();
        if (cached) {
          setIsFromCache(true);
          return cached;
        }
        throw new Error('Sem conexão e sem dados em cache');
      }

      // Online: fetch from server with calculated points from achievements
      setIsFromCache(false);
      
      // First, get all athletes
      const { data: athletesData, error: athletesError } = await supabase
        .from('athletes')
        .select('id, name, points, category, city, gender, active_points')
        .order('points', { ascending: false });

      if (athletesError) throw athletesError;

      // Then, get sum of achievements for each athlete
      const { data: achievementSums, error: achievementsError } = await supabase
        .from('achievements')
        .select('athlete_id, points_awarded');

      if (achievementsError) throw achievementsError;

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
      
      // Save to cache for offline use
      offlineStorage.saveAthletes(athletes);
      
      return athletes;
    },
    enabled,
    staleTime: 60000, // 1 minute
    gcTime: 600000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry if offline
      if (!networkStatus.isOnline()) return false;
      return failureCount < 2;
    },
    // Use cached data as placeholder while fetching
    placeholderData: () => {
      const cached = offlineStorage.getAthletes();
      return cached || undefined;
    },
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
    isLoading,
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
  const [isOnline, setIsOnline] = useState(networkStatus.isOnline());

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
      if (error) throw error;
      return data || [];
    },
    enabled: isOnline,
    staleTime: 120000,
    gcTime: 600000,
  });
}
