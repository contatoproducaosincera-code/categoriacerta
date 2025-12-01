import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";
import LoadingSpinner from "@/components/LoadingSpinner";

const Feed = () => {
  // Buscar top 3 atletas
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

  // Buscar conquistas recentes de todos os atletas
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 lg:mb-8">
            <BackButton />
          </div>
          
          <div className="text-center mb-10 lg:mb-14">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 lg:mb-5 flex items-center justify-center gap-3">
              <TrendingUp className="h-10 w-10 text-primary" />
              Feed de Conquistas
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Acompanhe as conquistas recentes e o top 3 do ranking
            </p>
          </div>

          {/* Top 3 do Ranking */}
          <div className="mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 lg:mb-8 text-center">
              Top 3 do Ranking
            </h2>
            
            {isLoadingTop ? (
              <LoadingSpinner message="Carregando ranking..." />
            ) : topAthletes && topAthletes.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
                {topAthletes.map((athlete, index) => (
                  <AthleteAchievementsDialog
                    key={athlete.id}
                    athleteId={athlete.id}
                    athleteName={athlete.name}
                    athletePoints={athlete.points}
                    athleteCategory={athlete.category}
                  >
                    <Card
                      className="p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer animate-fade-in"
                      style={{
                        background: index === 0 
                          ? 'linear-gradient(145deg, hsl(45 90% 60%), hsl(45 80% 55%))'
                          : index === 1
                          ? 'linear-gradient(145deg, hsl(0 0% 85%), hsl(0 0% 75%))'
                          : 'linear-gradient(145deg, hsl(25 50% 55%), hsl(25 40% 45%))'
                      }}
                    >
                      <div className="flex justify-center mb-4">
                        {index === 0 ? (
                          <Trophy className="h-16 w-16 text-yellow-100" />
                        ) : (
                          <Medal className="h-16 w-16 text-white" />
                        )}
                      </div>
                      <div className="text-6xl font-bold text-white mb-2">
                        {index + 1}º
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {athlete.name}
                      </h3>
                      <p className="text-white/90 mb-1">{athlete.city}</p>
                      <p className="text-white/90 mb-3">Categoria {athlete.category}</p>
                      <div className="text-2xl font-bold text-white">
                        {athlete.points} pontos
                      </div>
                    </Card>
                  </AthleteAchievementsDialog>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Nenhum atleta no ranking ainda.</p>
              </div>
            )}
          </div>

          {/* Conquistas Recentes */}
          <div className="space-y-6 lg:space-y-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center">Conquistas Recentes</h2>
            
            {isLoadingFeed ? (
              <LoadingSpinner message="Carregando conquistas..." />
            ) : !feedItems || feedItems.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur border-2">
                <CardContent className="pt-12 pb-12 text-center">
                  <Medal className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">
                    Nenhuma conquista recente encontrada
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
                {feedItems.map((item: any) => (
                  <Card key={item.id} className="hover:shadow-lg transition-all duration-300 animate-fade-in">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2 flex items-center gap-2">
                            <Trophy className={`h-5 w-5 ${
                              item.position === 1 ? 'text-yellow-500' :
                              item.position === 2 ? 'text-gray-400' :
                              'text-amber-600'
                            }`} />
                            {item.athletes.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Badge variant="outline">{item.athletes.category}</Badge>
                            <span>•</span>
                            <span>{item.athletes.city}</span>
                          </div>
                        </div>
                        <Badge className={getPositionBadge(item.position)}>
                          {item.position}º Lugar
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-lg font-semibold">
                          {item.tournament_name}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(item.date), "dd 'de' MMMM 'de' yyyy", {
                              locale: ptBR,
                            })}
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            +{item.points_awarded} pontos
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
