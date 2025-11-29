import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
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
import { BadgeCheck } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import LoadingSpinner from "@/components/LoadingSpinner";
import QueryErrorBoundary from "@/components/QueryErrorBoundary";

const Atletas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
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

  // Otimização: query consolidada com select específico
  const { data: athletesData, isLoading, error } = useQuery({
    queryKey: ["athletes-optimized"],
    queryFn: async () => {
      const [athletesResult, achievementsResult] = await Promise.all([
        supabase
          .from("athletes")
          .select("id, name, points, category, city, gender")
          .order("points", { ascending: false }),
        supabase.from("achievements").select("athlete_id, position")
      ]);

      if (athletesResult.error) throw athletesResult.error;
      
      // Contar primeiros lugares
      const firstPlaceCounts: Record<string, number> = {};
      achievementsResult.data?.forEach((achievement) => {
        if (achievement.position === 1) {
          firstPlaceCounts[achievement.athlete_id] = (firstPlaceCounts[achievement.athlete_id] || 0) + 1;
        }
      });
      
      return {
        athletes: athletesResult.data || [],
        firstPlaceCounts
      };
    },
    staleTime: 30000, // Cache por 30 segundos
    gcTime: 300000, // Manter em cache por 5 minutos
  });

  const athletes = athletesData?.athletes;
  const firstPlaceCounts = athletesData?.firstPlaceCounts;

  const getAthleteFirstPlaces = (athleteId: string) => {
    return firstPlaceCounts?.[athleteId] || 0;
  };

  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const cities = useMemo(() => 
    [...new Set((athletes || []).map(a => a.city))].sort(),
    [athletes]
  );

  const filteredAthletes = useMemo(() => {
    if (!athletes) return [];
    return athletes
      .filter(athlete => {
        const matchesSearch = athlete.name.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesCategory = categoryFilter === "all" || athlete.category === categoryFilter;
        const matchesGender = genderFilter === "all" || athlete.gender === genderFilter;
        const matchesCity = selectedCities.length === 0 || selectedCities.includes(athlete.city);
        
        let matchesPoints = true;
        if (pointsFilter === "0-500") matchesPoints = athlete.points >= 0 && athlete.points < 500;
        else if (pointsFilter === "500-1000") matchesPoints = athlete.points >= 500 && athlete.points < 1000;
        else if (pointsFilter === "1000+") matchesPoints = athlete.points >= 1000;
        
        return matchesSearch && matchesCategory && matchesGender && matchesCity && matchesPoints;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [athletes, debouncedSearch, categoryFilter, genderFilter, selectedCities, pointsFilter]);

  return (
    <QueryErrorBoundary>
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

          <div className="max-w-4xl mx-auto mb-12 space-y-4 relative z-10">
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
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Gênero" />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100]">
                  <SelectItem value="all">Todos os Gêneros</SelectItem>
                  <SelectItem value="Masculino">🧔 Masculino</SelectItem>
                  <SelectItem value="Feminino">👩 Feminino</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100]">
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="C">Categoria C</SelectItem>
                  <SelectItem value="D">Categoria D</SelectItem>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <MultiSelect
                options={cities}
                selected={selectedCities}
                onChange={setSelectedCities}
                placeholder="Todas as Cidades"
                className="w-full md:w-[250px]"
              />

              <Select value={pointsFilter} onValueChange={setPointsFilter}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Filtrar por pontuação" />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100]">
                  <SelectItem value="all">Todas Pontuações</SelectItem>
                  <SelectItem value="0-500">0 - 499 pontos (Iniciante)</SelectItem>
                  <SelectItem value="500-1000">500 - 999 pontos (D)</SelectItem>
                  <SelectItem value="1000+">1000+ pontos (C)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <LoadingSpinner message="Carregando atletas..." />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">Erro ao carregar atletas. Por favor, tente novamente.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Recarregar Página
              </button>
            </div>
          ) : !filteredAthletes || filteredAthletes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Nenhum atleta encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto relative z-0 mt-8">
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
                        <span className="hover:text-primary transition-colors flex items-center gap-2">
                          {athlete.name}
                          {getAthleteFirstPlaces(athlete.id) >= 3 && (
                            <BadgeCheck className="h-5 w-5 text-primary animate-scale-in" />
                          )}
                        </span>
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
    </QueryErrorBoundary>
  );
};

export default Atletas;
