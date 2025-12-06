import { memo } from 'react';
import { WifiOff, RefreshCw, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isFromCache: boolean;
  cacheAge: number | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

const OfflineIndicator = memo(function OfflineIndicator({
  isOnline,
  isFromCache,
  cacheAge,
  onRefresh,
  isRefreshing,
  className,
}: OfflineIndicatorProps) {
  // Don't show anything if online and not from cache
  if (isOnline && !isFromCache) return null;

  const formatCacheAge = (minutes: number | null) => {
    if (minutes === null) return '';
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}min atrás`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h atrás`;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        !isOnline 
          ? 'bg-destructive/10 text-destructive border border-destructive/20' 
          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        className
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Modo Offline</span>
        </>
      ) : (
        <>
          <Database className="h-3.5 w-3.5" />
          <span>Cache {formatCacheAge(cacheAge)}</span>
        </>
      )}
      
      {isOnline && onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="ml-1 p-0.5 rounded hover:bg-primary/10 transition-colors disabled:opacity-50"
          aria-label="Atualizar dados"
        >
          <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
        </button>
      )}
    </div>
  );
});

export default OfflineIndicator;
