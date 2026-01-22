/**
 * Cache Recovery Utilities
 * Handles corrupted cache/storage recovery
 */

const RELOAD_FLAG = 'reload';
const CACHE_CLEARED_FLAG = 'cache_cleared';
const INIT_TIMESTAMP_KEY = '__app_init_timestamp__';
const MAX_RELOAD_ATTEMPTS = 2;
const RELOAD_ATTEMPT_KEY = '__reload_attempts__';

// Check if we're in a reload loop
export const isReloadLoop = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const url = new URL(window.location.href);
  const hasReloadFlag = url.searchParams.has(RELOAD_FLAG);
  const hasCacheClearedFlag = url.searchParams.has(CACHE_CLEARED_FLAG);
  
  // Get reload attempts from sessionStorage (survives reloads but not tab closes)
  let attempts = 0;
  try {
    attempts = parseInt(sessionStorage.getItem(RELOAD_ATTEMPT_KEY) || '0', 10);
  } catch {
    // sessionStorage not available
  }
  
  return hasReloadFlag || hasCacheClearedFlag || attempts >= MAX_RELOAD_ATTEMPTS;
};

// Clear all caches and storage
export const clearAllCaches = async (): Promise<void> => {
  console.log('[CacheRecovery] Clearing all caches...');
  
  // Clear localStorage (except critical keys)
  try {
    const keysToPreserve = ['theme', 'vite-ui-theme'];
    const preservedData: Record<string, string | null> = {};
    
    keysToPreserve.forEach(key => {
      preservedData[key] = localStorage.getItem(key);
    });
    
    localStorage.clear();
    
    // Restore preserved data
    Object.entries(preservedData).forEach(([key, value]) => {
      if (value !== null) {
        localStorage.setItem(key, value);
      }
    });
    
    console.log('[CacheRecovery] localStorage cleared');
  } catch (e) {
    console.warn('[CacheRecovery] Failed to clear localStorage:', e);
  }
  
  // Clear sessionStorage
  try {
    sessionStorage.clear();
    console.log('[CacheRecovery] sessionStorage cleared');
  } catch (e) {
    console.warn('[CacheRecovery] Failed to clear sessionStorage:', e);
  }
  
  // Unregister all service workers
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('[CacheRecovery] Service workers unregistered:', registrations.length);
    }
  } catch (e) {
    console.warn('[CacheRecovery] Failed to unregister service workers:', e);
  }
  
  // Clear Cache API
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[CacheRecovery] Cache API cleared:', cacheNames.length);
    }
  } catch (e) {
    console.warn('[CacheRecovery] Failed to clear Cache API:', e);
  }
};

// Perform clean reload
export const performCleanReload = async (): Promise<void> => {
  // Track reload attempts
  try {
    const attempts = parseInt(sessionStorage.getItem(RELOAD_ATTEMPT_KEY) || '0', 10);
    sessionStorage.setItem(RELOAD_ATTEMPT_KEY, String(attempts + 1));
  } catch {
    // Ignore if sessionStorage is not available
  }
  
  await clearAllCaches();
  
  // Add flag to URL to prevent reload loop
  const url = new URL(window.location.href);
  url.searchParams.set(CACHE_CLEARED_FLAG, 'true');
  
  // Force reload bypassing cache
  window.location.replace(url.toString());
};

// Clean up URL flags after successful load
export const cleanupUrlFlags = (): void => {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  let needsUpdate = false;
  
  if (url.searchParams.has(RELOAD_FLAG)) {
    url.searchParams.delete(RELOAD_FLAG);
    needsUpdate = true;
  }
  
  if (url.searchParams.has(CACHE_CLEARED_FLAG)) {
    url.searchParams.delete(CACHE_CLEARED_FLAG);
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    window.history.replaceState({}, '', url.toString());
  }
  
  // Clear reload attempts counter on successful load
  try {
    sessionStorage.removeItem(RELOAD_ATTEMPT_KEY);
  } catch {
    // Ignore
  }
};

// Mark initialization timestamp
export const markInitialization = (): void => {
  try {
    localStorage.setItem(INIT_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // Ignore if localStorage not available
  }
};

// Check if app was recently initialized (within last 5 seconds)
export const wasRecentlyInitialized = (): boolean => {
  try {
    const timestamp = localStorage.getItem(INIT_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const elapsed = Date.now() - parseInt(timestamp, 10);
    return elapsed < 5000;
  } catch {
    return false;
  }
};
