import { useMemo, useState, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, MessageCircle, Trophy, ChevronLeft, ChevronRight, Clock, CheckCircle, Filter, X } from "lucide-react";
import BackButton from "@/components/BackButton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { format, isFuture, isPast, isToday, parseISO, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  date: string;
  location: string;
  category: "C" | "D" | "Iniciante";
  whatsapp: string | null;
  image_url: string | null;
}

// Memoized Tournament Card - Instagram style (4:5 ratio)
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
      className={`group relative overflow-hidden rounded-2xl bg-card border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isPastTournament ? "opacity-70" : ""}`}
    >
      {/* Cover Image with 4:5 ratio (Instagram style) */}
      <AspectRatio ratio={4 / 5} className="relative">
        {/* Skeleton loader */}
        {!imageLoaded && !imageError && torneio.image_url && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
        )}
        
        {torneio.image_url && !imageError ? (
          <img
            src={torneio.image_url}
            alt={torneio.name}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              isPastTournament ? "grayscale" : ""
            } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 flex flex-col items-center justify-center ${isPastTournament ? "grayscale" : ""}`}>
            <Trophy className="h-16 w-16 text-primary/30 mb-2" />
            <span className="text-sm text-muted-foreground">Sem imagem</span>
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Status badge - top right */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className={`${config.className} shadow-lg`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        {/* Category badge - top left */}
        <div className="absolute top-3 left-3 z-10">
          <Badge 
            variant="outline" 
            className="bg-background/90 backdrop-blur-sm shadow-lg"
          >
            Cat. {torneio.category}
          </Badge>
        </div>

        {/* Content overlay - bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <h3 className="font-bold text-lg text-white mb-2 line-clamp-2 drop-shadow-lg">
            {torneio.name}
          </h3>
          
          <div className="space-y-1.5">
            <div className="flex items-center text-sm text-white/90">
              <Calendar className="h-4 w-4 mr-2 shrink-0" />
              <span className="font-medium">
                {format(parseISO(torneio.date), "d 'de' MMM, yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center text-sm text-white/80">
              <MapPin className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">{torneio.location}</span>
            </div>
          </div>

          {/* WhatsApp Button */}
          {!isPastTournament && torneio.whatsapp && (
            <Button 
              className="w-full mt-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 text-white"
              variant="outline"
              size="sm"
              onClick={handleWhatsAppClick}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Inscreva-se
            </Button>
          )}
        </div>
      </AspectRatio>
    </div>
  );
});

TournamentCard.displayName = "TournamentCard";

// Month navigation component
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
  <div className="flex items-center gap-2 bg-card border rounded-lg p-2">
    <Button variant="ghost" size="icon" onClick={onPrevMonth}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <button 
      onClick={onReset}
      className="font-semibold text-sm min-w-[140px] text-center capitalize hover:text-primary transition-colors"
    >
      {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
    </button>
    <Button variant="ghost" size="icon" onClick={onNextMonth}>
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

  // Get unique cities for filter
  const cities = useMemo(() => {
    if (!tournaments) return [];
    return [...new Set(tournaments.map(t => t.location))].sort();
  }, [tournaments]);

  // Navigate months
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

  // Filter and group tournaments
  const { futureTournaments, pastTournaments, monthTournaments } = useMemo(() => {
    if (!tournaments) return { futureTournaments: [], pastTournaments: [], monthTournaments: [] };

    const now = new Date();
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

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
    }).reverse(); // Most recent first

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

  // Group tournaments by date
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

  const hasActiveFilters = categoryFilter !== "all" || cityFilter !== "all";

  const clearFilters = useCallback(() => {
    setCategoryFilter("all");
    setCityFilter("all");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-8 md:py-12 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <BackButton />
          </div>
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Calendário de Torneios
            </h1>
            <p className="text-muted-foreground">
              Encontre e inscreva-se nos próximos torneios
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8 flex-wrap">
            <MonthSelector 
              currentMonth={selectedMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onReset={handleResetMonth}
            />

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="C">Categoria C</SelectItem>
                <SelectItem value="D">Categoria D</SelectItem>
                <SelectItem value="Iniciante">Iniciante</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Cidades</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* Stats summary */}
          <div className="flex justify-center gap-6 mb-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>{futureTournaments.length} próximo{futureTournaments.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span>{pastTournaments.length} encerrado{pastTournaments.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Carregando torneios...</p>
              </div>
            </div>
          ) : monthTournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum torneio encontrado em {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8 max-w-6xl mx-auto">
              {groupedByDate.map(([dateKey, dateTournaments]) => {
                const date = parseISO(dateKey);
                const status = getTournamentStatus(dateKey);
                
                return (
                  <div key={dateKey} className="space-y-4">
                    {/* Date header */}
                    <div className={`sticky top-0 z-10 py-3 px-4 rounded-lg border-l-4 ${
                      status === "today" 
                        ? "bg-green-500/10 border-green-500" 
                        : status === "future" 
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/50 border-muted-foreground/30"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-bold text-lg capitalize">
                            {format(date, "EEEE", { locale: ptBR })}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant={status === "past" ? "secondary" : "default"} className="shrink-0">
                          {dateTournaments.length} torneio{dateTournaments.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>

                    {/* Tournaments for this date - responsive grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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

          {/* Show past tournaments toggle */}
          {pastTournaments.length > 0 && (
            <div className="mt-12 text-center">
              <Button 
                variant="outline" 
                onClick={() => setShowPast(!showPast)}
              >
                {showPast ? "Ocultar Encerrados" : `Ver ${pastTournaments.length} Torneio${pastTournaments.length !== 1 ? "s" : ""} Encerrado${pastTournaments.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          )}

          {/* Past tournaments section */}
          {showPast && pastTournaments.length > 0 && (
            <div className="mt-8 max-w-6xl mx-auto">
              <h2 className="text-xl font-bold mb-4 text-muted-foreground">Torneios Encerrados</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {pastTournaments.slice(0, 8).map(torneio => (
                  <TournamentCard 
                    key={torneio.id} 
                    torneio={torneio} 
                    status="past"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Quer organizar um torneio? Entre em contato conosco!
            </p>
            <Button variant="outline" size="lg">
              Contato para Organização
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Torneios;
