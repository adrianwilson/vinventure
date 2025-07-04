'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import WineryGrid from '../winery/WineryGrid';
import { Winery } from '@vinventure/types/types/winery';
import { mockWineries } from '../../lib/mock-data';

interface FavoritesListProps {
  onRemoveFavorite?: (wineryId: string) => void;
}

// Mock favorites data for development
const mockUserFavorites = [
  {
    id: 'fav1',
    userId: 'user1',
    wineryId: '1', // Sunset Valley Winery
    createdAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 'fav2', 
    userId: 'user1',
    wineryId: '3', // Coastal Breeze Vineyards
    createdAt: '2024-01-18T14:00:00Z'
  }
];

export default function FavoritesList({ onRemoveFavorite }: FavoritesListProps) {
  const { user } = useAuth();
  const { favoriteWineryIds, toggleFavorite, loading: favoritesLoading } = useFavorites();
  const [favoriteWineries, setFavoriteWineries] = useState<Winery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log user state
  console.log('FavoritesList - User:', user ? 'authenticated' : 'not authenticated');
  console.log('FavoritesList - Loading:', loading);
  console.log('FavoritesList - Error:', error);
  console.log('FavoritesList - Favorites count:', favoriteWineries.length);
  console.log('FavoritesList - Favorite IDs:', favoriteWineryIds);

  useEffect(() => {
    // Load wineries that match the favorite IDs
    if (favoriteWineryIds.length > 0) {
      const favorites = mockWineries.filter(winery => 
        favoriteWineryIds.includes(winery.id)
      );
      setFavoriteWineries(favorites);
      setLoading(false);
    } else {
      setFavoriteWineries([]);
      setLoading(false);
    }
  }, [favoriteWineryIds]);

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/users/${user.cognitoUid}/favorites`);
      // const favorites = await response.json();

      // Using mock data for now
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      // Get favorite winery IDs for current user
      const userFavoriteIds = mockUserFavorites
        .filter(fav => fav.userId === user?.sub) // In real app, would match user ID
        .map(fav => fav.wineryId);

      // Get the actual winery data
      const favorites = mockWineries.filter(winery => 
        userFavoriteIds.includes(winery.id) || 
        // For demo purposes, include first two wineries as favorites
        ['1', '3'].includes(winery.id)
      );

      setFavoriteWineries(favorites);
    } catch (err) {
      setError('Failed to load favorite wineries');
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = (wineryId: string) => {
    // Optimistically remove from UI
    setFavoriteWineries(prev => prev.filter(winery => winery.id !== wineryId));
    
    // Notify parent component
    if (onRemoveFavorite) {
      onRemoveFavorite(wineryId);
    }
  };

  // Temporarily removed for testing
  // if (!user) {
  //   return (
  //     <div className="text-center py-12">
  //       <div className="text-gray-400 mb-4">
  //         <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  //         </svg>
  //       </div>
  //       <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to view favorites</h3>
  //       <p className="text-gray-600 mb-4">
  //         Create an account to save your favorite wineries and access them anytime.
  //       </p>
  //       <a
  //         href="/auth"
  //         className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
  //       >
  //         Sign In
  //       </a>
  //     </div>
  //   );
  // }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <div className="text-gray-600">Loading your favorite wineries...</div>
        </div>
        <WineryGrid wineries={[]} loading={true} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading favorites</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadFavorites}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (favoriteWineries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No favorite wineries yet</h3>
        <p className="text-gray-600 mb-4">
          Start exploring wineries and save your favorites for easy access later.
        </p>
        <a
          href="/discover"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
        >
          Discover Wineries
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Favorite Wineries</h2>
          <p className="text-gray-600">
            {favoriteWineries.length} favorite{favoriteWineries.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={loadFavorites}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          Refresh
        </button>
      </div>

      <WineryGrid 
        wineries={favoriteWineries} 
        loading={false}
        showFavorites={true}
        onRemoveFavorite={handleRemoveFavorite}
      />
    </div>
  );
}