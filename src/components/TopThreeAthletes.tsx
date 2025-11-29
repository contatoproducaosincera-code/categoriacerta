import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import { memo } from "react";

const TopThreeAthletes = () => {
  const { data: athletes, isLoading, error } = useQuery({
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
    staleTime: 60000, // Cache por 1 minuto
    gcTime: 300000, // Manter em cache por 5 minutos
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-accent/30">
        <div className="container mx-auto px-4">
          <LoadingSpinner message="Carregando ranking..." />
        </div>
      </section>
    );
  }

  if (error) {
    console.error("Error loading top athletes:", error);
    return null;
  }

  if (!athletes || athletes.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-accent/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Top 3 do Ranking
          </h2>
          <p className="text-muted-foreground text-lg">
            Os melhores atletas do momento
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {athletes.map((athlete, index) => (
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
    </section>
  );
};

export default memo(TopThreeAthletes);
