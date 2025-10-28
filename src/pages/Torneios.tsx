import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";

const mockTorneios = [
  {
    id: 1,
    name: "Copa Verão Beach Tennis",
    date: "15/01/2025",
    location: "Rio de Janeiro - RJ",
    category: "C",
    description: "Torneio classificatório para categoria C"
  },
  {
    id: 2,
    name: "Circuito Praiano",
    date: "22/01/2025",
    location: "Florianópolis - SC",
    category: "D",
    description: "Aberto para atletas categoria D"
  },
  {
    id: 3,
    name: "Open de Beach Tennis",
    date: "05/02/2025",
    location: "São Paulo - SP",
    category: "Iniciante",
    description: "Torneio para iniciantes - Sem taxa de inscrição"
  },
  {
    id: 4,
    name: "Desafio das Quadras",
    date: "18/02/2025",
    location: "Curitiba - PR",
    category: "C",
    description: "Grande prêmio para os vencedores"
  },
];

const Torneios = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Próximos Torneios
            </h1>
            <p className="text-muted-foreground text-lg">
              Inscreva-se e mostre seu talento nas quadras
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {mockTorneios.map((torneio) => (
              <Card 
                key={torneio.id}
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl">{torneio.name}</CardTitle>
                    <Badge variant={
                      torneio.category === "C" ? "default" :
                      torneio.category === "D" ? "secondary" : "outline"
                    }>
                      {torneio.category}
                    </Badge>
                  </div>
                  <CardDescription>{torneio.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-medium">{torneio.date}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    <span>{torneio.location}</span>
                  </div>
                  <Button className="w-full" size="lg">
                    <Users className="mr-2 h-4 w-4" />
                    Inscrever-se
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

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
