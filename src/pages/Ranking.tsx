import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useOfflineAthletes } from "@/hooks/useOfflineData";
import OfflineIndicator from "@/components/OfflineIndicator";
import { InstagramWebViewWarning } from "@/components/InstagramWebViewWarning";
import { RankingFilters } from "@/components/ranking/RankingFilters";
import { RankingMobileCard } from "@/components/ranking/RankingMobileCard";
import { RankingDesktopTable } from "@/components/ranking/RankingDesktopTable";
import { RankingScoringInfo } from "@/components/ranking/RankingScoringInfo";

const Ranking = () => {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  // Offline-first data fetching
  const { 
    athletes: allAthletes, 
    isLoading, 
    error,
    isOnline,
    isFromCache,
    cacheInfo,
    refetch,
  } = useOfflineAthletes();

  // Filter athletes based on category and gender
  const athletes = useMemo(() => {
    if (!allAthletes) return [];
    return allAthletes.filter(athlete => {
      const matchesCategory = categoryFilter === "all" || athlete.category === categoryFilter;
      const matchesGender = genderFilter === "all" || athlete.gender === genderFilter;
      return matchesCategory && matchesGender;
    });
  }, [allAthletes, categoryFilter, genderFilter]);
  
  // Extract cities and filter athletes
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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      {/* WebView Warning */}
      <div className="container mx-auto px-4 pt-4">
        <InstagramWebViewWarning />
      </div>
      
      <section className="py-6 md:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
          
          {/* Header */}
          <header className="text-center mb-6 md:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-2">
              Ranking Geral
            </h1>
            
            <OfflineIndicator
              isOnline={isOnline}
              isFromCache={isFromCache}
              cacheAge={cacheInfo.cacheAge}
              onRefresh={() => refetch()}
            />
            
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-3 max-w-md mx-auto">
              Acompanhe sua evolução e suba de categoria
            </p>
          </header>

          {/* Filters */}
          <div className="mb-6 md:mb-8">
            <RankingFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              genderFilter={genderFilter}
              onGenderChange={setGenderFilter}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              selectedCities={selectedCities}
              onCitiesChange={setSelectedCities}
              availableCities={availableCities}
            />
          </div>

          {/* Content */}
          {isLoading ? (
            <LoadingSpinner message="Carregando ranking..." />
          ) : error ? (
            <div className="text-center py-12 px-4">
              <div className="max-w-md mx-auto bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                <p className="text-destructive font-medium mb-2">
                  Erro ao carregar ranking
                </p>
                <p className="text-muted-foreground text-sm mb-4">
                  {!isOnline 
                    ? "Você está offline e não há dados em cache disponíveis."
                    : "Não foi possível carregar os dados. Verifique sua conexão e tente novamente."
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button 
                    onClick={() => refetch()} 
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Tentar Novamente
                  </button>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
                  >
                    Recarregar Página
                  </button>
                </div>
              </div>
            </div>
          ) : !filteredAthletes || filteredAthletes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Nenhum atleta encontrado com os filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              {/* Mobile: Card Layout - full width, vertical stack */}
              <div className="md:hidden space-y-3 w-full">
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
