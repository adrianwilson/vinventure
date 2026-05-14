// Google Maps API Loader - Ensures the API is loaded only once
let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsAPI = (): Promise<void> => {
  // If already loaded, return immediately
  if (isLoaded && window.google) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Start loading
  isLoading = true;
  loadPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // If script exists but google is not loaded yet, wait for it
      if (window.google) {
        isLoaded = true;
        isLoading = false;
        resolve();
        return;
      }
      
      // Wait for existing script to load
      existingScript.addEventListener('load', () => {
        isLoaded = true;
        isLoading = false;
        resolve();
      });
      existingScript.addEventListener('error', () => {
        isLoading = false;
        reject(new Error('Failed to load Google Maps API'));
      });
      return;
    }

    // Create new script
    const script = document.createElement('script');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      isLoading = false;
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };
    
    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

export const isGoogleMapsLoaded = (): boolean => {
  return isLoaded && !!window.google;
};