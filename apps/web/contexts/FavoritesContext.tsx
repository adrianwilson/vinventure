'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favoriteWineryIds: string[];
  isFavorite: (wineryId: string) => boolean;
  toggleFavorite: (wineryId: string) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

interface FavoritesProviderProps {
  children: React.ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { user } = useAuth();
  const [favoriteWineryIds, setFavoriteWineryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's favorites when they sign in
  useEffect(() => {
    if (user) {
      loadUserFavorites();
    } else {
      // Clear favorites when user signs out
      setFavoriteWineryIds([]);
    }
  }, [user]);

  const loadUserFavorites = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/users/${user.sub}/favorites`);
      // const favorites = await response.json();
      
      // For now, use localStorage to persist favorites
      const stored = localStorage.getItem(`favorites_${user.sub}`);
      if (stored) {
        setFavoriteWineryIds(JSON.parse(stored));
      } else {
        // Set some default favorites for demo
        setFavoriteWineryIds(['1', '3']); // Sunset Valley & Coastal Breeze
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFavoritesToStorage = (favorites: string[]) => {
    if (user) {
      localStorage.setItem(`favorites_${user.sub}`, JSON.stringify(favorites));
    }
  };

  const isFavorite = (wineryId: string): boolean => {
    return favoriteWineryIds.includes(wineryId);
  };

  const toggleFavorite = async (wineryId: string): Promise<void> => {
    if (!user) {
      throw new Error('Must be signed in to favorite wineries');
    }

    const isCurrentlyFavorite = isFavorite(wineryId);
    const newFavorites = isCurrentlyFavorite
      ? favoriteWineryIds.filter(id => id !== wineryId)
      : [...favoriteWineryIds, wineryId];

    // Optimistically update UI
    setFavoriteWineryIds(newFavorites);
    saveFavoritesToStorage(newFavorites);

    try {
      // In a real implementation, this would be an API call
      // await fetch('/api/favorites', {
      //   method: isCurrentlyFavorite ? 'DELETE' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ wineryId })
      // });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log(
        isCurrentlyFavorite 
          ? `Removed winery ${wineryId} from favorites` 
          : `Added winery ${wineryId} to favorites`
      );
    } catch (error) {
      // Revert on error
      setFavoriteWineryIds(favoriteWineryIds);
      saveFavoritesToStorage(favoriteWineryIds);
      throw error;
    }
  };

  const value: FavoritesContextType = {
    favoriteWineryIds,
    isFavorite,
    toggleFavorite,
    loading,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}