import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Award, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";
import { useDebounce } from "@/hooks/useDebounce";
import { MultiSelect } from "@/components/ui/multi-select";

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

interface AthletesTableProps {
  athletes: Athlete[];
  searchTerm: string;
  adminGenderFilter: string;
  adminCityFilter: string[];
  selectedAthletes: Set<string>;
  onSearchChange: (value: string) => void;
  onGenderFilterChange: (value: string) => void;
  onCityFilterChange: (value: string[]) => void;
  onToggleAthleteSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onClearFilters: () => void;
  onOpenAddPoints: (athlete: Athlete) => void;
  onOpenEditAthlete: (athlete: Athlete) => void;
  onDeleteAthlete: (id: string) => void;
}

type SortField = "name" | "points" | "city";
type SortOrder = "asc" | "desc";

export default function AthletesTable({
  athletes,
  searchTerm,
  adminGenderFilter,
  adminCityFilter,
  selectedAthletes,
  onSearchChange,
  onGenderFilterChange,
  onCityFilterChange,
  onToggleAthleteSelection,
  onToggleSelectAll,
  onClearFilters,
  onOpenAddPoints,
  onOpenEditAthlete,
  onDeleteAthlete,
}: AthletesTableProps) {
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fuzzy search function
  const fuzzyMatch = (text: string, search: string): boolean => {
    const textLower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const searchLower = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return textLower.includes(searchLower);
  };

  // Ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Cidades únicas para o filtro
  const cities = useMemo(() => 
    [...new Set(athletes.map(a => a.city))].sort(),
    [athletes]
  );

  // Filtrar e agrupar atletas por categoria
  const groupedAthletes = useMemo(() => {
    const filtered = athletes.filter(athlete => {
      const matchesSearch = fuzzyMatch(athlete.name, debouncedSearch) || 
                           fuzzyMatch(athlete.city, debouncedSearch) ||
                           fuzzyMatch(athlete.category, debouncedSearch);
      const matchesGender = adminGenderFilter === "all" || athlete.gender === adminGenderFilter;
      const matchesCity = adminCityFilter.length === 0 || adminCityFilter.includes(athlete.city);
      return matchesSearch && matchesGender && matchesCity;
    });

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name, 'pt-BR');
          break;
        case "points":
          comparison = a.points - b.points;
          break;
        case "city":
          comparison = a.city.localeCompare(b.city, 'pt-BR');
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    // Agrupar por categoria
    const groups: Record<string, Athlete[]> = {
      "C": [],
      "D": [],
      "Iniciante": []
    };

    sorted.forEach(athlete => {
      groups[athlete.category].push(athlete);
    });

    return groups;
  }, [athletes, debouncedSearch, adminGenderFilter, adminCityFilter, sortField, sortOrder]);

  const totalFiltered = Object.values(groupedAthletes).flat().length;
  const hasActiveFilters = adminGenderFilter !== "all" || adminCityFilter.length > 0 || searchTerm !== "";

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar por nome, cidade ou categoria..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
        <Select value={adminGenderFilter} onValueChange={onGenderFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Gênero" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">Todos os Gêneros</SelectItem>
            <SelectItem value="Masculino">🧔 Masculino</SelectItem>
            <SelectItem value="Feminino">👩 Feminino</SelectItem>
          </SelectContent>
        </Select>
        <MultiSelect
          options={cities}
          selected={adminCityFilter}
          onChange={onCityFilterChange}
          placeholder="Todas as Cidades"
          className="w-full sm:w-[200px]"
        />
        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {totalFiltered} atleta{totalFiltered !== 1 ? "s" : ""} encontrado{totalFiltered !== 1 ? "s" : ""}
        </span>
        {selectedAthletes.size > 0 && (
          <span className="font-medium text-primary">
            {selectedAthletes.size} selecionado{selectedAthletes.size !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Tabelas agrupadas por categoria */}
      <div className="space-y-6">
        {(["C", "D", "Iniciante"] as const).map(category => {
          const categoryAthletes = groupedAthletes[category];
          if (categoryAthletes.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-l-4 border-primary px-4 py-3 rounded-t mb-2 shadow-sm">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Categoria {category === "Iniciante" ? "Iniciante" : category}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({categoryAthletes.length} atleta{categoryAthletes.length !== 1 ? "s" : ""})
                  </span>
                </h3>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="sticky top-[72px] bg-background z-[15] shadow-sm border-b">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={categoryAthletes.every(a => selectedAthletes.has(a.id))}
                          onCheckedChange={() => {
                            const allSelected = categoryAthletes.every(a => selectedAthletes.has(a.id));
                            categoryAthletes.forEach(athlete => {
                              if (allSelected && selectedAthletes.has(athlete.id)) {
                                onToggleAthleteSelection(athlete.id);
                              } else if (!allSelected && !selectedAthletes.has(athlete.id)) {
                                onToggleAthleteSelection(athlete.id);
                              }
                            });
                          }}
                        />
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("name")}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          Nome
                          <SortIcon field="name" />
                        </button>
                      </TableHead>
                      <TableHead>Gênero</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("points")}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          Pontos
                          <SortIcon field="points" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("city")}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          Cidade
                          <SortIcon field="city" />
                        </button>
                      </TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryAthletes.map((athlete) => (
                      <TableRow 
                        key={athlete.id}
                        className={selectedAthletes.has(athlete.id) ? "bg-primary/5" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedAthletes.has(athlete.id)}
                            onCheckedChange={() => onToggleAthleteSelection(athlete.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <AthleteAchievementsDialog
                            athleteId={athlete.id}
                            athleteName={athlete.name}
                            athletePoints={athlete.points}
                            athleteCategory={athlete.category}
                          >
                            <button className="hover:text-primary transition-colors hover:underline text-left">
                              {athlete.name}
                            </button>
                          </AthleteAchievementsDialog>
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
      </div>

      {totalFiltered === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum atleta encontrado com os filtros aplicados.
          </p>
          {hasActiveFilters && (
            <Button variant="link" onClick={onClearFilters} className="mt-2">
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
