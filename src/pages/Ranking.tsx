import { useState, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trophy, Search } from "lucide-react";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";
import { MultiSelect } from "@/components/ui/multi-select";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useOfflineAthletes } from "@/hooks/useOfflineData";
import OfflineIndicator from "@/components/OfflineIndicator";
import { InstagramWebViewWarning } from "@/components/InstagramWebViewWarning";

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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-4">
        <InstagramWebViewWarning />
      </div>
      
      <section className="py-6 md:py-12 lg:py-16">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-full overflow-x-hidden">
          
          <div className="text-center mb-6 md:mb-10 lg:mb-14">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-1 lg:mb-2">
                Ranking Geral
              </h1>
              <OfflineIndicator
                isOnline={isOnline}
                isFromCache={isFromCache}
                cacheAge={cacheInfo.cacheAge}
                onRefresh={() => refetch()}
              />
            </div>
            <p className="text-sm sm:text-base lg:text-xl text-muted-foreground mb-4 md:mb-8 lg:mb-10 max-w-2xl mx-auto px-2 mt-2">
              Acompanhe sua evolução e suba de categoria
            </p>
            
            {/* Filtros - Grid responsivo */}
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 md:gap-3 lg:gap-4 justify-center items-stretch sm:items-center sm:flex-wrap max-w-4xl mx-auto">
              <div className="relative col-span-2 sm:col-span-1 sm:min-w-[240px] lg:min-w-[280px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 md:h-5 md:w-5" />
                <Input
                  type="text"
                  placeholder="Buscar atleta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 md:h-12 text-sm md:text-base shadow-sm"
                />
              </div>
              
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-full sm:w-[140px] lg:w-[170px] h-10 md:h-12 text-sm">
                  <SelectValue placeholder="Gênero" />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100]">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Masculino">🧔 Masc</SelectItem>
                  <SelectItem value="Feminino">👩 Fem</SelectItem>
                </SelectContent>
              </Select>
              
              <MultiSelect
                options={availableCities}
                selected={selectedCities}
                onChange={setSelectedCities}
                placeholder="Cidades"
                className="w-full sm:w-[160px] lg:w-[200px] h-10 md:h-12"
              />
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[140px] lg:w-[170px] h-10 md:h-12 text-sm">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100]">
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="C">Cat. C</SelectItem>
                  <SelectItem value="D">Cat. D</SelectItem>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
              <p className="text-muted-foreground text-lg">Nenhum atleta encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card Layout */}
              <div className="md:hidden space-y-3 max-w-lg mx-auto">
                {filteredAthletes.map((athlete, index) => (
                  <AthleteAchievementsDialog
                    key={athlete.id}
                    athleteId={athlete.id}
                    athleteName={athlete.name}
                    athletePoints={athlete.points}
                    athleteCategory={athlete.category}
                  >
                    <div className="bg-card rounded-lg border shadow-sm p-4 cursor-pointer hover:bg-accent/50 active:bg-accent/70 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Posição */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          {index < 3 ? (
                            <div className="flex flex-col items-center">
                              <Trophy className={`h-5 w-5 ${
                                index === 0 ? 'text-yellow-500' :
                                index === 1 ? 'text-gray-400' :
                                'text-amber-600'
                              }`} />
                              <span className="text-xs font-bold">{index + 1}º</span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground">{index + 1}º</span>
                          )}
                        </div>
                        
                        {/* Info do atleta */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{athlete.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{athlete.city}</p>
                        </div>
                        
                        {/* Categoria e Pontos */}
                        <div className="flex-shrink-0 text-right">
                          <Badge variant={
                            athlete.category === "C" ? "default" :
                            athlete.category === "D" ? "secondary" : "outline"
                          } className="mb-1">
                            {athlete.category}
                          </Badge>
                          <p className="text-lg font-bold text-primary">{athlete.points}</p>
                        </div>
                      </div>
                    </div>
                  </AthleteAchievementsDialog>
                ))}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden md:block max-w-4xl mx-auto bg-card rounded-lg border shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary/5">
                        <TableHead className="w-[80px] text-center font-bold whitespace-nowrap">Posição</TableHead>
                        <TableHead className="font-bold min-w-[150px]">Nome</TableHead>
                        <TableHead className="font-bold min-w-[120px]">Cidade</TableHead>
                        <TableHead className="font-bold w-[100px]">Categoria</TableHead>
                        <TableHead className="text-right font-bold w-[80px]">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAthletes.map((athlete, index) => (
                        <TableRow 
                          key={athlete.id}
                          className="hover:bg-accent/50 transition-colors"
                        >
                          <TableCell className="text-center font-bold">
                            {index < 3 ? (
                              <div className="flex items-center justify-center gap-1">
                                <Trophy className={`h-4 w-4 ${
                                  index === 0 ? 'text-yellow-500' :
                                  index === 1 ? 'text-gray-400' :
                                  'text-amber-600'
                                }`} />
                                {index + 1}º
                              </div>
                            ) : (
                              `${index + 1}º`
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <AthleteAchievementsDialog
                              athleteId={athlete.id}
                              athleteName={athlete.name}
                              athletePoints={athlete.points}
                              athleteCategory={athlete.category}
                            >
                              <span className="cursor-pointer hover:text-primary transition-colors hover:underline">
                                {athlete.name}
                              </span>
                            </AthleteAchievementsDialog>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {athlete.city}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              athlete.category === "C" ? "default" :
                              athlete.category === "D" ? "secondary" : "outline"
                            }>
                              {athlete.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {athlete.points}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="mt-6 md:mt-8 max-w-4xl mx-auto bg-accent/30 border border-border rounded-lg p-4 md:p-6">
                <h3 className="font-bold text-base md:text-lg mb-3">Sistema de Pontuação</h3>
                <div className="grid grid-cols-3 gap-2 md:gap-4 text-center mb-4">
                  <div className="bg-background/50 rounded-lg p-2 md:p-3">
                    <div className="text-xl md:text-3xl font-bold text-yellow-600">+100</div>
                    <div className="text-xs md:text-sm text-muted-foreground">1º Lugar</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2 md:p-3">
                    <div className="text-xl md:text-3xl font-bold text-gray-500">+80</div>
                    <div className="text-xs md:text-sm text-muted-foreground">2º Lugar</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2 md:p-3">
                    <div className="text-xl md:text-3xl font-bold text-amber-700">+60</div>
                    <div className="text-xs md:text-sm text-muted-foreground">3º Lugar</div>
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground">
                  <p>📊 <strong>500 pontos ativos:</strong> Suba de categoria</p>
                  <p>📊 <strong>Categoria C:</strong> Categoria máxima</p>
                  <p className="text-xs opacity-80">💡 Apenas pontos ativos contam para subida!</p>
                </div>
                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border">
                  <a 
                    href="/historico-progressao" 
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1 text-sm md:text-base"
                  >
                    📈 Ver histórico de progressões
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Ranking;
