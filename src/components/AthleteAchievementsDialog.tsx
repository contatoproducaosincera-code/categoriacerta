import { useQuery } from "@tanstack/react-query";
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
import { Trophy, Award, Calendar, Medal } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AthleteAchievementsDialogProps {
  athleteId: string;
  athleteName: string;
  athletePoints: number;
  athleteCategory: string;
  children: React.ReactNode;
}

const AthleteAchievementsDialog = ({
  athleteId,
  athleteName,
  athletePoints,
  athleteCategory,
  children,
}: AthleteAchievementsDialogProps) => {
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
          </DialogTitle>
          <DialogDescription>
            Histórico completo de participações e conquistas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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

          {/* Distribuição de Pódios */}
          {podiumCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Medal className="h-5 w-5" />
                  Distribuição de Pódios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-2 border-yellow-500">
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {firstPlaces}
                    </div>
                    <div className="text-sm font-medium">🥇 1º Lugar</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-400">
                    <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">
                      {secondPlaces}
                    </div>
                    <div className="text-sm font-medium">🥈 2º Lugar</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-2 border-amber-600">
                    <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                      {thirdPlaces}
                    </div>
                    <div className="text-sm font-medium">🥉 3º Lugar</div>
                  </div>
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
      </DialogContent>
    </Dialog>
  );
};

export default AthleteAchievementsDialog;
