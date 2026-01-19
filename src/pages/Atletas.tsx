import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, MapPin, Trophy, BadgeCheck } from "lucide-react";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";
import { MultiSelect } from "@/components/ui/multi-select";
import LoadingSpinner from "@/components/LoadingSpinner";
import QueryErrorBoundary from "@/components/QueryErrorBoundary";
import { useOfflineAthletes, useOfflineAchievements } from "@/hooks/useOfflineData";
import OfflineIndicator from "@/components/OfflineIndicator";

const Atletas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [pointsFilter, setPointsFilter] = useState("all");

  // Nova lógica: 500 pontos ATIVOS para subir de categoria
  // Os pontos exibidos são os históricos, mas a progressão usa pontos ativos
  const getCategoryProgress = (activePoints: number, category: string) => {
    const threshold = 500; // Todas as categorias usam 500 pontos ativos para subir
    
    // Categoria C é a máxima - não sobe
    if (category === 'C') {
      return { progress: 100, remaining: 0, nextCategory: null, percentage: 100 };
    }

    const nextCategory = category === 'Iniciante' ? 'D' : 'C';
    const percentage = Math.min((activePoints / threshold) * 100, 100);
    const remaining = Math.max(threshold - activePoints, 0);

    return {
      progress: percentage,
      remaining,
      nextCategory,
      percentage: Math.round(percentage)
    };
  };

  // Offline-first data fetching
  const { 
    athletes, 
    isLoading: athletesLoading, 
    error: athletesError,
    isOnline,
    isFromCache,
    cacheInfo,
    refetch,
  } = useOfflineAthletes();

  // Fetch achievements (online only)
  const { data: achievementsData } = useOfflineAchievements(
    athletes?.map(a => a.id)
  );

  // Count first places
  const firstPlaceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    achievementsData?.forEach((achievement) => {
      if (achievement.position === 1) {
        counts[achievement.athlete_id] = (counts[achievement.athlete_id] || 0) + 1;
      }
    });
    return counts;
  }, [achievementsData]);
  const getAthleteFirstPlaces = useCallback((athleteId: string) => {
    return firstPlaceCounts?.[athleteId] || 0;
  }, [firstPlaceCounts]);

  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const isLoading = athletesLoading;
  const error = athletesError;
  
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
        if (pointsFilter === "0-160") matchesPoints = athlete.points >= 0 && athlete.points < 160;
        else if (pointsFilter === "160-300") matchesPoints = athlete.points >= 160 && athlete.points < 300;
        else if (pointsFilter === "300+") matchesPoints = athlete.points >= 300;
        
        return matchesSearch && matchesCategory && matchesGender && matchesCity && matchesPoints;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [athletes, debouncedSearch, categoryFilter, genderFilter, selectedCities, pointsFilter]);

  return (
    <QueryErrorBoundary>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <section className="py-12 lg:py-16 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 lg:mb-12">
              <div className="flex flex-col items-center gap-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-1 lg:mb-2">
                  Atletas Cadastrados
                </h1>
                <OfflineIndicator
                  isOnline={isOnline}
                  isFromCache={isFromCache}
                  cacheAge={cacheInfo.cacheAge}
                  onRefresh={() => refetch()}
                />
              </div>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 mt-3">
                Conheça os atletas do ranking e acompanhe sua evolução
              </p>
            </div>

            <div className="max-w-6xl mx-auto mb-8 lg:mb-12 space-y-4 lg:space-y-6">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-medium border-2 border-border/50 p-4 lg:p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                <Search className="h-4 w-4" />
                Filtros de Busca
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar atleta por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Gênero" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-[100]">
                      <SelectItem value="all">Todos os Gêneros</SelectItem>
                      <SelectItem value="Masculino">🧔 Masculino</SelectItem>
                      <SelectItem value="Feminino">👩 Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-[100]">
                      <SelectItem value="all">Todas Categorias</SelectItem>
                      <SelectItem value="C">Categoria C</SelectItem>
                      <SelectItem value="D">Categoria D</SelectItem>
                      <SelectItem value="Iniciante">Iniciante</SelectItem>
                    </SelectContent>
                  </Select>

                  <MultiSelect
                    options={cities}
                    selected={selectedCities}
                    onChange={setSelectedCities}
                    placeholder="Todas as Cidades"
                    className="h-11"
                  />

                  <Select value={pointsFilter} onValueChange={setPointsFilter}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Pontuação Histórica" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-[100]">
                      <SelectItem value="all">Todas Pontuações</SelectItem>
                      <SelectItem value="0-160">0 - 159 pontos</SelectItem>
                      <SelectItem value="160-300">160 - 299 pontos</SelectItem>
                      <SelectItem value="300+">300+ pontos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 max-w-7xl mx-auto">
              {filteredAthletes.map((athlete) => (
                <AthleteAchievementsDialog
                  key={athlete.id}
                  athleteId={athlete.id}
                  athleteName={athlete.name}
                  athletePoints={athlete.points}
                  athleteCategory={athlete.category}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-2 hover:border-primary/30 group">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-start justify-between gap-2">
                        <span className="text-lg group-hover:text-primary transition-colors flex items-center gap-2 flex-1">
                          {athlete.name}
                          {getAthleteFirstPlaces(athlete.id) >= 3 && (
                            <BadgeCheck className="h-5 w-5 text-primary animate-scale-in flex-shrink-0" />
                          )}
                        </span>
                        <Badge 
                          variant={
                            athlete.category === "C" ? "default" :
                            athlete.category === "D" ? "secondary" : "outline"
                          }
                          className="text-xs font-bold"
                        >
                          {athlete.category}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        <span className="truncate">{athlete.city}</span>
                      </div>
                      <div className="text-3xl font-black text-primary">
                        {athlete.points}
                        <span className="text-sm font-medium text-muted-foreground ml-1">pts</span>
                      </div>
                      {(() => {
                        // Usa active_points para calcular progressão (ou 0 se não existir ainda)
                        const activePoints = (athlete as any).active_points ?? 0;
                        const progress = getCategoryProgress(activePoints, athlete.category);
                        return progress.nextCategory ? (
                          <div className="space-y-2 pt-2 border-t">
                            <Progress value={progress.progress} className="h-2.5" />
                            <p className="text-xs text-muted-foreground leading-tight">
                              <span className="font-bold text-foreground">{progress.remaining} pts ativos</span> para categoria {progress.nextCategory}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-primary pt-2 border-t flex items-center gap-1">
                            <Trophy className="h-3.5 w-3.5" />
                            Categoria máxima
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
