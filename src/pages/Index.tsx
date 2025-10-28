import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TopThreeAthletes from "@/components/TopThreeAthletes";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TopThreeAthletes />
      
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Sobre o Ranking Beach Tennis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Plataforma oficial para acompanhar atletas de beach tennis, 
            registrar conquistas e acompanhar a evolução de cada jogador. 
            Suba de categoria ao atingir 500 pontos!
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
