import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, TrendingUp, Award, ArrowRight, Target } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PromotionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athleteId: string;
  athleteName: string;
  oldCategory: string;
  newCategory: string;
  pointsAtChange: number;
  promotionDate: string;
}

const PromotionDetailsDialog = ({
  open,
  onOpenChange,
  athleteId,
  athleteName,
  oldCategory,
  newCategory,
  pointsAtChange,
  promotionDate,
}: PromotionDetailsDialogProps) => {
  // Fetch achievements that contributed to this promotion
  const { data: achievements, isLoading: isLoadingAchievements } = useQuery({
    queryKey: ["promotion-achievements", athleteId, promotionDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("athlete_id", athleteId)
        .lte("date", promotionDate)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch category history for this athlete
  const { data: categoryHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["athlete-category-history", athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_history")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("changed_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch current athlete info
  const { data: athlete } = useQuery({
    queryKey: ["athlete-info", athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select("*")
        .eq("id", athleteId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "C": return "default";
      case "D": return "secondary";
      default: return "outline";
    }
  };

  const getPositionIcon = (position: number) => {
    const colors: Record<number, string> = {
      1: "text-yellow-500",
      2: "text-gray-400",
      3: "text-amber-600",
    };
    return <Trophy className={`h-4 w-4 ${colors[position] || "text-muted-foreground"}`} />;
  };

  const getRequiredPoints = (category: string) => {
    switch (category) {
      case "D": return 160;
      case "C": return 300;
      default: return 0;
    }
  };

  const requiredPoints = getRequiredPoints(newCategory);
  const totalPromotions = categoryHistory?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Promoção de {athleteName}
          </DialogTitle>
          <DialogDescription>
            Detalhes da progressão de categoria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Promotion Summary Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Award className="h-6 w-6 text-primary" />
                Resumo da Promoção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Transition */}
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">De</div>
                  <Badge 
                    variant={getCategoryBadgeVariant(oldCategory)} 
                    className="text-lg px-4 py-2"
                  >
                    {oldCategory}
                  </Badge>
                </div>
                <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Para</div>
                  <Badge 
                    variant={getCategoryBadgeVariant(newCategory)} 
                    className="text-lg px-4 py-2"
                  >
                    {newCategory}
                  </Badge>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-background rounded-lg border">
                  <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-2xl font-bold text-primary">{pointsAtChange}</div>
                  <div className="text-xs text-muted-foreground">Pontos na promoção</div>
                </div>
                <div className="text-center p-3 bg-background rounded-lg border">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">{requiredPoints}</div>
                  <div className="text-xs text-muted-foreground">Pontos necessários</div>
                </div>
                <div className="text-center p-3 bg-background rounded-lg border col-span-2 md:col-span-1">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                  <div className="text-lg font-bold text-blue-600">
                    {format(new Date(promotionDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div className="text-xs text-muted-foreground">Data da promoção</div>
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-accent/50 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">{athleteName}</strong> alcançou{" "}
                  <strong className="text-primary">{pointsAtChange} pontos</strong> na categoria{" "}
                  <strong>{oldCategory}</strong>, atingindo a meta de{" "}
                  <strong className="text-green-600">{requiredPoints} pontos</strong> necessários 
                  para subir para a categoria <strong>{newCategory}</strong>.
                </p>
                <p className="text-muted-foreground mt-2">
                  Após a promoção, o atleta iniciou na nova categoria com <strong>0 pontos</strong>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Achievements that contributed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Resultados que contribuíram
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAchievements ? (
                <LoadingSpinner message="Carregando resultados..." />
              ) : achievements && achievements.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center justify-between p-3 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getPositionIcon(achievement.position)}
                        <div>
                          <div className="font-medium text-sm">{achievement.tournament_name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(achievement.date), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={achievement.position <= 3 ? "default" : "outline"}
                          className={
                            achievement.position === 1 ? "bg-yellow-500" :
                            achievement.position === 2 ? "bg-gray-400" :
                            achievement.position === 3 ? "bg-amber-600" : ""
                          }
                        >
                          {achievement.position}º lugar
                        </Badge>
                        <div className="text-xs text-primary font-semibold mt-1">
                          +{achievement.points_awarded} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum resultado encontrado
                </p>
              )}
            </CardContent>
          </Card>

          {/* Category Journey */}
          {totalPromotions > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Jornada de Categorias ({totalPromotions} promoções)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <LoadingSpinner message="Carregando histórico..." />
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-sm py-1 px-3">
                      Iniciante
                    </Badge>
                    {categoryHistory?.map((history, index) => (
                      <div key={history.id} className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <Badge 
                          variant={getCategoryBadgeVariant(history.new_category)}
                          className="text-sm py-1 px-3"
                        >
                          {history.new_category}
                        </Badge>
                      </div>
                    ))}
                    {athlete && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (atual: {athlete.points} pts)
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionDetailsDialog;
