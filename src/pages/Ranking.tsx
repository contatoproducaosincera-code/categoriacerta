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
            
            <div className="flex justify-center mb-8">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="A">Categoria A</SelectItem>
                  <SelectItem value="B">Categoria B</SelectItem>
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
          ) : categoryFilter === "all" ? (
            <>
              <div className="max-w-4xl mx-auto space-y-8">
                {categories.map((category) => {
                  const categoryAthletes = athletesByCategory?.[category] || [];
                  if (categoryAthletes.length === 0) return null;
                  
                  return (
                    <div key={category} className="bg-card rounded-lg border shadow-lg overflow-hidden">
                      <div className="bg-primary/10 px-6 py-4 border-b">
                        <h2 className="text-2xl font-bold">Categoria {category}</h2>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary/5">
                            <TableHead className="font-bold">Nome</TableHead>
                            <TableHead className="text-right font-bold">Pontuação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryAthletes.map((athlete) => (
                            <TableRow 
                              key={athlete.id}
                              className="hover:bg-accent/50 transition-colors"
                            >
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
                              <TableCell className="text-right font-bold text-primary">
                                {athlete.points}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
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
                  <p>📊 <strong>1000 pontos:</strong> D → C</p>
                  <p>📊 <strong>1500 pontos:</strong> C → B</p>
                  <p>📊 <strong>2000 pontos:</strong> B → A</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="max-w-4xl mx-auto bg-card rounded-lg border shadow-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5">
                      <TableHead className="font-bold">Nome</TableHead>
                      <TableHead className="font-bold">Categoria</TableHead>
                      <TableHead className="text-right font-bold">Pontuação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(athletes || []).map((athlete) => (
                      <TableRow 
                        key={athlete.id}
                        className="hover:bg-accent/50 transition-colors"
                      >
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
                        <TableCell>
                          <Badge variant={
                            athlete.category === "A" || athlete.category === "B" || athlete.category === "C" ? "default" :
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
                  <p>📊 <strong>1000 pontos:</strong> D → C</p>
                  <p>📊 <strong>1500 pontos:</strong> C → B</p>
                  <p>📊 <strong>2000 pontos:</strong> B → A</p>
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
