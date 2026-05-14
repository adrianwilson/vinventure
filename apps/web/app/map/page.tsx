'use client';

import { useState, useEffect } from 'react';
import { Winery } from '../../types/winery';
import WineryMap from '../../components/map/WineryMap';
import WineryCard from '../../components/winery/WineryCard';
import Navigation from '../../components/ui/Navigation';
import { mockWineries } from '../../lib/mock-data';
import { useFavorites } from '../../contexts/FavoritesContext';

export default function MapPage() {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [selectedWinery, setSelectedWinery] = useState<Winery | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'split'>('split');

  useEffect(() => {
    // TODO: Replace with actual API call
    const loadWineries = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Add coordinates to mock wineries for map display
        const wineriesWithCoords = mockWineries.map((winery, index) => ({
          ...winery,
          latitude: 38.2975 + (index * 0.01) - 0.02, // Spread around Napa Valley
          longitude: -122.2869 + (index * 0.01) - 0.02
        }));
        
        setWineries(wineriesWithCoords);
      } catch (error) {
        console.error('Failed to load wineries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWineries();
  }, []);

  const handleWinerySelect = (winery: Winery) => {
    setSelectedWinery(winery);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading wineries...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="map" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Discover Wineries</h1>
              <p className="text-gray-600 text-sm">
                Found {wineries.length} wineries in your area
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'split'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Map + List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Map Only
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            {/* Map Section */}
            <div className="order-2 lg:order-1">
              <WineryMap
                wineries={wineries}
                selectedWinery={selectedWinery}
                onWinerySelect={handleWinerySelect}
                className="w-full h-full"
              />
            </div>

            {/* List Section */}
            <div className="order-1 lg:order-2 overflow-y-auto">
              <div className="space-y-4">
                {wineries.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No wineries found</div>
                  </div>
                ) : (
                  wineries.map((winery) => (
                    <div
                      key={winery.id}
                      className={`transition-all duration-200 ${
                        selectedWinery?.id === winery.id
                          ? 'ring-2 ring-purple-500 shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleWinerySelect(winery)}
                    >
                      <WineryCard 
                        winery={winery} 
                        showFavoriteButton={true}
                        isFavorite={isFavorite(winery.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Map Only View */
          <div className="h-[calc(100vh-200px)]">
            <WineryMap
              wineries={wineries}
              selectedWinery={selectedWinery}
              onWinerySelect={handleWinerySelect}
              className="w-full h-full"
            />
            
            {/* Selected Winery Card Overlay */}
            {selectedWinery && (
              <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:w-96 z-10">
                <div className="bg-white rounded-lg shadow-lg p-1">
                  <WineryCard 
                    winery={selectedWinery} 
                    showFavoriteButton={true}
                    isFavorite={isFavorite(selectedWinery.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                  <div className="p-3 pt-0">
                    <button
                      onClick={() => setSelectedWinery(null)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}