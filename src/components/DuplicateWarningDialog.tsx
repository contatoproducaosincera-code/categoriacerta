import { memo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, UserX, UserCheck } from 'lucide-react';
import { DuplicateMatch, getMatchTypeLabel } from '@/lib/nameSimilarity';
import { cn } from '@/lib/utils';

interface DuplicateWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: DuplicateMatch[];
  athleteName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const DuplicateWarningDialog = memo(function DuplicateWarningDialog({
  open,
  onOpenChange,
  matches,
  athleteName,
  onConfirm,
  onCancel,
  isProcessing,
}: DuplicateWarningDialogProps) {
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 95) return 'bg-destructive text-destructive-foreground';
    if (similarity >= 90) return 'bg-orange-500 text-white';
    return 'bg-amber-500 text-white';
  };

  const getMatchIcon = (matchType: DuplicateMatch['matchType']) => {
    if (matchType === 'exact') return '🚨';
    if (matchType === 'very_similar') return '⚠️';
    return '💡';
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Possível Atleta Duplicado
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-base">
                O nome <strong className="text-foreground">"{athleteName}"</strong> é muito parecido com atletas já cadastrados:
              </p>
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border-2',
                      match.similarity >= 95 
                        ? 'border-destructive/50 bg-destructive/5' 
                        : 'border-amber-500/50 bg-amber-500/5'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getMatchIcon(match.matchType)}</span>
                        <span className="font-semibold truncate">{match.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{match.city}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={getSimilarityColor(match.similarity)}>
                        {match.similarity}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getMatchTypeLabel(match.matchType)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                💡 <strong>Dica:</strong> Se for a mesma pessoa, cancele e localize o atleta existente. 
                Se for uma pessoa diferente, confirme o cadastro.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={onCancel} className="gap-2">
            <UserX className="h-4 w-4" />
            Cancelar Cadastro
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={isProcessing}
            className="bg-amber-600 hover:bg-amber-700 gap-2"
          >
            <UserCheck className="h-4 w-4" />
            {isProcessing ? 'Cadastrando...' : 'Cadastrar Mesmo Assim'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

export default DuplicateWarningDialog;
