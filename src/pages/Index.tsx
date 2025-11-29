import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import { Award, TrendingUp, Users, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "Sistema de Pontos",
      description: "Ganhe pontos em cada torneio e acompanhe sua evolução",
    },
    {
      icon: Award,
      title: "Categorias Automáticas",
      description: "Suba automaticamente ao atingir marcos de pontuação",
    },
    {
      icon: Users,
      title: "Ranking em Tempo Real",
      description: "Veja sua posição entre os melhores atletas",
    },
    {
      icon: Zap,
      title: "Notificações Instantâneas",
      description: "Receba alertas quando conquistar novas categorias",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      
      {/* Features Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-glow)] opacity-50" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Por que Categoria Certa?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A plataforma mais completa para gerenciar sua carreira no beach tennis
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-strong transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 bg-card/50 backdrop-blur-sm animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-medium">
                    <feature.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Sobre o Categoria Certa
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Plataforma oficial para acompanhar atletas de beach tennis, 
              registrar conquistas e acompanhar a evolução de cada jogador. 
              Sistema simples de categorias: a cada 500 pontos você sobe uma categoria!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
              {[
                { title: "Iniciante", description: "Categoria inicial", icon: "🎾" },
                { title: "Categoria D", description: "500 pontos", icon: "⭐" },
                { title: "Categoria C", description: "1000 pontos", icon: "🏆" },
              ].map((category, index) => (
                <div
                  key={index}
                  className="p-8 rounded-2xl bg-gradient-to-br from-accent to-accent/50 border-2 border-border shadow-soft hover:shadow-strong transition-all hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-5xl mb-3">
                    {category.icon}
                  </div>
                  <div className="text-2xl font-display font-bold mb-2">
                    {category.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {category.description}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-8">
              💡 A cada 500 pontos conquistados, você avança automaticamente para a próxima categoria!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
