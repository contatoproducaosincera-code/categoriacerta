import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, MessageCircle } from "lucide-react";
import BackButton from "@/components/BackButton";

const Torneios = () => {
  const { data: tournaments, isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <BackButton />
          </div>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Próximos Torneios
            </h1>
            <p className="text-muted-foreground text-lg">
              Fale com o organizador pelo WhatsApp para se inscrever
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando torneios...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {(tournaments || []).map((torneio) => (
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
                      <span className="font-medium">
                        {new Date(torneio.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      <span>{torneio.location}</span>
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => {
                        if (torneio.whatsapp) {
                          // Se já for um link completo, usa diretamente
                          if (torneio.whatsapp.startsWith('http')) {
                            window.open(torneio.whatsapp, '_blank');
                          } else {
                            // Se for apenas o número, cria o link
                            const phone = torneio.whatsapp.replace(/\D/g, '');
                            window.open(`https://wa.me/${phone}`, '_blank');
                          }
                        }
                      }}
                      disabled={!torneio.whatsapp}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {torneio.whatsapp ? 'Falar com Organizador' : 'WhatsApp não cadastrado'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

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
