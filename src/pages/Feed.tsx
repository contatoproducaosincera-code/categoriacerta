import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
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
                      className="p-4 sm:p-5 text-center cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-0 min-h-[180px] flex flex-col justify-between"
                      style={{
                        background: index === 0 
                          ? 'linear-gradient(145deg, hsl(45 90% 60%), hsl(45 80% 55%))'
                          : index === 1
                          ? 'linear-gradient(145deg, hsl(0 0% 85%), hsl(0 0% 75%))'
                          : 'linear-gradient(145deg, hsl(25 50% 55%), hsl(25 40% 45%))'
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {index === 0 ? (
                            <Trophy className="h-8 w-8 text-yellow-100 drop-shadow" />
                          ) : (
                            <Medal className="h-8 w-8 text-white drop-shadow" />
                          )}
                          <span className="text-3xl font-extrabold text-white drop-shadow-sm">
                            {index + 1}º
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white leading-tight px-1 break-words">
                          {athlete.name}
                        </h3>
                        <p className="text-white/90 text-xs sm:text-sm mt-1 break-words px-1">
                          📍 {athlete.city}
                        </p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                          Cat. {athlete.category}
                        </Badge>
                        <div className="text-xl font-extrabold text-white">
                          {athlete.points}
                          <span className="text-xs font-medium text-white/80 ml-1">pts</span>
                        </div>
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

        </div>
      </section>
    </div>
  );
};

export default Feed;
