// Lightweight offline storage using localStorage with LZ compression simulation
const STORAGE_KEYS = {
  ATHLETES: 'offline_athletes',
  LAST_SYNC: 'offline_last_sync',
  SYNC_STATUS: 'offline_sync_status',
} as const;

const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedAthlete {
  id: string;
  name: string;
  points: number;
  category: string;
  city: string;
  gender: string;
}

interface CacheData<T> {
  data: T;
  timestamp: number;
  version: number;
}

const CACHE_VERSION = 1;

// Efficient storage with minimal footprint
export const offlineStorage = {
  // Save athletes with timestamp
  saveAthletes(athletes: CachedAthlete[]): void {
    try {
      // Store only essential fields to minimize storage
      const minimalData = athletes.map(a => ({
        i: a.id,
        n: a.name,
        p: a.points,
        c: a.category,
        y: a.city,
        g: a.gender,
      }));
      
      const cacheData: CacheData<typeof minimalData> = {
        data: minimalData,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      
      localStorage.setItem(STORAGE_KEYS.ATHLETES, JSON.stringify(cacheData));
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.warn('Failed to save offline data:', error);
      // If storage is full, clear old data
      this.clearCache();
    }
  },

  // Get athletes from cache
  getAthletes(): CachedAthlete[] | null {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.ATHLETES);
      if (!cached) return null;

      const cacheData: CacheData<Array<{i: string; n: string; p: number; c: string; y: string; g: string}>> = JSON.parse(cached);
      
      // Check version compatibility
      if (cacheData.version !== CACHE_VERSION) {
        this.clearCache();
        return null;
      }

      // Check if cache is still valid
      if (Date.now() - cacheData.timestamp > MAX_CACHE_AGE) {
        return null;
      }

      // Expand minimal data back to full format
      return cacheData.data.map(a => ({
        id: a.i,
        name: a.n,
        points: a.p,
        category: a.c,
        city: a.y,
        gender: a.g,
      }));
    } catch (error) {
      console.warn('Failed to read offline data:', error);
      return null;
    }
  },

  // Get last sync timestamp
  getLastSync(): number | null {
    const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? parseInt(timestamp, 10) : null;
  },

  // Check if cache is valid
  isCacheValid(): boolean {
    const lastSync = this.getLastSync();
    if (!lastSync) return false;
    return Date.now() - lastSync < MAX_CACHE_AGE;
  },

  // Get cache age in minutes
  getCacheAge(): number | null {
    const lastSync = this.getLastSync();
    if (!lastSync) return null;
    return Math.floor((Date.now() - lastSync) / 60000);
  },

  // Clear all cached data
  clearCache(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // Get storage size in KB
  getStorageSize(): number {
    let total = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        total += item.length * 2; // UTF-16 encoding
      }
    });
    return Math.round(total / 1024);
  },
};

// Network status detection
export const networkStatus = {
  isOnline(): boolean {
    return navigator.onLine;
  },

  // Subscribe to network changes
  subscribe(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
};
