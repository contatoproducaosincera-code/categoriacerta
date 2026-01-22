import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";

interface RankingFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  genderFilter: string;
  onGenderChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  selectedCities: string[];
  onCitiesChange: (value: string[]) => void;
  availableCities: string[];
}

export const RankingFilters = ({
  searchTerm,
  onSearchChange,
  genderFilter,
  onGenderChange,
  categoryFilter,
  onCategoryChange,
  selectedCities,
  onCitiesChange,
  availableCities,
}: RankingFiltersProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-2">
      {/* Mobile: Stack vertical, full width */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Search - full width */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar atleta..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 text-base w-full"
          />
        </div>
        
        {/* Filters - 2x2 grid for mobile */}
        <div className="grid grid-cols-2 gap-2">
          <Select value={genderFilter} onValueChange={onGenderChange}>
            <SelectTrigger className="h-11 text-sm">
              <SelectValue placeholder="Gênero" />
            </SelectTrigger>
            <SelectContent className="bg-background z-[100]">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Masculino">🧔 Masc</SelectItem>
              <SelectItem value="Feminino">👩 Fem</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-11 text-sm">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-background z-[100]">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="C">Cat. C</SelectItem>
              <SelectItem value="D">Cat. D</SelectItem>
              <SelectItem value="Iniciante">Iniciante</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Cities - full width */}
        <MultiSelect
          options={availableCities}
          selected={selectedCities}
          onChange={onCitiesChange}
          placeholder="Filtrar por cidade"
          className="w-full h-11"
        />
      </div>

      {/* Desktop: Flex row */}
      <div className="hidden md:flex flex-row gap-3 justify-center items-center flex-wrap">
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Buscar atleta..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 text-base shadow-sm"
          />
        </div>
        
        <Select value={genderFilter} onValueChange={onGenderChange}>
          <SelectTrigger className="w-[170px] h-12">
            <SelectValue placeholder="Gênero" />
          </SelectTrigger>
          <SelectContent className="bg-background z-[100]">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Masculino">🧔 Masculino</SelectItem>
            <SelectItem value="Feminino">👩 Feminino</SelectItem>
          </SelectContent>
        </Select>
        
        <MultiSelect
          options={availableCities}
          selected={selectedCities}
          onChange={onCitiesChange}
          placeholder="Cidades"
          className="w-[200px] h-12"
        />
        
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[170px] h-12">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-background z-[100]">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="C">Categoria C</SelectItem>
            <SelectItem value="D">Categoria D</SelectItem>
            <SelectItem value="Iniciante">Iniciante</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
