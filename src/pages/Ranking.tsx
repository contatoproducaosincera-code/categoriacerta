import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trophy, Search, BadgeCheck, ArrowUp, ArrowDown, Minus } from "lucide-react";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";
import BackButton from "@/components/BackButton";

const Ranking = () => {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: athletes, isLoading } = useQuery({
    queryKey: ["ranking", categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("athletes")
        .select("*")
        .order("points", { ascending: false });

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Sort alphabetically by name
      return data?.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')) || [];
    },
  });

  // Buscar contagem de primeiros lugares para cada atleta
  const { data: firstPlaceCounts } = useQuery({
    queryKey: ["first-place-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("athlete_id")
        .eq("position", 1);

      if (error) throw error;
      
      // Contar quantos primeiros lugares cada atleta tem
      const counts: Record<string, number> = {};
      data?.forEach((achievement) => {
        counts[achievement.athlete_id] = (counts[achievement.athlete_id] || 0) + 1;
      });
      
      return counts;
    },
  });

  // Buscar histórico de posições para calcular mudanças
  const { data: positionChanges } = useQuery({
    queryKey: ["position-changes"],
    queryFn: async () => {
      // Buscar as duas últimas entradas de ranking para cada atleta
      const { data, error } = await supabase
        .from("ranking_history")
        .select("athlete_id, position, recorded_at")
        .order("recorded_at", { ascending: false });

      if (error) throw error;
      
      // Agrupar por atleta e pegar as duas últimas posições
      const changes: Record<string, number> = {};
      const athletePositions: Record<string, number[]> = {};
      
      data?.forEach((record) => {
        if (!athletePositions[record.athlete_id]) {
          athletePositions[record.athlete_id] = [];
        }
        if (athletePositions[record.athlete_id].length < 2) {
          athletePositions[record.athlete_id].push(record.position);
        }
      });
      
      // Calcular mudança (posição anterior - posição atual)
      // Positivo = subiu, Negativo = caiu
      Object.keys(athletePositions).forEach((athleteId) => {
        const positions = athletePositions[athleteId];
        if (positions.length === 2) {
          changes[athleteId] = positions[1] - positions[0];
        }
      });
      
      return changes;
    },
  });

  const getAthleteFirstPlaces = (athleteId: string) => {
    return firstPlaceCounts?.[athleteId] || 0;
  };

  const getRankingChange = (athleteId: string) => {
    return positionChanges?.[athleteId] || 0;
  };

  const getRankingChangeIcon = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600 animate-fade-in">
          <ArrowUp className="h-3 w-3" />
          <span className="text-xs font-semibold">+{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 animate-fade-in">
          <ArrowDown className="h-3 w-3" />
          <span className="text-xs font-semibold">{change}</span>
        </div>
      );
    }
    return null;
  };

  // Filter athletes by search term
  const filteredAthletes = athletes?.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <BackButton />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Ranking Geral
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Acompanhe sua evolução e suba de categoria
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar atleta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="C">Categoria C</SelectItem>
                  <SelectItem value="D">Categoria D</SelectItem>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando ranking...</p>
            </div>
          ) : (
            <>
              <div className="max-w-4xl mx-auto bg-card rounded-lg border shadow-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5">
                      <TableHead className="w-[100px] text-center font-bold">Posição</TableHead>
                      <TableHead className="font-bold">Nome</TableHead>
                      <TableHead className="font-bold">Cidade</TableHead>
                      <TableHead className="font-bold">Categoria</TableHead>
                      <TableHead className="text-right font-bold">Pontuação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredAthletes || []).map((athlete, index) => (
                      <TableRow 
                        key={athlete.id}
                        className="hover:bg-accent/50 transition-colors"
                      >
                        <TableCell className="text-center font-bold">
                          {index < 3 ? (
                            <div className="flex items-center justify-center gap-2">
                              <Trophy className={`h-5 w-5 ${
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
                            <span className="cursor-pointer hover:text-primary transition-colors hover:underline flex items-center gap-2">
                              {athlete.name}
                              {getAthleteFirstPlaces(athlete.id) >= 3 && (
                                <BadgeCheck className="h-4 w-4 text-primary animate-scale-in" />
                              )}
                              {getRankingChangeIcon(getRankingChange(athlete.id))}
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

              <div className="mt-8 max-w-4xl mx-auto bg-accent/30 border border-border rounded-lg p-6">
                <h3 className="font-bold text-lg mb-3">Sistema de Pontuação e Categorias</h3>
                <div className="grid md:grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <div className="text-3xl font-bold text-yellow-600">+100</div>
                    <div className="text-sm text-muted-foreground">1º Lugar</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-500">+80</div>
                    <div className="text-sm text-muted-foreground">2º Lugar</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-700">+60</div>
                    <div className="text-sm text-muted-foreground">3º Lugar</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>📊 <strong>500 pontos:</strong> Iniciante → D</p>
                  <p>📊 <strong>500 pontos:</strong> D → C (categoria máxima)</p>
                  <p className="text-xs mt-2">💡 A cada 500 pontos você sobe uma categoria!</p>
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
