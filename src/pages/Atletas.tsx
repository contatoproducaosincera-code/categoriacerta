import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, MapPin } from "lucide-react";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";
import BackButton from "@/components/BackButton";

const Atletas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [pointsFilter, setPointsFilter] = useState("all");

  const getCategoryProgress = (points: number, category: string) => {
    const thresholds = {
      'Iniciante': { next: 500, nextCategory: 'D' },
      'D': { next: 500, nextCategory: 'C' },
      'C': { next: 500, nextCategory: null }
    };

    const threshold = thresholds[category as keyof typeof thresholds];
    if (!threshold || !threshold.nextCategory) {
      return { progress: 100, remaining: 0, nextCategory: null, percentage: 100 };
    }

    const percentage = Math.min((points / threshold.next) * 100, 100);
    const remaining = Math.max(threshold.next - points, 0);

    return {
      progress: percentage,
      remaining,
      nextCategory: threshold.nextCategory,
      percentage: Math.round(percentage)
    };
  };

  const { data: athletes, isLoading } = useQuery({
    queryKey: ["athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select("*")
        .order("points", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const cities = [...new Set((athletes || []).map(a => a.city))].sort();

  const filteredAthletes = (athletes || [])
    .filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || athlete.category === categoryFilter;
      const matchesCity = cityFilter === "all" || athlete.city === cityFilter;
      
      let matchesPoints = true;
      if (pointsFilter === "0-500") matchesPoints = athlete.points >= 0 && athlete.points < 500;
      else if (pointsFilter === "500-1000") matchesPoints = athlete.points >= 500 && athlete.points < 1000;
      else if (pointsFilter === "1000+") matchesPoints = athlete.points >= 1000;
      
      return matchesSearch && matchesCategory && matchesCity && matchesPoints;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <BackButton />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Atletas Cadastrados
          </h1>
          <p className="text-center text-muted-foreground text-lg mb-8">
            Conheça os atletas do ranking
          </p>

          <div className="max-w-4xl mx-auto mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar atleta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="C">Categoria C</SelectItem>
                  <SelectItem value="D">Categoria D</SelectItem>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Filtrar por cidade" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">Todas as Cidades</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={pointsFilter} onValueChange={setPointsFilter}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Filtrar por pontuação" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">Todas Pontuações</SelectItem>
                  <SelectItem value="0-500">0 - 499 pontos (Iniciante)</SelectItem>
                  <SelectItem value="500-1000">500 - 999 pontos (D)</SelectItem>
                  <SelectItem value="1000+">1000+ pontos (C)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando atletas...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {filteredAthletes.map((athlete) => (
                <AthleteAchievementsDialog
                  key={athlete.id}
                  athleteId={athlete.id}
                  athleteName={athlete.name}
                  athletePoints={athlete.points}
                  athleteCategory={athlete.category}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="hover:text-primary transition-colors">{athlete.name}</span>
                        <Badge variant={
                          athlete.category === "C" ? "default" :
                          athlete.category === "D" ? "secondary" : "outline"
                        }>
                          {athlete.category}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        {athlete.city}
                      </div>
                      <div className="text-2xl font-bold text-primary mb-3">
                        {athlete.points} pontos
                      </div>
                      {(() => {
                        const progress = getCategoryProgress(athlete.points, athlete.category);
                        return progress.nextCategory ? (
                          <div className="space-y-2">
                            <Progress value={progress.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              Faltam <span className="font-semibold text-foreground">{progress.remaining} pts</span> para categoria {progress.nextCategory}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-primary">
                            🏆 Categoria máxima alcançada
                          </p>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </AthleteAchievementsDialog>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Atletas;
