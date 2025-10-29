import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

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

  // Get followed athletes' recent achievements
  const { data: feedItems, isLoading } = useQuery({
    queryKey: ["feed", currentAthlete?.id],
    queryFn: async () => {
      if (!currentAthlete?.id) return [];

      // Get list of followed athletes
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentAthlete.id);

      if (!follows || follows.length === 0) return [];

      const followedIds = follows.map(f => f.following_id);

      // Get recent achievements from followed athletes
      const { data: achievements, error } = await supabase
        .from("achievements")
        .select(`
          *,
          athlete:athletes(id, name, category, city)
        `)
        .in("athlete_id", followedIds)
        .order("date", { ascending: false })
        .limit(50);

      if (error) throw error;
      return achievements;
    },
    enabled: !!currentAthlete?.id,
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
              <Users className="h-10 w-10 text-primary" />
              Feed de Conquistas
            </h1>
            <p className="text-muted-foreground text-lg">
              Acompanhe as conquistas dos atletas que você segue
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando feed...</p>
            </div>
          ) : feedItems && feedItems.length > 0 ? (
            <div className="max-w-3xl mx-auto space-y-4">
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
            <Card className="max-w-3xl mx-auto">
              <CardContent className="py-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Seu feed está vazio</h3>
                <p className="text-muted-foreground">
                  Comece a seguir atletas para ver suas conquistas aqui!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default Feed;
