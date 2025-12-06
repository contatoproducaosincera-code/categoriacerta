import { memo } from 'react';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { DuplicateCheckResult } from '@/lib/nameSimilarity';
import { cn } from '@/lib/utils';

interface DuplicateIndicatorProps {
  result: DuplicateCheckResult;
  isChecking: boolean;
  nameLength: number;
  className?: string;
}

const DuplicateIndicator = memo(function DuplicateIndicator({
  result,
  isChecking,
  nameLength,
  className,
}: DuplicateIndicatorProps) {
  // Don't show anything if name is too short
  if (nameLength < 3) return null;

  if (isChecking) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Verificando...</span>
      </div>
    );
  }

  if (result.hasDuplicates) {
    const highSimilarity = result.matches.some(m => m.similarity >= 95);
    return (
      <div 
        className={cn(
          'flex items-center gap-1.5 text-xs',
          highSimilarity ? 'text-destructive' : 'text-amber-600 dark:text-amber-500',
          className
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        <span>
          {result.matches.length} nome{result.matches.length > 1 ? 's' : ''} parecido{result.matches.length > 1 ? 's' : ''} encontrado{result.matches.length > 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500', className)}>
      <CheckCircle className="h-3 w-3" />
      <span>Nome disponível</span>
    </div>
  );
});

export default DuplicateIndicator;
