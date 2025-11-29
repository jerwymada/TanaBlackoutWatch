import { Search, Clock, Filter, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FilterControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedHour: string;
  onHourChange: (value: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

export function FilterControls({
  searchQuery,
  onSearchChange,
  selectedHour,
  onHourChange,
  showFavoritesOnly,
  onToggleFavorites,
  activeFiltersCount,
  onClearFilters,
}: FilterControlsProps) {
  // Create slots for hours with 30-minute intervals
  const timeSlots = Array.from({ length: 48 }, (_, i) => i * 0.5);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Rechercher un quartier..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11"
            data-testid="input-search-neighborhood"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedHour} onValueChange={onHourChange}>
            <SelectTrigger 
              className="w-full sm:w-[140px] h-11"
              data-testid="select-hour-filter"
            >
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Heure" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les heures</SelectItem>
              {timeSlots.map(slot => {
                const hour = Math.floor(slot);
                const minute = slot % 1 !== 0 ? '30' : '00';
                return (
                  <SelectItem key={slot} value={slot.toString()}>
                    {hour.toString().padStart(2, '0')}:{minute}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="default"
            onClick={onToggleFavorites}
            className={cn(
              "h-11 px-4 shrink-0",
              showFavoritesOnly && "bg-favorite text-foreground hover:bg-favorite/90"
            )}
            data-testid="button-toggle-favorites"
          >
            <Star className={cn(
              "h-4 w-4",
              showFavoritesOnly ? "fill-current" : ""
            )} />
            <span className="hidden sm:inline ml-2">Favoris</span>
          </Button>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filtres actifs:</span>
          </div>
          
          {searchQuery && (
            <Badge variant="secondary" className="gap-1.5">
              Recherche: "{searchQuery}"
              <button 
                onClick={() => onSearchChange('')}
                className="hover:opacity-70"
                aria-label="Supprimer le filtre de recherche"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedHour !== "all" && (() => {
            const slot = parseFloat(selectedHour);
            const hour = Math.floor(slot);
            const minute = slot % 1 !== 0 ? '30' : '00';
            return (
              <Badge variant="secondary" className="gap-1.5">
                Heure: {hour.toString().padStart(2, '0')}:{minute}
                <button 
                  onClick={() => onHourChange('all')}
                  className="hover:opacity-70"
                  aria-label="Supprimer le filtre d'heure"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })()}
          
          {showFavoritesOnly && (
            <Badge variant="secondary" className="gap-1.5 bg-favorite/20 text-foreground">
              <Star className="h-3 w-3 fill-favorite text-favorite" />
              Favoris uniquement
              <button 
                onClick={onToggleFavorites}
                className="hover:opacity-70"
                aria-label="Supprimer le filtre favoris"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
            data-testid="button-clear-filters"
          >
            Effacer tout
          </Button>
        </div>
      )}
    </div>
  );
}
