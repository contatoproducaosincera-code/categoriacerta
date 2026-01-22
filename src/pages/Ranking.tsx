import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useOfflineAthletes } from "@/hooks/useOfflineData";
import OfflineIndicator from "@/components/OfflineIndicator";
import { InstagramWebViewWarning } from "@/components/InstagramWebViewWarning";
import { RankingMobileCard } from "@/components/ranking/RankingMobileCard";
import { RankingDesktopTable } from "@/components/ranking/RankingDesktopTable";
import { RankingScoringInfo } from "@/components/ranking/RankingScoringInfo";
import { CollapsibleFilters } from "@/components/ui/collapsible-filters";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Search } from "lucide-react";

const Ranking = () => {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const { 
    athletes: allAthletes, 
    isLoading, 
    error,
    isOnline,
    isFromCache,
    cacheInfo,
    refetch,
  } = useOfflineAthletes();

  const athletes = useMemo(() => {
    if (!allAthletes) return [];
    return allAthletes.filter(athlete => {
      const matchesCategory = categoryFilter === "all" || athlete.category === categoryFilter;
      const matchesGender = genderFilter === "all" || athlete.gender === genderFilter;
      return matchesCategory && matchesGender;
    });
  }, [allAthletes, categoryFilter, genderFilter]);
  
  const { availableCities, filteredAthletes } = useMemo(() => {
    if (!athletes) return { availableCities: [], filteredAthletes: [] };
    
    const cities = [...new Set(athletes.map(a => a.city))].sort();
    const filtered = athletes.filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = selectedCities.length === 0 || selectedCities.includes(athlete.city);
      return matchesSearch && matchesCity;
    });
    
    return { availableCities: cities, filteredAthletes: filtered };
  }, [athletes, searchTerm, selectedCities]);

  const activeFiltersCount = [
    genderFilter !== "all",
    categoryFilter !== "all",
    selectedCities.length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setGenderFilter("all");
    setCategoryFilter("all");
    setSelectedCities([]);
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-4">
        <InstagramWebViewWarning />
      </div>
      
      <section className="py-6 md:py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* Header - compact on mobile */}
          <header className="text-center mb-5 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
              Ranking Geral
            </h1>
            
            <OfflineIndicator
              isOnline={isOnline}
              isFromCache={isFromCache}
              cacheAge={cacheInfo.cacheAge}
              onRefresh={() => refetch()}
            />
            
            <p className="text-sm text-muted-foreground mt-2">
              Acompanhe sua evolução e suba de categoria
            </p>
          </header>

          {/* Search - always visible */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar atleta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-base w-full"
            />
          </div>

          {/* Collapsible Filters */}
          <div className="mb-5 md:mb-6">
            <CollapsibleFilters 
              activeFiltersCount={activeFiltersCount}
              onClearFilters={activeFiltersCount > 0 ? clearFilters : undefined}
            >
              {/* Mobile filter content */}
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
                  options={availableCities}
                  selected={selectedCities}
                  onChange={setSelectedCities}
                  placeholder="Cidades"
                  className="col-span-2 h-10 md:w-[180px]"
                />
              </div>
            </CollapsibleFilters>
          </div>

          {/* Content */}
          {isLoading ? (
            <LoadingSpinner message="Carregando ranking..." />
          ) : error ? (
            <div className="text-center py-8 px-4">
              <div className="max-w-md mx-auto bg-destructive/10 border border-destructive/20 rounded-lg p-5">
                <p className="text-destructive font-medium mb-2 text-sm">
                  Erro ao carregar ranking
                </p>
                <p className="text-muted-foreground text-xs mb-4">
                  {!isOnline 
                    ? "Você está offline e não há dados em cache."
                    : "Verifique sua conexão e tente novamente."
                  }
                </p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => refetch()} 
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            </div>
          ) : !filteredAthletes || filteredAthletes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum atleta encontrado.
              </p>
            </div>
          ) : (
            <div className="space-y-5 md:space-y-6">
              {/* Mobile: Card Layout */}
              <div className="md:hidden space-y-2">
                {filteredAthletes.map((athlete, index) => (
                  <RankingMobileCard 
                    key={athlete.id} 
                    athlete={athlete} 
                    position={index} 
                  />
                ))}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden md:block">
                <RankingDesktopTable athletes={filteredAthletes} />
              </div>

              {/* Scoring Information */}
              <RankingScoringInfo />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Ranking;
