'use client';

import { useState, useEffect, useRef } from 'react';
import { Winery } from '../../types/winery';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '../../lib/google-maps-loader';

interface WineryMapProps {
  wineries: Winery[];
  selectedWinery?: Winery | null;
  onWinerySelect?: (winery: Winery) => void;
  className?: string;
}

const WineryMap: React.FC<WineryMapProps> = ({
  wineries,
  selectedWinery,
  onWinerySelect,
  className = "w-full h-96"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps API
  useEffect(() => {
    // Check if already loaded
    if (isGoogleMapsLoaded()) {
      setIsLoaded(true);
      return;
    }

    // Load the API
    loadGoogleMapsAPI()
      .then(() => {
        setIsLoaded(true);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load Google Maps. Please check your API key configuration.');
      });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    // Default center (Napa Valley)
    const defaultCenter = { lat: 38.2975, lng: -122.2869 };
    
    // Find center point of wineries or use default
    let center = defaultCenter;
    if (wineries.length > 0) {
      const wineriesWithCoords = wineries.filter(w => w.latitude && w.longitude);
      if (wineriesWithCoords.length > 0) {
        const avgLat = wineriesWithCoords.reduce((sum, w) => sum + w.latitude!, 0) / wineriesWithCoords.length;
        const avgLng = wineriesWithCoords.reduce((sum, w) => sum + w.longitude!, 0) / wineriesWithCoords.length;
        center = { lat: avgLat, lng: avgLng };
      }
    }

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: wineries.length > 0 ? 10 : 8,
      center,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(mapInstance);
  }, [isLoaded, wineries]);

  // Add markers for wineries
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];

    wineries.forEach(winery => {
      if (!winery.latitude || !winery.longitude) return;

      const marker = new window.google.maps.Marker({
        position: { lat: winery.latitude, lng: winery.longitude },
        map,
        title: winery.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#7C3AED" stroke="white" stroke-width="2"/>
              <path d="M12 14C12 12.8954 12.8954 12 14 12H18C19.1046 12 20 12.8954 20 14V20H12V14Z" fill="white"/>
              <circle cx="16" cy="16" r="2" fill="#7C3AED"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2 max-w-xs">
            <h3 class="font-semibold text-gray-900">${winery.name}</h3>
            <p class="text-sm text-gray-600">${winery.city}, ${winery.region}</p>
            ${winery.rating ? `<p class="text-sm text-yellow-600">★ ${winery.rating}/5</p>` : ''}
            <p class="text-sm text-gray-500 mt-1">${winery.description || 'Wine experiences available'}</p>
          </div>
        `
      });

      // Add click listener
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        if (onWinerySelect) {
          onWinerySelect(winery);
        }
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  }, [map, wineries, onWinerySelect]);

  // Handle selected winery
  useEffect(() => {
    if (!map || !selectedWinery || !selectedWinery.latitude || !selectedWinery.longitude) return;

    // Center map on selected winery
    map.panTo({ lat: selectedWinery.latitude, lng: selectedWinery.longitude });
    map.setZoom(12);

    // Find and click the corresponding marker
    const marker = markers.find(m => m.getTitle() === selectedWinery.name);
    if (marker) {
      window.google.maps.event.trigger(marker, 'click');
    }
  }, [selectedWinery, map, markers]);

  if (error) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center p-4">
          <div className="text-red-600 mb-2">⚠️ Map Error</div>
          <div className="text-sm text-gray-600">{error}</div>
          <div className="text-xs text-gray-500 mt-2">
            Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default WineryMap;