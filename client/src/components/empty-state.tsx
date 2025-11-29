import { Search, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-results" | "no-favorites" | "loading-error";
  onClearFilters?: () => void;
}

export function EmptyState({ type, onClearFilters }: EmptyStateProps) {
  if (type === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucun quartier trouvé</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          Aucun quartier ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
        </p>
        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters} data-testid="button-clear-filters-empty">
            Effacer les filtres
          </Button>
        )}
      </div>
    );
  }

  if (type === "no-favorites") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="p-4 rounded-full bg-favorite/10 mb-4">
          <Star className="h-8 w-8 text-favorite" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucun favori</h3>
        <p className="text-muted-foreground max-w-sm">
          Vous n'avez pas encore ajouté de quartier à vos favoris. Cliquez sur l'étoile d'un quartier pour le suivre.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-4 rounded-full bg-destructive/10 mb-4">
        <Zap className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
      <p className="text-muted-foreground max-w-sm">
        Impossible de charger les données. Veuillez réessayer plus tard.
      </p>
    </div>
  );
}
