import { useState, ReactNode } from "react";
import { Filter, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CollapsibleFiltersProps {
  children: ReactNode;
  activeFiltersCount?: number;
  onClearFilters?: () => void;
  className?: string;
}

export const CollapsibleFilters = ({
  children,
  activeFiltersCount = 0,
  onClearFilters,
  className = "",
}: CollapsibleFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile: Collapsible */}
      <div className="md:hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 justify-between h-10"
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrar
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            {activeFiltersCount > 0 && onClearFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearFilters}
                className="h-10 px-3"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <CollapsibleContent className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {children}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Desktop: Always visible */}
      <div className="hidden md:flex flex-wrap gap-3 justify-center items-center">
        {children}
        {activeFiltersCount > 0 && onClearFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
};
