import { useMemo, useState, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, MessageCircle, Trophy, ChevronLeft, ChevronRight, Clock, CheckCircle, Repeat, X } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { format, isFuture, isPast, isToday, parseISO, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CollapsibleFilters } from "@/components/ui/collapsible-filters";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  date: string;
  location: string;
  category: "C" | "D" | "Iniciante" | "Iniciante + D" | "D + C" | "Todas";
  whatsapp: string | null;
  image_url: string | null;
  is_recurring: boolean;
  recurrence_type: "weekly" | "biweekly" | "monthly" | null;
  recurrence_day: number | null;
}

const TournamentCard = memo(({ torneio, status }: { torneio: Tournament; status: "future" | "today" | "past" }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleWhatsAppClick = useCallback(() => {
    if (torneio.whatsapp) {
      if (torneio.whatsapp.startsWith('http')) {
        window.open(torneio.whatsapp, '_blank');
      } else {
        const phone = torneio.whatsapp.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
      }
    }
  }, [torneio.whatsapp]);

  const statusConfig = {
    future: { label: "Próximo", icon: Clock, className: "bg-primary text-primary-foreground" },
    today: { label: "Hoje!", icon: Trophy, className: "bg-green-500 text-white animate-pulse" },
    past: { label: "Encerrado", icon: CheckCircle, className: "bg-muted text-muted-foreground" },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const isPastTournament = status === "past";

  return (
    <div 
      className={`group relative overflow-hidden rounded-xl bg-card border shadow-sm hover:shadow-lg transition-all duration-200 ${isPastTournament ? "opacity-70" : ""}`}
    >
      <AspectRatio ratio={4 / 5} className="relative">
        {!imageLoaded && !imageError && torneio.image_url && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        
        {torneio.image_url && !imageError ? (
          <img
            src={torneio.image_url}
            alt={torneio.name}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isPastTournament ? "grayscale" : ""
            } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center ${isPastTournament ? "grayscale" : ""}`}>
            <Trophy className="h-12 w-12 text-primary/30 mb-2" />
            <span className="text-xs text-muted-foreground">Sem imagem</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute top-2 right-2 z-10">
          <Badge className={`${config.className} text-xs shadow`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        <div className="absolute top-2 left-2 z-10 flex gap-1">
          <Badge variant="outline" className="bg-background/90 text-xs">
            {torneio.category}
          </Badge>
          {torneio.is_recurring && (
            <Badge variant="outline" className="bg-background/90 px-1">
              <Repeat className="h-3 w-3" />
            </Badge>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3 className="font-bold text-sm text-white mb-1.5 line-clamp-2">
            {torneio.name}
          </h3>
          
          <div className="space-y-1">
            <div className="flex items-center text-xs text-white/90">
              <Calendar className="h-3 w-3 mr-1.5 shrink-0" />
              <span>{format(parseISO(torneio.date), "d MMM, yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center text-xs text-white/80">
              <MapPin className="h-3 w-3 mr-1.5 shrink-0" />
              <span className="truncate">{torneio.location}</span>
            </div>
          </div>

          {!isPastTournament && torneio.whatsapp && (
            <Button 
              className="w-full mt-2 bg-white/20 hover:bg-white/30 border-white/30 text-white text-xs h-8"
              variant="outline"
              size="sm"
              onClick={handleWhatsAppClick}
            >
              <MessageCircle className="mr-1.5 h-3 w-3" />
              Inscreva-se
            </Button>
          )}
        </div>
      </AspectRatio>
    </div>
  );
});

TournamentCard.displayName = "TournamentCard";

const MonthSelector = memo(({ 
  currentMonth, 
  onPrevMonth, 
  onNextMonth,
  onReset 
}: { 
  currentMonth: Date; 
  onPrevMonth: () => void; 
  onNextMonth: () => void;
  onReset: () => void;
}) => (
  <div className="flex items-center gap-1 bg-card border rounded-lg p-1.5">
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrevMonth}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <button 
      onClick={onReset}
      className="font-medium text-sm min-w-[120px] text-center capitalize hover:text-primary transition-colors"
    >
      {format(currentMonth, "MMM yyyy", { locale: ptBR })}
    </button>
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNextMonth}>
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
));

MonthSelector.displayName = "MonthSelector";

const Torneios = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [showPast, setShowPast] = useState(false);

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      return data as Tournament[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const cities = useMemo(() => {
    if (!tournaments) return [];
    return [...new Set(tournaments.map(t => t.location))].sort();
  }, [tournaments]);

  const handlePrevMonth = useCallback(() => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  const handleResetMonth = useCallback(() => {
    setSelectedMonth(new Date());
  }, []);

  const { futureTournaments, pastTournaments, monthTournaments } = useMemo(() => {
    if (!tournaments) return { futureTournaments: [], pastTournaments: [], monthTournaments: [] };

    const filtered = tournaments.filter(t => {
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      const matchesCity = cityFilter === "all" || t.location === cityFilter;
      return matchesCategory && matchesCity;
    });

    const future = filtered.filter(t => {
      const date = parseISO(t.date);
      return isFuture(date) || isToday(date);
    });

    const past = filtered.filter(t => {
      const date = parseISO(t.date);
      return isPast(date) && !isToday(date);
    }).reverse();

    const inMonth = filtered.filter(t => {
      const date = parseISO(t.date);
      return isSameMonth(date, selectedMonth);
    });

    return { 
      futureTournaments: future, 
      pastTournaments: past,
      monthTournaments: inMonth 
    };
  }, [tournaments, categoryFilter, cityFilter, selectedMonth]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Tournament[]> = {};
    
    monthTournaments.forEach(t => {
      const dateKey = t.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [monthTournaments]);

  const getTournamentStatus = (dateStr: string): "future" | "today" | "past" => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "today";
    if (isFuture(date)) return "future";
    return "past";
  };

  const activeFiltersCount = [
    categoryFilter !== "all",
    cityFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setCategoryFilter("all");
    setCityFilter("all");
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      <section className="py-6 md:py-10">
        <div className="container mx-auto px-4">
          
          {/* Header - compact */}
          <header className="text-center mb-5 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
              Calendário de Torneios
            </h1>
            <p className="text-sm text-muted-foreground">
              Encontre e inscreva-se nos próximos torneios
            </p>
          </header>

          {/* Month selector + Filters */}
          <div className="flex flex-col gap-3 items-center mb-5 md:mb-6">
            <MonthSelector 
              currentMonth={selectedMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onReset={handleResetMonth}
            />

            <div className="w-full max-w-md">
              <CollapsibleFilters 
                activeFiltersCount={activeFiltersCount}
                onClearFilters={activeFiltersCount > 0 ? clearFilters : undefined}
              >
                <div className="grid grid-cols-2 gap-2 w-full md:contents">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-[100]">
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="Iniciante">Iniciante</SelectItem>
                      <SelectItem value="D">Cat. D</SelectItem>
                      <SelectItem value="C">Cat. C</SelectItem>
                      <SelectItem value="Iniciante + D">Ini + D</SelectItem>
                      <SelectItem value="D + C">D + C</SelectItem>
                      <SelectItem value="Todas">Abertas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Cidade" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-[100]">
                      <SelectItem value="all">Todas</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleFilters>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-4 mb-5 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>{futureTournaments.length} próximo{futureTournaments.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span>{pastTournaments.length} encerrado{pastTournaments.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Carregando...</p>
              </div>
            </div>
          ) : monthTournaments.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm mb-3">
                Nenhum torneio em {format(selectedMonth, "MMMM", { locale: ptBR })}.
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6 max-w-6xl mx-auto">
              {groupedByDate.map(([dateKey, dateTournaments]) => {
                const date = parseISO(dateKey);
                const status = getTournamentStatus(dateKey);
                
                return (
                  <div key={dateKey} className="space-y-3">
                    <div className={`py-2 px-3 rounded-lg border-l-4 ${
                      status === "today" 
                        ? "bg-green-500/10 border-green-500" 
                        : status === "future" 
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/50 border-muted-foreground/30"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-semibold text-sm capitalize">
                            {format(date, "EEEE", { locale: ptBR })}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {format(date, "d 'de' MMM", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant={status === "past" ? "secondary" : "default"} className="text-xs">
                          {dateTournaments.length}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                      {dateTournaments.map(torneio => (
                        <TournamentCard 
                          key={torneio.id} 
                          torneio={torneio} 
                          status={status}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pastTournaments.length > 0 && (
            <div className="mt-8 text-center">
              <Button variant="outline" size="sm" onClick={() => setShowPast(!showPast)}>
                {showPast ? "Ocultar" : `Ver ${pastTournaments.length} encerrado${pastTournaments.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          )}

          {showPast && pastTournaments.length > 0 && (
            <div className="mt-6 max-w-6xl mx-auto">
              <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Encerrados</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {pastTournaments.slice(0, 8).map(torneio => (
                  <TournamentCard key={torneio.id} torneio={torneio} status="past" />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Torneios;
