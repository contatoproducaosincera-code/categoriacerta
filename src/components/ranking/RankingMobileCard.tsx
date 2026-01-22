import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";

interface Athlete {
  id: string;
  name: string;
  city: string;
  category: string;
  points: number;
}

interface RankingMobileCardProps {
  athlete: Athlete;
  position: number;
}

export const RankingMobileCard = ({ athlete, position }: RankingMobileCardProps) => {
  const isTop3 = position < 3;
  
  const getTrophyColor = () => {
    if (position === 0) return 'text-yellow-500';
    if (position === 1) return 'text-gray-400';
    if (position === 2) return 'text-amber-600';
    return '';
  };

  const getCategoryVariant = () => {
    if (athlete.category === "C") return "default";
    if (athlete.category === "D") return "secondary";
    return "outline";
  };

  return (
    <AthleteAchievementsDialog
      athleteId={athlete.id}
      athleteName={athlete.name}
      athletePoints={athlete.points}
      athleteCategory={athlete.category}
    >
      <div className="bg-card rounded-xl border shadow-sm p-4 cursor-pointer hover:bg-accent/50 active:bg-accent/70 transition-all duration-200 w-full">
        {/* Main row: Position + Info + Points */}
        <div className="flex items-center gap-3 w-full">
          {/* Position indicator */}
          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            {isTop3 ? (
              <div className="flex flex-col items-center">
                <Trophy className={`h-5 w-5 ${getTrophyColor()}`} />
                <span className="text-xs font-bold mt-0.5">{position + 1}º</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-muted-foreground">{position + 1}º</span>
            )}
          </div>
          
          {/* Athlete info - takes remaining space */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="font-semibold text-foreground text-base truncate leading-tight">
              {athlete.name}
            </p>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              📍 {athlete.city}
            </p>
          </div>
          
          {/* Category + Points - right aligned */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <Badge variant={getCategoryVariant()} className="text-xs px-2 py-0.5">
              {athlete.category}
            </Badge>
            <p className="text-xl font-bold text-primary leading-none">
              {athlete.points}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">pts</span>
            </p>
          </div>
        </div>
      </div>
    </AthleteAchievementsDialog>
  );
};
