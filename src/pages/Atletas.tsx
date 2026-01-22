import { useState, useMemo, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
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
import { InstagramWebViewWarning } from "@/components/InstagramWebViewWarning";
import { CollapsibleFilters } from "@/components/ui/collapsible-filters";

const Atletas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [pointsFilter, setPointsFilter] = useState("all");

  const getCategoryProgress = (activePoints: number, category: string) => {
    const threshold = 500;
    
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

  const { 
    athletes, 
    isLoading: athletesLoading, 
    error: athletesError,
    isOnline,
    isFromCache,
    cacheInfo,
    refetch,
  } = useOfflineAthletes();

  const { data: achievementsData } = useOfflineAchievements(
    athletes?.map(a => a.id)
  );

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

  const activeFiltersCount = [
    genderFilter !== "all",
    categoryFilter !== "all",
    selectedCities.length > 0,
    pointsFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setGenderFilter("all");
    setCategoryFilter("all");
    setSelectedCities([]);
    setPointsFilter("all");
    setSearchTerm("");
  };

  return (
    <QueryErrorBoundary>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />
        
        <div className="container mx-auto px-4 pt-4">
          <InstagramWebViewWarning />
        </div>
        
        <section className="py-6 md:py-12">
          <div className="container mx-auto px-4">
            
            {/* Header - compact */}
            <header className="text-center mb-5 md:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
                Atletas Cadastrados
              </h1>
              <OfflineIndicator
                isOnline={isOnline}
                isFromCache={isFromCache}
                cacheAge={cacheInfo.cacheAge}
                onRefresh={() => refetch()}
              />
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Conheça os atletas e acompanhe sua evolução
              </p>
            </header>

            {/* Search - always visible */}
            <div className="max-w-2xl mx-auto mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar atleta por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 text-base"
                />
              </div>
            </div>

            {/* Collapsible Filters */}
            <div className="max-w-2xl mx-auto mb-6">
              <CollapsibleFilters 
                activeFiltersCount={activeFiltersCount}
                onClearFilters={activeFiltersCount > 0 ? clearFilters : undefined}
              >
                <div className="grid grid-cols-2 gap-2 w-full md:contents">
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Gênero" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-[100]">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Masculino">🧔 Masc</SelectItem>
                      <SelectItem value="Feminino">👩 Fem</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-[100]">
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="C">Cat. C</SelectItem>
                      <SelectItem value="D">Cat. D</SelectItem>
                      <SelectItem value="Iniciante">Iniciante</SelectItem>
                    </SelectContent>
                  </Select>

                  <MultiSelect
                    options={cities}
                    selected={selectedCities}
                    onChange={setSelectedCities}
                    placeholder="Cidades"
                    className="h-10"
                  />

                  <Select value={pointsFilter} onValueChange={setPointsFilter}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Pontos" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-[100]">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="0-160">0-159 pts</SelectItem>
                      <SelectItem value="160-300">160-299 pts</SelectItem>
                      <SelectItem value="300+">300+ pts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleFilters>
            </div>

          {isLoading ? (
            <LoadingSpinner message="Carregando atletas..." />
          ) : error ? (
            <div className="text-center py-8 px-4">
              <div className="bg-destructive/10 rounded-lg p-5 max-w-md mx-auto">
                <p className="text-destructive font-medium mb-2 text-sm">Erro ao carregar</p>
                <p className="text-xs text-muted-foreground mb-4">
                  {!isOnline 
                    ? 'Você está offline.'
                    : 'Verifique sua conexão.'
                  }
                </p>
                <button 
                  onClick={() => refetch()} 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          ) : !filteredAthletes || filteredAthletes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum atleta encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-7xl mx-auto">
              {filteredAthletes.map((athlete) => (
                <AthleteAchievementsDialog
                  key={athlete.id}
                  athleteId={athlete.id}
                  athleteName={athlete.name}
                  athletePoints={athlete.points}
                  athleteCategory={athlete.category}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-primary/30 group">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="flex items-start justify-between gap-2">
                        <span className="text-base group-hover:text-primary transition-colors flex items-center gap-1.5 flex-1 truncate">
                          {athlete.name}
                          {getAthleteFirstPlaces(athlete.id) >= 3 && (
                            <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </span>
                        <Badge 
                          variant={
                            athlete.category === "C" ? "default" :
                            athlete.category === "D" ? "secondary" : "outline"
                          }
                          className="text-xs"
                        >
                          {athlete.category}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 px-4 pb-4">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{athlete.city}</span>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {athlete.points}
                        <span className="text-xs font-normal text-muted-foreground ml-1">pts</span>
                      </div>
                      {(() => {
                        const activePoints = (athlete as any).active_points ?? 0;
                        const progress = getCategoryProgress(activePoints, athlete.category);
                        return progress.nextCategory ? (
                          <div className="space-y-1 pt-2 border-t">
                            <Progress value={progress.progress} className="h-1.5" />
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">{progress.remaining}</span> pts para {progress.nextCategory}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-primary pt-2 border-t flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
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
