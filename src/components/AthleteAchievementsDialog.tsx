import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Award, Calendar, Medal, BadgeCheck, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AthleteAchievementsDialogProps {
  athleteId: string;
  athleteName: string;
  athletePoints: number;
  athleteCategory: string;
  children: React.ReactNode;
  isAdmin?: boolean;
  onAchievementDeleted?: () => void;
}

const AthleteAchievementsDialog = ({
  athleteId,
  athleteName,
  athletePoints,
  athleteCategory,
  children,
  isAdmin = false,
  onAchievementDeleted,
}: AthleteAchievementsDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState<any>(null);
  const { data: achievements, isLoading } = useQuery({
    queryKey: ["athlete-achievements", athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const achievement = achievements?.find(a => a.id === achievementId);
      if (!achievement) throw new Error("Conquista não encontrada");

      // Remove os pontos do atleta
      const { data: athlete } = await supabase
        .from("athletes")
        .select("points")
        .eq("id", athleteId)
        .single();

      if (athlete) {
        const newPoints = Math.max(0, athlete.points - achievement.points_awarded);
        await supabase
          .from("athletes")
          .update({ points: newPoints })
          .eq("id", athleteId);
      }

      // Delete a conquista
      const { error } = await supabase
        .from("achievements")
        .delete()
        .eq("id", achievementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-achievements", athleteId] });
      queryClient.invalidateQueries({ queryKey: ["admin-athletes"] });
      toast({
        title: "Conquista removida!",
        description: "A conquista foi removida e os pontos ajustados",
      });
      setDeleteConfirmOpen(false);
      setAchievementToDelete(null);
      onAchievementDeleted?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: badges } = useQuery({
    queryKey: ["athlete-badges", athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_badges")
        .select(`
          *,
          badge_type:badge_types(*)
        `)
        .eq("athlete_id", athleteId)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const podiumCount = achievements?.filter(
    (a) => a.position >= 1 && a.position <= 3
  ).length || 0;

  const firstPlaces = achievements?.filter((a) => a.position === 1).length || 0;
  const secondPlaces = achievements?.filter((a) => a.position === 2).length || 0;
  const thirdPlaces = achievements?.filter((a) => a.position === 3).length || 0;
  
  const hasVerifiedBadge = firstPlaces >= 3;

  const getPositionBadge = (position: number) => {
    const variants: Record<number, "default" | "secondary" | "outline"> = {
      1: "default",
      2: "secondary",
      3: "outline",
    };
    const colors: Record<number, string> = {
      1: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
      2: "bg-gradient-to-r from-gray-400 to-gray-500 text-white",
      3: "bg-gradient-to-r from-amber-700 to-amber-800 text-white",
    };

    return (
      <Badge className={colors[position] || ""}>
        {position}º Lugar
      </Badge>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-primary" />
            Conquistas de {athleteName}
            {hasVerifiedBadge && (
              <div title="Atleta Verificado - 3+ Primeiros Lugares">
                <BadgeCheck className="h-6 w-6 text-primary animate-scale-in" />
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            Histórico completo de participações e conquistas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção de Troféus */}
          {podiumCount > 0 && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Trophy className="h-6 w-6 text-primary" />
                  Troféus Conquistados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  {/* Troféu de Ouro */}
                  <div className="text-center group">
                    <div className="relative inline-block mb-3">
                      <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl group-hover:bg-yellow-400/30 transition-all" />
                      <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full p-6 shadow-lg group-hover:scale-110 transition-transform animate-scale-in">
                        <Trophy className="h-12 w-12 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-yellow-600 mb-1">
                      {firstPlaces}
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Ouro
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      1º Lugar
                    </div>
                  </div>

                  {/* Troféu de Prata */}
                  <div className="text-center group">
                    <div className="relative inline-block mb-3">
                      <div className="absolute inset-0 bg-gray-400/20 rounded-full blur-xl group-hover:bg-gray-400/30 transition-all" />
                      <div className="relative bg-gradient-to-br from-gray-300 to-gray-500 rounded-full p-6 shadow-lg group-hover:scale-110 transition-transform animate-scale-in" style={{ animationDelay: '0.1s' }}>
                        <Trophy className="h-12 w-12 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-gray-600 mb-1">
                      {secondPlaces}
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Prata
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      2º Lugar
                    </div>
                  </div>

                  {/* Troféu de Bronze */}
                  <div className="text-center group">
                    <div className="relative inline-block mb-3">
                      <div className="absolute inset-0 bg-amber-600/20 rounded-full blur-xl group-hover:bg-amber-600/30 transition-all" />
                      <div className="relative bg-gradient-to-br from-amber-600 to-amber-800 rounded-full p-6 shadow-lg group-hover:scale-110 transition-transform animate-scale-in" style={{ animationDelay: '0.2s' }}>
                        <Trophy className="h-12 w-12 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-amber-700 mb-1">
                      {thirdPlaces}
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Bronze
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      3º Lugar
                    </div>
                  </div>
                </div>
                
                {hasVerifiedBadge && (
                  <div className="mt-6 pt-6 border-t text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full animate-fade-in">
                      <BadgeCheck className="h-5 w-5 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        Atleta Verificado
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Conquistou 3 ou mais primeiros lugares
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{athletePoints}</div>
                <div className="text-sm text-muted-foreground">Pontos</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent to-accent/50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">{athleteCategory}</div>
                <div className="text-sm text-muted-foreground">Categoria</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/20 to-secondary/5">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-secondary">{podiumCount}</div>
                <div className="text-sm text-muted-foreground">Pódios</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-muted to-muted/50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">{achievements?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Torneios</div>
              </CardContent>
            </Card>
          </div>

          {/* Conquistas/Badges Section */}
          {badges && badges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Conquistas Desbloqueadas ({badges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {badges.map((badge: any) => (
                    <div
                      key={badge.id}
                      className="p-3 text-center rounded-lg border bg-gradient-to-br from-card to-muted/20 hover:scale-105 hover:shadow-lg transition-all cursor-pointer group"
                      title={badge.badge_type.description}
                    >
                      <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">
                        {badge.badge_type.icon}
                      </div>
                      <div className="text-xs font-semibold line-clamp-2 min-h-[2rem] mb-1">
                        {badge.badge_type.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(badge.earned_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}


          {/* Lista de Conquistas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5" />
                Histórico de Torneios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando conquistas...
                </div>
              ) : achievements && achievements.length > 0 ? (
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-lg mb-1">
                          {achievement.tournament_name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(achievement.date), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            +{achievement.points_awarded}
                          </div>
                          <div className="text-xs text-muted-foreground">pontos</div>
                        </div>
                        {getPositionBadge(achievement.position)}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setAchievementToDelete(achievement);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma conquista registrada ainda
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover esta conquista? Os pontos serão ajustados automaticamente.
                <br /><br />
                <strong>Torneio:</strong> {achievementToDelete?.tournament_name}
                <br />
                <strong>Pontos:</strong> -{achievementToDelete?.points_awarded}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => achievementToDelete && deleteAchievementMutation.mutate(achievementToDelete.id)}
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default AthleteAchievementsDialog;
