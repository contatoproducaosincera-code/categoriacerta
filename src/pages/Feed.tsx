import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, TrendingUp, Medal } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";
import LoadingSpinner from "@/components/LoadingSpinner";

const Feed = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Get current athlete
  const { data: currentAthlete } = useQuery({
    queryKey: ["current-athlete", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Top 3 Athletes
  const { data: topAthletes, isLoading: topLoading } = useQuery({
    queryKey: ["top-three-athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select("id, name, points, city, category")
        .order("points", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    staleTime: 60000,
    gcTime: 300000,
  });

  // Otimização: query única com join
  const { data: feedItems = [], isLoading } = useQuery({
    queryKey: ["feed-optimized", currentAthlete?.id],
    queryFn: async () => {
      if (!currentAthlete?.id) return [];

      // Query otimizada com join
      const { data: achievements, error } = await supabase
        .from("follows")
        .select(`
          following_id,
          athletes!follows_following_id_fkey (
            id,
            name,
            category,
            city
          )
        `)
        .eq("follower_id", currentAthlete.id);

      if (error || !achievements || achievements.length === 0) return [];

      const followedIds = achievements.map(f => f.following_id);

      // Buscar conquistas dos seguidos
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .in("athlete_id", followedIds)
        .order("date", { ascending: false })
        .limit(50);

      if (achievementsError) throw achievementsError;

      // Mapear atletas
      const athletesMap = new Map(
        achievements.map(a => [a.following_id, a.athletes])
      );

      return achievementsData?.map(achievement => ({
        ...achievement,
        athlete: athletesMap.get(achievement.athlete_id)
      })) || [];
    },
    enabled: !!currentAthlete?.id,
    staleTime: 30000,
    gcTime: 300000,
  });

  const getPositionBadge = (position: number) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <BackButton />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
              <TrendingUp className="h-10 w-10 text-primary" />
              Feed de Atualizações
            </h1>
            <p className="text-muted-foreground text-lg">
              Ranking geral e conquistas dos atletas que você segue
            </p>
          </div>

          {/* Top 3 do Ranking */}
          {topLoading ? (
            <div className="mb-12">
              <LoadingSpinner message="Carregando ranking..." />
            </div>
          ) : topAthletes && topAthletes.length > 0 ? (
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                Top 3 do Ranking
              </h2>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {topAthletes.map((athlete, index) => (
                  <AthleteAchievementsDialog
                    key={athlete.id}
                    athleteId={athlete.id}
                    athleteName={athlete.name}
                    athletePoints={athlete.points}
                    athleteCategory={athlete.category}
                  >
                    <Card
                      className="p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                      style={{
                        background: index === 0 
                          ? 'linear-gradient(145deg, hsl(45 90% 60%), hsl(45 80% 55%))'
                          : index === 1
                          ? 'linear-gradient(145deg, hsl(0 0% 85%), hsl(0 0% 75%))'
                          : 'linear-gradient(145deg, hsl(25 50% 55%), hsl(25 40% 45%))'
                      }}
                      role="article"
                      aria-label={`${athlete.name} - ${index + 1}º lugar no ranking`}
                    >
                      <div className="flex justify-center mb-4">
                        {index === 0 ? (
                          <Trophy className="h-16 w-16 text-yellow-100" aria-label="Troféu de ouro - Primeiro lugar" />
                        ) : (
                          <Medal className="h-16 w-16 text-white" aria-label={`Medalha - ${index + 1}º lugar`} />
                        )}
                      </div>
                      <div className="text-6xl font-bold text-white mb-2">
                        {index + 1}º
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 hover:scale-105 transition-transform">
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
            </div>
          ) : null}

          {/* Feed de Conquistas */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
              Conquistas Recentes
            </h2>
            
            {isLoading ? (
              <div className="text-center py-12">
                <LoadingSpinner message="Carregando conquistas..." />
              </div>
            ) : feedItems && feedItems.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
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
                            {item.athlete.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Badge variant="outline">{item.athlete.category}</Badge>
                            <span>•</span>
                            <span>{item.athlete.city}</span>
                          </div>
                        </div>
                        {getPositionBadge(item.position)}
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
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Nenhuma conquista recente</h3>
                  <p className="text-muted-foreground">
                    Comece a seguir atletas para ver suas conquistas aqui!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Feed;
