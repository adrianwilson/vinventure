'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface FavoriteButtonProps {
  wineryId: string;
  isFavorite: boolean;
  onToggle?: (wineryId: string, isFavorite: boolean) => void;
  onToggleFavorite?: (wineryId: string) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}

export default function FavoriteButton({ 
  wineryId, 
  isFavorite, 
  onToggle,
  onToggleFavorite,
  size = 'md',
  variant = 'default'
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isToggling, setIsToggling] = useState(false);
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite);

  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg'
  };

  const handleToggle = async () => {
    if (!user) {
      // Could redirect to sign in or show modal
      alert('Please sign in to save favorites');
      return;
    }

    setIsToggling(true);
    const newFavoriteState = !localIsFavorite;
    
    try {
      // Optimistically update UI
      setLocalIsFavorite(newFavoriteState);
      
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/favorites`, {
      //   method: newFavoriteState ? 'POST' : 'DELETE',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ wineryId })
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Notify parent component
      if (onToggle) {
        onToggle(wineryId, newFavoriteState);
      } else if (onToggleFavorite) {
        onToggleFavorite(wineryId);
      }
      
    } catch (error) {
      // Revert optimistic update on error
      setLocalIsFavorite(!newFavoriteState);
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsToggling(false);
    }
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleToggle}
        disabled={isToggling}
        className={`${sizeClasses[size]} flex items-center justify-center transition-colors disabled:opacity-50`}
        title={localIsFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {localIsFavorite ? (
          <svg className="w-full h-full text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        ) : (
          <svg className="w-full h-full text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full border-2 transition-all duration-200 disabled:opacity-50 ${
        localIsFavorite
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
          : 'bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500'
      }`}
      title={localIsFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isToggling ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : localIsFavorite ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  );
}