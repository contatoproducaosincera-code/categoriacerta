import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy } from "lucide-react";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";
import BackButton from "@/components/BackButton";

const Ranking = () => {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: athletes, isLoading } = useQuery({
    queryKey: ["ranking", categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("athletes")
        .select("*")
        .order("name", { ascending: true });

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Group athletes by category
  const athletesByCategory = athletes?.reduce((acc, athlete) => {
    if (!acc[athlete.category]) {
      acc[athlete.category] = [];
    }
    acc[athlete.category].push(athlete);
    return acc;
  }, {} as Record<string, typeof athletes>);

  const categories = ["A", "B", "C", "D", "Iniciante"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navbar />
      
      <section className="py-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-6 animate-fade-in">
            <BackButton />
          </div>
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-block mb-4">
              <Trophy className="h-16 w-16 text-primary animate-scale-in mx-auto mb-2" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Ranking Geral
            </h1>
            <p className="text-muted-foreground text-lg mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Acompanhe sua evolução e suba de categoria
            </p>
            
            <div className="flex justify-center mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[250px] border-2 hover:border-primary transition-all hover:shadow-lg">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🏆 Todas Categorias</SelectItem>
                  <SelectItem value="A">⭐ Categoria A</SelectItem>
                  <SelectItem value="B">💎 Categoria B</SelectItem>
                  <SelectItem value="C">🔷 Categoria C</SelectItem>
                  <SelectItem value="D">🔹 Categoria D</SelectItem>
                  <SelectItem value="Iniciante">🌱 Iniciante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando ranking...</p>
              </div>
            </div>
          ) : categoryFilter === "all" ? (
            <>
              <div className="max-w-4xl mx-auto space-y-8">
                {categories.map((category, idx) => {
                  const categoryAthletes = athletesByCategory?.[category] || [];
                  if (categoryAthletes.length === 0) return null;
                  
                  const categoryIcon = {
                    'A': '⭐',
                    'B': '💎',
                    'C': '🔷',
                    'D': '🔹',
                    'Iniciante': '🌱'
                  }[category];

                  const categoryGradient = {
                    'A': 'from-yellow-500/20 via-yellow-400/10 to-transparent',
                    'B': 'from-blue-500/20 via-blue-400/10 to-transparent',
                    'C': 'from-purple-500/20 via-purple-400/10 to-transparent',
                    'D': 'from-green-500/20 via-green-400/10 to-transparent',
                    'Iniciante': 'from-gray-500/20 via-gray-400/10 to-transparent'
                  }[category];
                  
                  return (
                    <div 
                      key={category} 
                      className="bg-card rounded-2xl border-2 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className={`bg-gradient-to-r ${categoryGradient} px-6 py-5 border-b relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 text-9xl opacity-5">{categoryIcon}</div>
                        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3 relative z-10">
                          <span className="text-4xl">{categoryIcon}</span>
                          Categoria {category}
                          <Badge variant="outline" className="ml-auto">
                            {categoryAthletes.length} atleta{categoryAthletes.length !== 1 ? 's' : ''}
                          </Badge>
                        </h2>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary/5 hover:bg-primary/5">
                            <TableHead className="font-bold text-base">Nome</TableHead>
                            <TableHead className="text-right font-bold text-base">Pontuação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryAthletes.map((athlete, athleteIdx) => (
                            <TableRow 
                              key={athlete.id}
                              className="hover:bg-accent/50 transition-all duration-200 hover:scale-[1.01] animate-fade-in"
                              style={{ animationDelay: `${(idx * 0.1) + (athleteIdx * 0.05)}s` }}
                            >
                              <TableCell className="font-medium">
                                <AthleteAchievementsDialog
                                  athleteId={athlete.id}
                                  athleteName={athlete.name}
                                  athletePoints={athlete.points}
                                  athleteCategory={athlete.category}
                                >
                                  <span className="cursor-pointer hover:text-primary transition-all hover:underline hover:scale-105 inline-block">
                                    {athlete.name}
                                  </span>
                                </AthleteAchievementsDialog>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                  {athlete.points}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 max-w-4xl mx-auto bg-gradient-to-br from-accent/40 via-accent/20 to-transparent border-2 border-border rounded-2xl p-8 shadow-xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 text-9xl opacity-5">🏆</div>
                <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-primary" />
                  Sistema de Pontuação e Categorias
                </h3>
                <div className="grid md:grid-cols-3 gap-6 text-center mb-6">
                  <div className="bg-card rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1 border">
                    <div className="text-5xl mb-2">🥇</div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">+100</div>
                    <div className="text-sm text-muted-foreground mt-1">1º Lugar</div>
                  </div>
                  <div className="bg-card rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1 border">
                    <div className="text-5xl mb-2">🥈</div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-gray-500 to-gray-400 bg-clip-text text-transparent">+80</div>
                    <div className="text-sm text-muted-foreground mt-1">2º Lugar</div>
                  </div>
                  <div className="bg-card rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1 border">
                    <div className="text-5xl mb-2">🥉</div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent">+60</div>
                    <div className="text-sm text-muted-foreground mt-1">3º Lugar</div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3 bg-card/50 rounded-xl p-4 border">
                    <p className="flex items-center gap-2 text-sm">
                      <span className="text-2xl">🌱➡️🔹</span>
                      <strong>500 pontos:</strong> Iniciante → D
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <span className="text-2xl">🔹➡️🔷</span>
                      <strong>500 pontos:</strong> D → C
                    </p>
                  </div>
                  <div className="space-y-3 bg-card/50 rounded-xl p-4 border">
                    <p className="flex items-center gap-2 text-sm">
                      <span className="text-2xl">🔷➡️💎</span>
                      <strong>500 pontos:</strong> C → B
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <span className="text-2xl">💎➡️⭐</span>
                      <strong>500 pontos:</strong> B → A
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="max-w-4xl mx-auto bg-card rounded-2xl border-2 shadow-xl overflow-hidden animate-fade-in">
                <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-6 py-5 border-b">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Trophy className="h-6 w-6" />
                    {categoryFilter === "A" && "⭐ Categoria A"}
                    {categoryFilter === "B" && "💎 Categoria B"}
                    {categoryFilter === "C" && "🔷 Categoria C"}
                    {categoryFilter === "D" && "🔹 Categoria D"}
                    {categoryFilter === "Iniciante" && "🌱 Iniciante"}
                    <Badge variant="outline" className="ml-auto">
                      {athletes?.length || 0} atleta{athletes?.length !== 1 ? 's' : ''}
                    </Badge>
                  </h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5 hover:bg-primary/5">
                      <TableHead className="font-bold text-base">Nome</TableHead>
                      <TableHead className="font-bold text-base">Categoria</TableHead>
                      <TableHead className="text-right font-bold text-base">Pontuação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(athletes || []).map((athlete, idx) => (
                      <TableRow 
                        key={athlete.id}
                        className="hover:bg-accent/50 transition-all duration-200 hover:scale-[1.01] animate-fade-in"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <TableCell className="font-medium">
                          <AthleteAchievementsDialog
                            athleteId={athlete.id}
                            athleteName={athlete.name}
                            athletePoints={athlete.points}
                            athleteCategory={athlete.category}
                          >
                            <span className="cursor-pointer hover:text-primary transition-all hover:underline hover:scale-105 inline-block">
                              {athlete.name}
                            </span>
                          </AthleteAchievementsDialog>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              athlete.category === "A" || athlete.category === "B" || athlete.category === "C" ? "default" :
                              athlete.category === "D" ? "secondary" : "outline"
                            }
                            className="hover:scale-110 transition-transform"
                          >
                            {athlete.category === "A" && "⭐ A"}
                            {athlete.category === "B" && "💎 B"}
                            {athlete.category === "C" && "🔷 C"}
                            {athlete.category === "D" && "🔹 D"}
                            {athlete.category === "Iniciante" && "🌱 Iniciante"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            {athlete.points}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-8 max-w-4xl mx-auto bg-gradient-to-br from-accent/40 via-accent/20 to-transparent border-2 border-border rounded-2xl p-8 shadow-xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 text-9xl opacity-5">🏆</div>
                <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-primary" />
                  Sistema de Pontuação e Categorias
                </h3>
                <div className="grid md:grid-cols-3 gap-6 text-center mb-6">
                  <div className="bg-card rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1 border">
                    <div className="text-5xl mb-2">🥇</div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">+100</div>
                    <div className="text-sm text-muted-foreground mt-1">1º Lugar</div>
                  </div>
                  <div className="bg-card rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1 border">
                    <div className="text-5xl mb-2">🥈</div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-gray-500 to-gray-400 bg-clip-text text-transparent">+80</div>
                    <div className="text-sm text-muted-foreground mt-1">2º Lugar</div>
                  </div>
                  <div className="bg-card rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1 border">
                    <div className="text-5xl mb-2">🥉</div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent">+60</div>
                    <div className="text-sm text-muted-foreground mt-1">3º Lugar</div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3 bg-card/50 rounded-xl p-4 border">
                    <p className="flex items-center gap-2 text-sm">
                      <span className="text-2xl">🌱➡️🔹</span>
                      <strong>500 pontos:</strong> Iniciante → D
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <span className="text-2xl">🔹➡️🔷</span>
                      <strong>500 pontos:</strong> D → C
                    </p>
                  </div>
                  <div className="space-y-3 bg-card/50 rounded-xl p-4 border">
                    <p className="flex items-center gap-2 text-sm">
                      <span className="text-2xl">🔷➡️💎</span>
                      <strong>500 pontos:</strong> C → B
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <span className="text-2xl">💎➡️⭐</span>
                      <strong>500 pontos:</strong> B → A
                    </p>
                  </div>
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
