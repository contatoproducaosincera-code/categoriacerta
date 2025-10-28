import { Card } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";

const mockTopThree = [
  { id: 1, name: "João Silva", points: 850, category: "C", city: "Rio de Janeiro" },
  { id: 2, name: "Maria Santos", points: 780, category: "C", city: "São Paulo" },
  { id: 3, name: "Pedro Costa", points: 720, category: "D", city: "Florianópolis" },
];

const TopThreeAthletes = () => {
  return (
    <section className="py-16 bg-accent/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Top 3 do Ranking
          </h2>
          <p className="text-muted-foreground text-lg">
            Os melhores atletas do momento
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {mockTopThree.map((athlete, index) => (
            <Card
              key={athlete.id}
              className="p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
              style={{
                background: index === 0 
                  ? 'linear-gradient(145deg, hsl(45 90% 60%), hsl(45 80% 55%))'
                  : index === 1
                  ? 'linear-gradient(145deg, hsl(0 0% 85%), hsl(0 0% 75%))'
                  : 'linear-gradient(145deg, hsl(25 50% 55%), hsl(25 40% 45%))'
              }}
            >
              <div className="flex justify-center mb-4">
                {index === 0 ? (
                  <Trophy className="h-16 w-16 text-yellow-100" />
                ) : (
                  <Medal className="h-16 w-16 text-white" />
                )}
              </div>
              <div className="text-6xl font-bold text-white mb-2">
                {index + 1}º
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {athlete.name}
              </h3>
              <p className="text-white/90 mb-1">{athlete.city}</p>
              <p className="text-white/90 mb-3">Categoria {athlete.category}</p>
              <div className="text-2xl font-bold text-white">
                {athlete.points} pontos
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopThreeAthletes;
