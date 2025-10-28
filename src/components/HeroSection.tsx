import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, Users, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Animated floating elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-border mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Sistema de Ranking Oficial</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-black mb-6 animate-fade-in-up leading-tight">
            Acompanhe seu{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              desempenho
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-10 text-muted-foreground animate-fade-in-up font-light leading-relaxed max-w-2xl mx-auto" style={{ animationDelay: "0.1s" }}>
            Conquiste seu lugar no ranking e alcance novos patamares no beach tennis
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Button 
              size="lg" 
              className="text-lg font-semibold shadow-medium hover:shadow-strong transition-all hover:scale-105 group"
              asChild
            >
              <Link to="/ranking">
                <Trophy className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                Ver Ranking
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg font-semibold shadow-soft hover:shadow-medium transition-all hover:scale-105 group"
              asChild
            >
              <Link to="/atletas">
                <Users className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Ver Atletas
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
