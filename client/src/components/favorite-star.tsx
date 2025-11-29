import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FavoriteStarProps {
  isFavorite: boolean;
  onToggle: () => void;
  neighborhoodName: string;
}

export function FavoriteStar({ isFavorite, onToggle, neighborhoodName }: FavoriteStarProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "shrink-0 transition-colors duration-200",
        isFavorite && "text-favorite"
      )}
      data-testid={`button-favorite-${neighborhoodName.toLowerCase().replace(/\s+/g, '-')}`}
      aria-label={isFavorite ? `Retirer ${neighborhoodName} des favoris` : `Ajouter ${neighborhoodName} aux favoris`}
    >
      <Star
        className={cn(
          "h-5 w-5 transition-all duration-200",
          isFavorite ? "fill-favorite text-favorite" : "fill-transparent"
        )}
      />
    </Button>
  );
}
