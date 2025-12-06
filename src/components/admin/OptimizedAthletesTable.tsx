import { useState, useMemo, useCallback, memo, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Award, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { MultiSelect } from "@/components/ui/multi-select";
import { VirtualizedAthleteRow } from "./VirtualizedAthleteRow";

// Lazy load dialogs for better initial performance
const AthleteAchievementsDialog = lazy(() => import("@/components/AthleteAchievementsDialog"));
const ManageAchievementsDialog = lazy(() => import("@/components/admin/ManageAchievementsDialog"));

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

interface OptimizedAthletesTableProps {
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

const ITEMS_PER_PAGE = 50;

// Memoized filter input component
const FilterInput = memo(({ 
  value, 
  onChange, 
  onClear 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  onClear: () => void;
}) => (
  <div className="relative flex-1">
    <Input
      placeholder="Buscar por nome, cidade ou categoria..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pr-10"
    />
    {value && (
      <button
        onClick={onClear}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    )}
  </div>
));

FilterInput.displayName = "FilterInput";

// Memoized sort icon component
const SortIcon = memo(({ field, sortField, sortOrder }: { field: SortField; sortField: SortField; sortOrder: SortOrder }) => {
  if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  return sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
});

SortIcon.displayName = "SortIcon";

function OptimizedAthletesTableComponent({
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
}: OptimizedAthletesTableProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);
  
  // Dialog states for lazy loading
  const [viewAchievementsAthlete, setViewAchievementsAthlete] = useState<Athlete | null>(null);
  const [manageAchievementsAthlete, setManageAchievementsAthlete] = useState<Athlete | null>(null);
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fuzzy search function - memoized
  const fuzzyMatch = useCallback((text: string, search: string): boolean => {
    const textLower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const searchLower = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return textLower.includes(searchLower);
  }, []);

  // Sorting handler
  const handleSort = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) {
        setSortOrder(order => order === "asc" ? "desc" : "asc");
        return prev;
      }
      setSortOrder("asc");
      return field;
    });
  }, []);

  // Unique cities for filter
  const cities = useMemo(() => 
    [...new Set(athletes.map(a => a.city))].sort(),
    [athletes]
  );

  // Detect duplicate names
  const duplicateNames = useMemo(() => {
    const nameCount = new Map<string, number>();
    athletes.forEach(athlete => {
      const count = nameCount.get(athlete.name) || 0;
      nameCount.set(athlete.name, count + 1);
    });
    return new Set(
      Array.from(nameCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([name]) => name)
    );
  }, [athletes]);

  // Filter and group athletes by category
  const groupedAthletes = useMemo(() => {
    const filtered = athletes.filter(athlete => {
      const matchesSearch = fuzzyMatch(athlete.name, debouncedSearch) || 
                           fuzzyMatch(athlete.city, debouncedSearch) ||
                           fuzzyMatch(athlete.category, debouncedSearch);
      const matchesGender = adminGenderFilter === "all" || athlete.gender === adminGenderFilter;
      const matchesCity = adminCityFilter.length === 0 || adminCityFilter.includes(athlete.city);
      const matchesDuplicates = !showDuplicatesOnly || duplicateNames.has(athlete.name);
      return matchesSearch && matchesGender && matchesCity && matchesDuplicates;
    });

    // Sort
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

    // Group by category
    const groups: Record<string, Athlete[]> = {
      "C": [],
      "D": [],
      "Iniciante": []
    };

    sorted.forEach(athlete => {
      groups[athlete.category].push(athlete);
    });

    return groups;
  }, [athletes, debouncedSearch, adminGenderFilter, adminCityFilter, showDuplicatesOnly, duplicateNames, sortField, sortOrder, fuzzyMatch]);

  const totalFiltered = Object.values(groupedAthletes).flat().length;
  const hasActiveFilters = adminGenderFilter !== "all" || adminCityFilter.length > 0 || searchTerm !== "" || showDuplicatesOnly;

  // Load more handler for infinite scroll
  const loadMore = useCallback(() => {
    setVisibleItems(prev => prev + ITEMS_PER_PAGE);
  }, []);

  // Reset visible items when filters change
  useMemo(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, [debouncedSearch, adminGenderFilter, adminCityFilter, showDuplicatesOnly]);

  // Memoized callbacks
  const handleClearFilters = useCallback(() => {
    onClearFilters();
    setShowDuplicatesOnly(false);
  }, [onClearFilters]);

  const handleSearchChange = useCallback((value: string) => {
    onSearchChange(value);
  }, [onSearchChange]);

  const handleSearchClear = useCallback(() => {
    onSearchChange("");
  }, [onSearchChange]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <FilterInput 
          value={searchTerm}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
        />
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
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-duplicates"
            checked={showDuplicatesOnly}
            onCheckedChange={(checked) => setShowDuplicatesOnly(checked === true)}
          />
          <Label htmlFor="show-duplicates" className="text-sm cursor-pointer">
            Apenas duplicados ({duplicateNames.size} nomes)
          </Label>
        </div>
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={handleClearFilters}
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Results counter */}
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

      {/* Grouped tables by category */}
      <div className="space-y-6">
        {(["C", "D", "Iniciante"] as const).map(category => {
          const categoryAthletes = groupedAthletes[category];
          if (categoryAthletes.length === 0) return null;

          // Limit visible items per category for performance
          const visibleCategoryAthletes = categoryAthletes.slice(0, visibleItems);
          const hasMore = categoryAthletes.length > visibleCategoryAthletes.length;

          return (
            <div key={category} className="space-y-2">
              <div className="bg-muted/50 border-b border-l-4 border-primary px-4 py-3 rounded-t mb-2">
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
                  <TableHeader className="sticky top-0 bg-background z-30 shadow-sm border-b">
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
                          <SortIcon field="name" sortField={sortField} sortOrder={sortOrder} />
                        </button>
                      </TableHead>
                      <TableHead>Gênero</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("points")}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          Pontos
                          <SortIcon field="points" sortField={sortField} sortOrder={sortOrder} />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("city")}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          Cidade
                          <SortIcon field="city" sortField={sortField} sortOrder={sortOrder} />
                        </button>
                      </TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleCategoryAthletes.map((athlete) => (
                      <VirtualizedAthleteRow
                        key={athlete.id}
                        athlete={athlete}
                        isSelected={selectedAthletes.has(athlete.id)}
                        onToggleSelection={onToggleAthleteSelection}
                        onOpenAddPoints={onOpenAddPoints}
                        onOpenEditAthlete={onOpenEditAthlete}
                        onOpenManageAchievements={setManageAchievementsAthlete}
                        onOpenViewAchievements={setViewAchievementsAthlete}
                        onDeleteAthlete={onDeleteAthlete}
                      />
                    ))}
                  </TableBody>
                </Table>
                
                {hasMore && (
                  <div className="p-4 text-center border-t">
                    <Button variant="outline" onClick={loadMore}>
                      Carregar mais ({categoryAthletes.length - visibleCategoryAthletes.length} restantes)
                    </Button>
                  </div>
                )}
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
            <Button variant="link" onClick={handleClearFilters} className="mt-2">
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {/* Lazy loaded dialogs */}
      <Suspense fallback={<div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
        {viewAchievementsAthlete && (
          <AthleteAchievementsDialog
            athleteId={viewAchievementsAthlete.id}
            athleteName={viewAchievementsAthlete.name}
            athletePoints={viewAchievementsAthlete.points}
            athleteCategory={viewAchievementsAthlete.category}
            open={true}
            onOpenChange={(open) => !open && setViewAchievementsAthlete(null)}
          />
        )}
        
        {manageAchievementsAthlete && (
          <ManageAchievementsDialog 
            athlete={manageAchievementsAthlete}
            open={true}
            onOpenChange={(open) => !open && setManageAchievementsAthlete(null)}
          />
        )}
      </Suspense>
    </div>
  );
}

export const OptimizedAthletesTable = memo(OptimizedAthletesTableComponent);
export default OptimizedAthletesTable;
