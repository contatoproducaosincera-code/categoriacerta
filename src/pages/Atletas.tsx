import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin } from "lucide-react";

const Atletas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: athletes, isLoading } = useQuery({
    queryKey: ["athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select("*")
        .order("points", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredAthletes = (athletes || []).filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || athlete.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Atletas Cadastrados
          </h1>
          <p className="text-center text-muted-foreground text-lg mb-8">
            Conheça os atletas do ranking
          </p>

          <div className="max-w-4xl mx-auto mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar atleta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Categoria" />
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

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando atletas...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {filteredAthletes.map((athlete) => (
                <Card 
                  key={athlete.id}
                  className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{athlete.name}</span>
                      <Badge variant={
                        athlete.category === "A" || athlete.category === "B" || athlete.category === "C" ? "default" :
                        athlete.category === "D" ? "secondary" : "outline"
                      }>
                        {athlete.category}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 mr-2" />
                      {athlete.city}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {athlete.points} pontos
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Atletas;
