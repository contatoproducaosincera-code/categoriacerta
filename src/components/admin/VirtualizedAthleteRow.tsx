import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, History } from "lucide-react";

interface Athlete {
  id: string;
  name: string;
  email: string | null;
  city: string;
  category: "C" | "D" | "Iniciante";
  gender: "Masculino" | "Feminino";
  points: number;
  instagram: string | null;
}

interface VirtualizedAthleteRowProps {
  athlete: Athlete;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onOpenAddPoints: (athlete: Athlete) => void;
  onOpenEditAthlete: (athlete: Athlete) => void;
  onOpenManageAchievements: (athlete: Athlete) => void;
  onOpenViewAchievements: (athlete: Athlete) => void;
  onDeleteAthlete: (id: string) => void;
}

function VirtualizedAthleteRowComponent({
  athlete,
  isSelected,
  onToggleSelection,
  onOpenAddPoints,
  onOpenEditAthlete,
  onOpenManageAchievements,
  onOpenViewAchievements,
  onDeleteAthlete,
}: VirtualizedAthleteRowProps) {
  return (
    <TableRow className={isSelected ? "bg-primary/5" : ""}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(athlete.id)}
        />
      </TableCell>
      <TableCell className="font-medium">
        <button 
          onClick={() => onOpenViewAchievements(athlete)}
          className="hover:text-primary transition-colors hover:underline text-left"
        >
          {athlete.name}
        </button>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {athlete.gender === "Feminino" ? "👩" : "🧔"} {athlete.gender}
        </Badge>
      </TableCell>
      <TableCell className="font-bold text-primary">{athlete.points}</TableCell>
      <TableCell>{athlete.city}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button 
            size="sm"
            onClick={() => onOpenAddPoints(athlete)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-1 h-3 w-3" />
            Conquista
          </Button>
          <Button 
            size="sm" 
            variant="secondary"
            title="Gerenciar conquistas"
            onClick={() => onOpenManageAchievements(athlete)}
          >
            <History className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onOpenEditAthlete(athlete)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => {
              if (confirm(`Tem certeza que deseja excluir ${athlete.name}?`)) {
                onDeleteAthlete(athlete.id);
              }
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export const VirtualizedAthleteRow = memo(VirtualizedAthleteRowComponent, (prev, next) => {
  return (
    prev.athlete.id === next.athlete.id &&
    prev.athlete.points === next.athlete.points &&
    prev.athlete.name === next.athlete.name &&
    prev.athlete.city === next.athlete.city &&
    prev.athlete.category === next.athlete.category &&
    prev.athlete.gender === next.athlete.gender &&
    prev.isSelected === next.isSelected
  );
});
