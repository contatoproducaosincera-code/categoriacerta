import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, Users } from "lucide-react";
import heroImage from "@/assets/hero-beach-tennis.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
      </div>
      
      <div className="container relative z-10 px-4 py-20 text-white">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Acompanhe seu desempenho e suba de categoria
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Mostre seu talento nas quadras. Conquiste seu lugar no ranking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg font-semibold"
              asChild
            >
              <Link to="/ranking">
                <Trophy className="mr-2 h-5 w-5" />
                Ver Ranking
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg font-semibold bg-white/10 border-white hover:bg-white hover:text-primary"
              asChild
            >
              <Link to="/atletas">
                <Users className="mr-2 h-5 w-5" />
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
