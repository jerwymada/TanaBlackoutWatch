import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "delestage-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      console.warn("Failed to save favorites to localStorage");
    }
  }, [favorites]);

  const toggleFavorite = useCallback((neighborhoodId: number) => {
    setFavorites(prev => {
      if (prev.includes(neighborhoodId)) {
        return prev.filter(id => id !== neighborhoodId);
      }
      return [...prev, neighborhoodId];
    });
  }, []);

  const isFavorite = useCallback((neighborhoodId: number) => {
    return favorites.includes(neighborhoodId);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
