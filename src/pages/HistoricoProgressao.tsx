import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, TrendingUp, Calendar, Award, ArrowRight } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import PromotionDetailsDialog from "@/components/PromotionDetailsDialog";
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 lg:mb-8">
            <BackButton />
          </div>

          <div className="text-center mb-10 lg:mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="h-10 w-10 text-primary" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                Histórico de Progressão
              </h1>
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Acompanhe as subidas de categoria dos atletas
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Promoções</CardDescription>
                <CardTitle className="text-3xl text-primary">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Subiram para D</CardDescription>
                <CardTitle className="text-3xl text-blue-600">{stats.toD}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Subiram para C</CardDescription>
                <CardTitle className="text-3xl text-green-600">{stats.toC}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center items-stretch sm:items-center mb-8">
            <div className="relative w-full sm:w-auto sm:min-w-[280px] lg:min-w-[320px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar atleta por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 text-base shadow-sm"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-12">
                <SelectValue placeholder="Nova Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-background z-[100]">
                <SelectItem value="all">Todas as Promoções</SelectItem>
                <SelectItem value="D">Subiu para D</SelectItem>
                <SelectItem value="C">Subiu para C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <LoadingSpinner message="Carregando histórico..." />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">Erro ao carregar histórico. Por favor, tente novamente.</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                {searchTerm || categoryFilter !== "all" 
                  ? "Nenhuma progressão encontrada com os filtros selecionados."
                  : "Nenhuma progressão de categoria registrada ainda."}
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto bg-card rounded-lg border shadow-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead className="font-bold">Atleta</TableHead>
                    <TableHead className="font-bold">Cidade</TableHead>
                    <TableHead className="font-bold text-center">Progressão</TableHead>
                    <TableHead className="font-bold text-center">Pontos</TableHead>
                    <TableHead className="font-bold text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((item) => (
                    <TableRow 
                      key={item.id}
                      className="hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedPromotion(item)}
                    >
                      <TableCell className="font-medium">
                        <span className="hover:text-primary hover:underline">
                          {item.athletes?.name || "Atleta removido"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.athletes?.city || "-"}
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
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(item.changed_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 max-w-4xl mx-auto bg-accent/30 border border-border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3">Regras de Progressão</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📊 <strong>160 pontos:</strong> Iniciante → D</p>
              <p>📊 <strong>300 pontos:</strong> D → C (categoria máxima)</p>
              <p className="text-xs mt-2">💡 Ao subir de categoria, o atleta começa com 0 pontos na nova categoria.</p>
              <p className="text-xs">👆 Clique no nome de um atleta para ver os detalhes da promoção.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promotion Details Dialog */}
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
