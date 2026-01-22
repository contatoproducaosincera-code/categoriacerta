import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";

interface Athlete {
  id: string;
  name: string;
  city: string;
  category: string;
  points: number;
}

interface RankingDesktopTableProps {
  athletes: Athlete[];
}

export const RankingDesktopTable = ({ athletes }: RankingDesktopTableProps) => {
  const getTrophyColor = (index: number) => {
    if (index === 0) return 'text-yellow-500';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-amber-600';
    return '';
  };

  const getCategoryVariant = (category: string) => {
    if (category === "C") return "default";
    if (category === "D") return "secondary";
    return "outline";
  };

  return (
    <div className="max-w-4xl mx-auto bg-card rounded-lg border shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5">
              <TableHead className="w-[80px] text-center font-bold whitespace-nowrap">Posição</TableHead>
              <TableHead className="font-bold min-w-[150px]">Nome</TableHead>
              <TableHead className="font-bold min-w-[120px]">Cidade</TableHead>
              <TableHead className="font-bold w-[100px]">Categoria</TableHead>
              <TableHead className="text-right font-bold w-[80px]">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {athletes.map((athlete, index) => (
              <TableRow 
                key={athlete.id}
                className="hover:bg-accent/50 transition-colors"
              >
                <TableCell className="text-center font-bold">
                  {index < 3 ? (
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className={`h-4 w-4 ${getTrophyColor(index)}`} />
                      {index + 1}º
                    </div>
                  ) : (
                    `${index + 1}º`
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <AthleteAchievementsDialog
                    athleteId={athlete.id}
                    athleteName={athlete.name}
                    athletePoints={athlete.points}
                    athleteCategory={athlete.category}
                  >
                    <span className="cursor-pointer hover:text-primary transition-colors hover:underline">
                      {athlete.name}
                    </span>
                  </AthleteAchievementsDialog>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {athlete.city}
                </TableCell>
                <TableCell>
                  <Badge variant={getCategoryVariant(athlete.category)}>
                    {athlete.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {athlete.points}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
