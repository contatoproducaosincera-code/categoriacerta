import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, Users, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[650px] lg:min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Animated floating elements - decorative only */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" aria-hidden="true" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" aria-hidden="true" />
      
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-8 animate-fade-in">
            <div className="relative" aria-label="Troféu - Ícone do Beach Tennis">
              <Trophy className="h-16 w-16 md:h-20 md:w-20 text-primary" aria-hidden="true" />
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" aria-hidden="true" />
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black mb-6 lg:mb-8 animate-fade-in-up leading-tight">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Categoria Certa
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-10 lg:mb-14 text-muted-foreground animate-fade-in-up font-light leading-relaxed max-w-3xl mx-auto px-4" style={{ animationDelay: "0.1s" }}>
            Conquiste seu lugar no ranking e alcance novos patamares no beach tennis
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center animate-fade-in-up max-w-lg mx-auto px-4" style={{ animationDelay: "0.2s" }}>
            <Button 
              size="lg" 
              className="w-full sm:w-auto text-lg md:text-xl font-bold px-8 md:px-10 py-6 md:py-7 shadow-strong hover:shadow-[0_20px_60px_-8px_hsl(200_98%_39%/0.4)] transition-all hover:scale-105 group rounded-xl"
              asChild
            >
              <Link to="/ranking" className="flex items-center justify-center gap-3">
                <Trophy className="h-6 w-6 group-hover:rotate-12 transition-transform" aria-hidden="true" />
                <span>Ver Ranking</span>
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto text-lg md:text-xl font-bold px-8 md:px-10 py-6 md:py-7 shadow-medium hover:shadow-strong hover:bg-primary/5 transition-all hover:scale-105 group border-2 rounded-xl"
              asChild
            >
              <Link to="/atletas" className="flex items-center justify-center gap-3">
                <Users className="h-6 w-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span>Ver Atletas</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
