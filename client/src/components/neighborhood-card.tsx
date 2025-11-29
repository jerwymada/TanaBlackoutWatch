import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteStar } from "./favorite-star";
import { Timeline } from "./timeline";
import { MapPin, Zap, ZapOff, Maximize2, Minimize2 } from "lucide-react";
import type { Neighborhood, Outage } from "@shared/schema";
import { cn } from "@/lib/utils";

interface NeighborhoodCardProps {
  neighborhood: Neighborhood;
  outages: Outage[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  currentHour: number;
  filterHour?: number | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function NeighborhoodCard({
  neighborhood,
  outages,
  isFavorite,
  onToggleFavorite,
  currentHour,
  filterHour,
  isExpanded = false,
  onToggleExpand,
}: NeighborhoodCardProps) {
  const hasCurrentOutage = outages.some(
    outage => currentHour >= outage.startHour && currentHour < outage.endHour
  );

  const nextOutage = outages.find(outage => outage.startHour > currentHour);
  const totalOutageHours = outages.reduce(
    (sum, outage) => sum + (outage.endHour - outage.startHour), 
    0
  );

  return (
    <Card 
      className={cn(
        "hover-elevate transition-all duration-200 select-none group",
        isFavorite && "ring-1 ring-favorite/30"
      )}
      data-testid={`card-neighborhood-${neighborhood.id}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3 space-y-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg leading-tight truncate" data-testid={`text-neighborhood-name-${neighborhood.id}`}>
              {neighborhood.name}
            </h3>
            <Badge 
              variant={hasCurrentOutage ? "secondary" : "secondary"}
              className={cn(
                "shrink-0",
                hasCurrentOutage && "bg-[hsl(0,100%,92%)] text-[hsl(6,78%,57%)] hover:bg-[hsl(0,100%,88%)] dark:bg-[hsl(0,100%,92%)] dark:text-[hsl(6,78%,57%)]",
                !hasCurrentOutage && "bg-active/20 text-active hover:bg-active/30 dark:bg-active/30"
              )}
              data-testid={`badge-status-${neighborhood.id}`}
            >
              {hasCurrentOutage ? (
                <>
                  <ZapOff className="h-3 w-3 mr-1" />
                  Coupure
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  Actif
                </>
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{neighborhood.district}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              data-testid={`button-expand-${neighborhood.id}`}
              aria-label={isExpanded ? "Réduire" : "Agrandir"}
              className="hidden group-hover:flex"
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          <FavoriteStar
            isFavorite={isFavorite}
            onToggle={onToggleFavorite}
            neighborhoodName={neighborhood.name}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-3">
          <Timeline 
            outages={outages} 
            neighborhoodName={neighborhood.name}
            currentHour={currentHour}
            filterHour={filterHour}
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-outage" />
            <span>Prévue aujourd'hui : {totalOutageHours}h</span>
          </div>
          {nextOutage && !hasCurrentOutage && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-attention" />
              <span>Prochaine: {(() => {
                const h = Math.floor(nextOutage.startHour);
                const m = nextOutage.startHour % 1 !== 0 ? '30' : '00';
                return `${h.toString().padStart(2, '0')}h${m}`;
              })()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
