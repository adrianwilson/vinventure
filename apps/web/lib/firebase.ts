import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Safe Firebase config - will never cause API key errors
const createSafeFirebaseConfig = () => {
  // Only try to read environment variables in the browser
  if (typeof window === 'undefined') {
    return null;
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  // Strict validation to prevent invalid API key errors
  if (!apiKey || 
      apiKey === 'YOUR_ACTUAL_API_KEY_HERE' || 
      apiKey === 'placeholder-api-key' ||
      apiKey === 'undefined' ||
      apiKey.length < 20 ||  // Firebase API keys are typically 30+ chars
      !apiKey.startsWith('AIza')) {  // Firebase API keys start with AIza
    return null;
  }

  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let initializationAttempted = false;

// Safe Firebase initialization
const initializeFirebaseSafely = () => {
  if (initializationAttempted) {
    return app !== null;
  }
  
  initializationAttempted = true;
  
  const config = createSafeFirebaseConfig();
  if (!config) {
    console.warn('Firebase configuration not available or invalid. Authentication disabled.');
    return false;
  }

  try {
    app = initializeApp(config);
    auth = getAuth(app);
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    app = null;
    auth = null;
    return false;
  }
};

// Helper function to check if Firebase is available
export const isFirebaseAvailable = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  if (!initializationAttempted) {
    initializeFirebaseSafely();
  }
  
  return app !== null && auth !== null;
};

// Safe auth getter
export const getFirebaseAuth = () => {
  if (!auth) {
    throw new Error('Firebase not initialized. Please configure Firebase credentials.');
  }
  return auth;
};

// Export for compatibility (will be null if not configured)
export { auth };
export default app;