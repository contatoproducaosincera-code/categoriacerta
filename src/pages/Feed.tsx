import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";
import LoadingSpinner from "@/components/LoadingSpinner";

const Feed = () => {
  const { data: topAthletes, isLoading: isLoadingTop } = useQuery({
    queryKey: ["topAthletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select("id, name, category, points, city")
        .order("points", { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
    gcTime: 300000,
  });

  const { data: feedItems, isLoading: isLoadingFeed } = useQuery({
    queryKey: ["recentAchievements"],
    queryFn: async () => {
      const { data: achievements, error } = await supabase
        .from("achievements")
        .select(`
          id,
          tournament_name,
          position,
          points_awarded,
          date,
          athlete_id,
          athletes!inner (
            id,
            name,
            category,
            city,
            points
          )
        `)
        .order("date", { ascending: false })
        .limit(20);

      if (error) throw error;
      return achievements || [];
    },
    staleTime: 30000,
    gcTime: 300000,
  });

  const getPositionBadge = (position: number) => {
    const colors = {
      1: "bg-yellow-500 text-white",
      2: "bg-gray-400 text-white",
      3: "bg-amber-600 text-white",
    };
    return colors[position as keyof typeof colors] || "bg-primary text-primary-foreground";
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      <section className="py-6 md:py-12">
        <div className="container mx-auto px-4">
          
          {/* Header - compact */}
          <header className="text-center mb-6 md:mb-10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                Feed de Conquistas
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Conquistas recentes e top 3 do ranking
            </p>
          </header>

          {/* Top 3 do Ranking */}
          <div className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">
              🏆 Top 3 do Ranking
            </h2>
            
            {isLoadingTop ? (
              <LoadingSpinner message="Carregando..." />
            ) : topAthletes && topAthletes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
                {topAthletes.map((athlete, index) => (
                  <AthleteAchievementsDialog
                    key={athlete.id}
                    athleteId={athlete.id}
                    athleteName={athlete.name}
                    athletePoints={athlete.points}
                    athleteCategory={athlete.category}
                  >
                    <Card
                      className="p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200"
                      style={{
                        background: index === 0 
                          ? 'linear-gradient(145deg, hsl(45 90% 60%), hsl(45 80% 55%))'
                          : index === 1
                          ? 'linear-gradient(145deg, hsl(0 0% 85%), hsl(0 0% 75%))'
                          : 'linear-gradient(145deg, hsl(25 50% 55%), hsl(25 40% 45%))'
                      }}
                    >
                      <div className="flex justify-center mb-2">
                        {index === 0 ? (
                          <Trophy className="h-10 w-10 text-yellow-100" />
                        ) : (
                          <Medal className="h-10 w-10 text-white" />
                        )}
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">
                        {index + 1}º
                      </div>
                      <h3 className="text-base font-bold text-white mb-1 truncate">
                        {athlete.name}
                      </h3>
                      <p className="text-white/90 text-xs mb-1">{athlete.city}</p>
                      <p className="text-white/90 text-xs mb-2">Cat. {athlete.category}</p>
                      <div className="text-lg font-bold text-white">
                        {athlete.points} pts
                      </div>
                    </Card>
                  </AthleteAchievementsDialog>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">Nenhum atleta no ranking.</p>
              </div>
            )}
          </div>

          {/* Conquistas Recentes */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-center mb-4">
              🎖️ Conquistas Recentes
            </h2>
            
            {isLoadingFeed ? (
              <LoadingSpinner message="Carregando conquistas..." />
            ) : !feedItems || feedItems.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-8 text-center">
                  <Medal className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma conquista recente
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-w-2xl mx-auto">
                {feedItems.map((item: any) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Trophy icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          <Trophy className={`h-5 w-5 ${
                            item.position === 1 ? 'text-yellow-500' :
                            item.position === 2 ? 'text-gray-400' :
                            'text-amber-600'
                          }`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">
                              {item.athletes.name}
                            </h3>
                            <Badge className={`${getPositionBadge(item.position)} text-xs shrink-0`}>
                              {item.position}º
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-foreground mb-1 line-clamp-1">
                            {item.tournament_name}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Badge variant="outline" className="text-xs px-1.5">
                                {item.athletes.category}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(item.date), "dd/MM/yy")}
                              </span>
                            </div>
                            <span className="font-bold text-primary">
                              +{item.points_awarded}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Feed;
