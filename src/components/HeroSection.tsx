import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, Users, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-beach-tennis.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background with parallax effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
        <div className="absolute inset-0 bg-[var(--gradient-glow)] animate-pulse" />
      </div>

      {/* Animated floating elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      
      <div className="container relative z-10 px-4 py-24 text-white">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium">Sistema de Ranking Oficial</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-display font-black mb-6 animate-fade-in-up leading-tight">
            Acompanhe seu{" "}
            <span className="bg-gradient-to-r from-secondary via-secondary/80 to-secondary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
              desempenho
            </span>
            <br />
            e suba de categoria
          </h1>
          
          <p className="text-xl md:text-2xl mb-10 text-white/90 animate-fade-in-up font-light leading-relaxed" style={{ animationDelay: "0.1s" }}>
            Mostre seu talento nas quadras. Conquiste seu lugar no ranking e alcance novos patamares no beach tennis.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Button 
              size="lg" 
              className="text-lg font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-strong hover:shadow-glow transition-all hover:scale-105 group"
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
              className="text-lg font-semibold bg-white/10 border-2 border-white/30 hover:bg-white hover:text-primary backdrop-blur-sm shadow-medium hover:shadow-strong transition-all hover:scale-105 group"
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

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
