import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, TrendingUp, Calendar, Award, ArrowRight } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import PromotionDetailsDialog from "@/components/PromotionDetailsDialog";
import { CollapsibleFilters } from "@/components/ui/collapsible-filters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CategoryHistoryItem {
  id: string;
  athlete_id: string;
  old_category: string;
  new_category: string;
  points_at_change: number;
  changed_at: string;
  athletes: {
    name: string;
    city: string;
    gender: string;
  } | null;
}

const HistoricoProgressao = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPromotion, setSelectedPromotion] = useState<CategoryHistoryItem | null>(null);

  const { data: historyData, isLoading, error } = useQuery({
    queryKey: ["category-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_history")
        .select(`
          id,
          athlete_id,
          old_category,
          new_category,
          points_at_change,
          changed_at,
          athletes (
            name,
            city,
            gender
          )
        `)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      return data as CategoryHistoryItem[];
    },
  });

  const filteredHistory = useMemo(() => {
    if (!historyData) return [];
    
    return historyData.filter((item) => {
      const athleteName = item.athletes?.name?.toLowerCase() || "";
      const matchesSearch = athleteName.includes(searchTerm.toLowerCase());
      const matchesCategory = 
        categoryFilter === "all" || 
        item.new_category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [historyData, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
    if (!historyData) return { total: 0, toD: 0, toC: 0 };
    
    return {
      total: historyData.length,
      toD: historyData.filter(h => h.new_category === "D").length,
      toC: historyData.filter(h => h.new_category === "C").length,
    };
  }, [historyData]);

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "C": return "default";
      case "D": return "secondary";
      default: return "outline";
    }
  };

  const activeFiltersCount = categoryFilter !== "all" ? 1 : 0;

  const clearFilters = () => {
    setCategoryFilter("all");
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      <section className="py-6 md:py-12">
        <div className="container mx-auto px-4 max-w-4xl">

          {/* Header - compact */}
          <header className="text-center mb-5 md:mb-8">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                Histórico de Progressão
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Acompanhe as subidas de categoria
            </p>
          </header>

          {/* Stats Cards - compact */}
          <div className="grid grid-cols-3 gap-2 mb-5 md:mb-6">
            <Card className="p-3">
              <CardDescription className="text-xs">Total</CardDescription>
              <CardTitle className="text-xl text-primary">{stats.total}</CardTitle>
            </Card>
            <Card className="p-3">
              <CardDescription className="text-xs">Para D</CardDescription>
              <CardTitle className="text-xl text-blue-600">{stats.toD}</CardTitle>
            </Card>
            <Card className="p-3">
              <CardDescription className="text-xs">Para C</CardDescription>
              <CardTitle className="text-xl text-green-600">{stats.toC}</CardTitle>
            </Card>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar atleta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Collapsible Filter */}
          <div className="mb-5 md:mb-6">
            <CollapsibleFilters 
              activeFiltersCount={activeFiltersCount}
              onClearFilters={activeFiltersCount > 0 ? clearFilters : undefined}
            >
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-10 w-full md:w-[180px]">
                  <SelectValue placeholder="Nova Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100]">
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="D">Subiu para D</SelectItem>
                  <SelectItem value="C">Subiu para C</SelectItem>
                </SelectContent>
              </Select>
            </CollapsibleFilters>
          </div>

          {isLoading ? (
            <LoadingSpinner message="Carregando histórico..." />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive text-sm">Erro ao carregar. Tente novamente.</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Nenhuma progressão encontrada.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: Card Layout */}
              <div className="md:hidden space-y-2">
                {filteredHistory.map((item) => (
                  <Card 
                    key={item.id}
                    className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setSelectedPromotion(item)}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-medium text-sm truncate flex-1">
                        {item.athletes?.name || "Atleta removido"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.changed_at), "dd/MM/yy")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={getCategoryBadgeVariant(item.old_category)} className="text-xs px-1.5">
                          {item.old_category}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-primary" />
                        <Badge variant={getCategoryBadgeVariant(item.new_category)} className="text-xs px-1.5">
                          {item.new_category}
                        </Badge>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {item.points_at_change} pts
                      </span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden md:block bg-card rounded-lg border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Atleta</TableHead>
                      <TableHead className="font-semibold text-center">Progressão</TableHead>
                      <TableHead className="font-semibold text-center">Pontos</TableHead>
                      <TableHead className="font-semibold text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((item) => (
                      <TableRow 
                        key={item.id}
                        className="hover:bg-accent/50 cursor-pointer"
                        onClick={() => setSelectedPromotion(item)}
                      >
                        <TableCell className="font-medium">
                          {item.athletes?.name || "Removido"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant={getCategoryBadgeVariant(item.old_category)}>
                              {item.old_category}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-primary" />
                            <Badge variant={getCategoryBadgeVariant(item.new_category)}>
                              {item.new_category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-primary">
                          {item.points_at_change}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {format(new Date(item.changed_at), "dd/MM/yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Info Box - compact */}
          <div className="mt-5 bg-accent/30 border rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">📊 Regras de Progressão</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><strong>500 pts ativos:</strong> Suba de categoria</p>
              <p><strong>Cat. C:</strong> Máxima da região</p>
              <p className="opacity-75">💡 Pontos históricos são preservados!</p>
            </div>
          </div>
        </div>
      </section>

      {selectedPromotion && selectedPromotion.athletes && (
        <PromotionDetailsDialog
          open={!!selectedPromotion}
          onOpenChange={(open) => !open && setSelectedPromotion(null)}
          athleteId={selectedPromotion.athlete_id}
          athleteName={selectedPromotion.athletes.name}
          oldCategory={selectedPromotion.old_category}
          newCategory={selectedPromotion.new_category}
          pointsAtChange={selectedPromotion.points_at_change}
          promotionDate={selectedPromotion.changed_at}
        />
      )}
    </div>
  );
};

export default HistoricoProgressao;
