import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { FilterControls } from "@/components/filter-controls";
import { NeighborhoodCard } from "@/components/neighborhood-card";
import { EmptyState } from "@/components/empty-state";
import { ExportMenu } from "@/components/export-menu";
import { 
  NeighborhoodCardSkeleton, 
  FilterControlsSkeleton 
} from "@/components/loading-skeleton";
import { useFavorites } from "@/hooks/use-favorites";
import type { OutageSchedule } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHour, setSelectedHour] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(15);
  
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setDisplayCount(15);
  }, [searchQuery, selectedHour, showFavoritesOnly]);

  const { data: schedules, isLoading, isError, refetch, isFetching } = useQuery<OutageSchedule[]>({
    queryKey: ["/api/schedules"],
    refetchInterval: 300000,
  });

  const filteredSchedules = useMemo(() => {
    if (!schedules) return [];

    // Étape 1: Regrouper les quartiers dupliqués (même nom + même arrondissement)
    // Normaliser pour gérer les différences de casse et d'espaces
    const normalizeKey = (name: string, district: string) => {
      return `${name.trim().toLowerCase().replace(/\s+/g, ' ')}_${district.trim().toLowerCase().replace(/\s+/g, ' ')}`;
    };
    
    const groupedSchedules = new Map<string, OutageSchedule>();
    
    for (const schedule of schedules) {
      const key = normalizeKey(schedule.neighborhood.name, schedule.neighborhood.district);
      
      if (groupedSchedules.has(key)) {
        // Fusionner les plages horaires avec le schedule existant
        const existing = groupedSchedules.get(key)!;
        const allOutages = [...existing.outages, ...schedule.outages];
        
        // Trier et fusionner les plages qui se chevauchent (si nécessaire)
        allOutages.sort((a, b) => a.startHour - b.startHour);
        
        // Fusionner les plages qui se chevauchent
        const mergedOutages: typeof allOutages = [];
        for (const outage of allOutages) {
          if (mergedOutages.length === 0) {
            mergedOutages.push(outage);
            continue;
          }
          
          const last = mergedOutages[mergedOutages.length - 1];
          
          // Vérifier si la plage actuelle chevauche avec la dernière plage fusionnée
          if (last.startHour < outage.endHour && last.endHour > outage.startHour) {
            // Fusionner : prendre le min des starts et le max des ends
            last.startHour = Math.min(last.startHour, outage.startHour);
            last.endHour = Math.max(last.endHour, outage.endHour);
            
            // Gérer la raison : concaténer si différentes
            if (outage.reason && outage.reason !== last.reason) {
              if (last.reason) {
                last.reason = `${last.reason}; ${outage.reason}`;
              } else {
                last.reason = outage.reason;
              }
            }
          } else {
            // Pas de chevauchement, ajouter comme nouvelle plage
            mergedOutages.push(outage);
          }
        }
        
        groupedSchedules.set(key, {
          neighborhood: existing.neighborhood, // Garder le premier quartier comme représentant
          outages: mergedOutages,
        });
      } else {
        groupedSchedules.set(key, schedule);
      }
    }
    
    let filtered = Array.from(groupedSchedules.values());

    if (showFavoritesOnly) {
      filtered = filtered.filter(schedule => 
        isFavorite(schedule.neighborhood.id)
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(schedule =>
        schedule.neighborhood.name.toLowerCase().includes(query) ||
        schedule.neighborhood.district.toLowerCase().includes(query)
      );
    }

    if (selectedHour !== "all") {
      const hour = parseFloat(selectedHour);
      filtered = filtered.filter(schedule =>
        schedule.outages.some(outage => 
          hour >= outage.startHour && hour < outage.endHour
        )
      );
    }

    filtered.sort((a, b) => {
      const aIsFavorite = isFavorite(a.neighborhood.id);
      const bIsFavorite = isFavorite(b.neighborhood.id);
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      return a.neighborhood.name.localeCompare(b.neighborhood.name);
    });

    return filtered;
  }, [schedules, searchQuery, selectedHour, showFavoritesOnly, isFavorite]);

  const activeFiltersCount = [
    searchQuery.trim() !== "",
    selectedHour !== "all",
    showFavoritesOnly,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedHour("all");
    setShowFavoritesOnly(false);
  };

  const filterHour = selectedHour !== "all" ? parseFloat(selectedHour) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-outage/10">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-outage" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight">
                  Délestage Tana
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Suivi des coupures d'électricité - Antananarivo
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ExportMenu 
                schedules={schedules || []} 
                disabled={isLoading || isError}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                data-testid="button-refresh"
                aria-label="Actualiser les données"
              >
                <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-active animate-pulse" />
            <span>
              Mise à jour: {new Date().toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          <div className="text-sm font-medium">
            Heure actuelle: <span className="text-foreground font-bold">{currentHour.toString().padStart(2, '0')}:00</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 min-h-[400px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-base font-medium text-foreground mb-1">Chargement des données...</p>
              <p className="text-sm text-muted-foreground">Veuillez patienter</p>
            </div>
          </div>
        ) : (
          <>
            <FilterControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedHour={selectedHour}
              onHourChange={setSelectedHour}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={clearFilters}
            />

            {isError ? (
              <EmptyState type="loading-error" />
            ) : filteredSchedules.length === 0 ? (
              showFavoritesOnly && favorites.length === 0 ? (
                <EmptyState type="no-favorites" />
              ) : (
                <EmptyState type="no-results" onClearFilters={clearFilters} />
              )
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {filteredSchedules.slice(0, displayCount).map(schedule => {
                    // Utiliser une clé unique basée sur nom + arrondissement pour éviter les doublons
                    const uniqueKey = `${schedule.neighborhood.name}_${schedule.neighborhood.district}`.toLowerCase().replace(/\s+/g, '_');
                    return (
                      <div
                        key={uniqueKey}
                        className={expandedCardId === schedule.neighborhood.id ? "lg:col-span-2 xl:col-span-3" : ""}
                      >
                        <NeighborhoodCard
                          neighborhood={schedule.neighborhood}
                          outages={schedule.outages}
                          isFavorite={isFavorite(schedule.neighborhood.id)}
                          onToggleFavorite={() => toggleFavorite(schedule.neighborhood.id)}
                          currentHour={currentHour}
                          filterHour={filterHour}
                          isExpanded={expandedCardId === schedule.neighborhood.id}
                          onToggleExpand={() => setExpandedCardId(expandedCardId === schedule.neighborhood.id ? null : schedule.neighborhood.id)}
                        />
                      </div>
                    );
                  })}
                </div>

                {displayCount < filteredSchedules.length && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setDisplayCount(displayCount + 15)}
                      data-testid="button-load-more"
                    >
                      Afficher plus
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          <p>
            Les horaires de délestage sont indicatifs et peuvent varier.
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> • </span>
            Données synchronisées depuis la base de données.
          </p>
        </div>
      </main>
    </div>
  );
}
