import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy } from "lucide-react";

const mockRanking = [
  { id: 1, position: 1, name: "João Silva", category: "C", points: 850 },
  { id: 2, position: 2, name: "Maria Santos", category: "C", points: 780 },
  { id: 3, position: 3, name: "Pedro Costa", category: "D", points: 720 },
  { id: 4, position: 4, name: "Ana Oliveira", category: "D", points: 650 },
  { id: 5, position: 5, name: "Lucas Martins", category: "C", points: 590 },
  { id: 6, position: 6, name: "Fernanda Alves", category: "D", points: 540 },
  { id: 7, position: 7, name: "Carlos Souza", category: "Iniciante", points: 420 },
  { id: 8, position: 8, name: "Julia Lima", category: "Iniciante", points: 380 },
];

const Ranking = () => {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredRanking = mockRanking
    .filter(athlete => categoryFilter === "all" || athlete.category === categoryFilter)
    .map((athlete, index) => ({ ...athlete, position: index + 1 }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12">
        <div className="container mx-auto px-4">
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
                  <SelectItem value="C">Categoria C</SelectItem>
                  <SelectItem value="D">Categoria D</SelectItem>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-card rounded-lg border shadow-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="w-[100px] text-center font-bold">Posição</TableHead>
                  <TableHead className="font-bold">Nome</TableHead>
                  <TableHead className="font-bold">Categoria</TableHead>
                  <TableHead className="text-right font-bold">Pontuação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRanking.map((athlete) => (
                  <TableRow 
                    key={athlete.id}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <TableCell className="text-center font-bold">
                      {athlete.position <= 3 ? (
                        <div className="flex items-center justify-center gap-2">
                          <Trophy className={`h-5 w-5 ${
                            athlete.position === 1 ? 'text-yellow-500' :
                            athlete.position === 2 ? 'text-gray-400' :
                            'text-amber-600'
                          }`} />
                          {athlete.position}º
                        </div>
                      ) : (
                        `${athlete.position}º`
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{athlete.name}</TableCell>
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
            <h3 className="font-bold text-lg mb-3">Sistema de Pontuação</h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
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
            <p className="text-sm text-muted-foreground text-center mt-4">
              Ao atingir 500 pontos, você sobe automaticamente de categoria!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Ranking;
