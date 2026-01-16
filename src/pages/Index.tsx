import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AthleteRegistrationForm from "@/components/AthleteRegistrationForm";
import { Award, TrendingUp, Users, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { memo } from "react";

const Index = memo(() => {
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
      
      {/* Registration CTA Section - Prominent */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <span className="text-2xl">🎾</span>
            <span className="text-primary-foreground font-medium text-sm">Inscrições Abertas</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-primary-foreground">
            Quer participar dos torneios?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto text-lg">
            Cadastre-se agora na nossa lista de espera e comece sua jornada no beach tennis!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AthleteRegistrationForm />
          </div>
          
          <p className="text-primary-foreground/60 text-sm mt-6">
            ✓ Cadastro rápido e gratuito &nbsp; ✓ Aprovação em até 24h
          </p>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-muted/30 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 lg:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 lg:mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Por que Categoria Certa?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              A plataforma mais completa para gerenciar sua carreira no beach tennis
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 bg-card/50 backdrop-blur-sm"
              >
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
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
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 lg:mb-8">
              Sobre o Categoria Certa
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed mb-12 lg:mb-16 max-w-3xl mx-auto px-4">
              Plataforma oficial para acompanhar atletas de beach tennis, 
              registrar conquistas e acompanhar a evolução de cada jogador. 
              Sistema de categorias com <strong className="text-foreground">promoção automática baseada em pontos!</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
              {[
                { title: "Iniciante", description: "Sobe com 500 pts ativos", icon: "🎾" },
                { title: "Categoria D", description: "Sobe com 500 pts ativos", icon: "⭐" },
                { title: "Categoria C", description: "Categoria máxima", icon: "🏆" },
              ].map((category, index) => (
                <div
                  key={index}
                  className="p-8 rounded-2xl bg-gradient-to-br from-accent to-accent/50 border-2 border-border hover:shadow-lg transition-all hover:scale-105"
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
              💡 Suba de categoria ao atingir 500 pontos ativos! Pontos históricos são preservados separadamente.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
});

Index.displayName = "Index";

export default Index;
