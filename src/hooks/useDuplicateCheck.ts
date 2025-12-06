import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { findDuplicates, DuplicateCheckResult } from '@/lib/nameSimilarity';
import { useDebounce } from '@/hooks/useDebounce';

interface UseDuplicateCheckOptions {
  enabled?: boolean;
  minSimilarity?: number;
  debounceMs?: number;
}

export function useDuplicateCheck(options: UseDuplicateCheckOptions = {}) {
  const { 
    enabled = true, 
    minSimilarity = 85,
    debounceMs = 300,
  } = options;

  const [nameToCheck, setNameToCheck] = useState('');
  const debouncedName = useDebounce(nameToCheck, debounceMs);

  // Cache athlete names for fast lookup
  const { data: athleteNames } = useQuery({
    queryKey: ['athlete-names-cache'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, name, city');
      
      if (error) throw error;
      return data || [];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 10,   // 10 minutes
  });

  // Memoized duplicate check
  const checkResult = useMemo<DuplicateCheckResult>(() => {
    if (!debouncedName || debouncedName.length < 3 || !athleteNames) {
      return { hasDuplicates: false, matches: [] };
    }
    
    return findDuplicates(debouncedName, athleteNames, minSimilarity);
  }, [debouncedName, athleteNames, minSimilarity]);

  // Check function for manual triggering
  const checkName = useCallback((name: string): DuplicateCheckResult => {
    if (!name || name.length < 3 || !athleteNames) {
      return { hasDuplicates: false, matches: [] };
    }
    return findDuplicates(name, athleteNames, minSimilarity);
  }, [athleteNames, minSimilarity]);

  // Update name to check
  const updateName = useCallback((name: string) => {
    setNameToCheck(name);
  }, []);

  return {
    updateName,
    checkName,
    result: checkResult,
    isChecking: nameToCheck !== debouncedName,
    athleteCount: athleteNames?.length || 0,
  };
}
