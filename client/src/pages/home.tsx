import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Zap, RefreshCw, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { FilterControls } from "@/components/filter-controls";
import { NeighborhoodCard } from "@/components/neighborhood-card";
import { StatusSummary } from "@/components/status-summary";
import { EmptyState } from "@/components/empty-state";
import { ExportMenu } from "@/components/export-menu";
import { 
  NeighborhoodCardSkeleton, 
  StatusSummarySkeleton,
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
  
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: schedules, isLoading, isError, refetch, isFetching } = useQuery<OutageSchedule[]>({
    queryKey: ["/api/schedules"],
    refetchInterval: 300000,
  });

  const filteredSchedules = useMemo(() => {
    if (!schedules) return [];

    let filtered = [...schedules];

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
      const hour = parseInt(selectedHour, 10);
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

  const filterHour = selectedHour !== "all" ? parseInt(selectedHour, 10) : null;

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
              <Link href="/stats">
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="button-stats"
                  aria-label="Voir les statistiques"
                >
                  <BarChart2 className="h-5 w-5" />
                </Button>
              </Link>
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
            Heure actuelle: <span className="text-foreground">{currentHour.toString().padStart(2, '0')}:00</span>
          </div>
        </div>

        {isLoading ? (
          <StatusSummarySkeleton />
        ) : isError ? null : schedules ? (
          <StatusSummary schedules={schedules} currentHour={currentHour} />
        ) : null}

        {isLoading ? (
          <FilterControlsSkeleton />
        ) : (
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
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <NeighborhoodCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState type="loading-error" />
        ) : filteredSchedules.length === 0 ? (
          showFavoritesOnly && favorites.length === 0 ? (
            <EmptyState type="no-favorites" />
          ) : (
            <EmptyState type="no-results" onClearFilters={clearFilters} />
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredSchedules.map(schedule => (
              <div
                key={schedule.neighborhood.id}
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
            ))}
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          <p>
            Les horaires de délestage sont indicatifs et peuvent varier.
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> • </span>
            Données simulées pour démonstration.
          </p>
        </div>
      </main>
    </div>
  );
}
