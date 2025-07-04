// Runtime configuration - fetches config from API instead of build-time env vars
export interface AppConfig {
  stripePublishableKey: string;
  apiUrl: string;
}

let configCache: AppConfig | null = null;

export async function getAppConfig(): Promise<AppConfig> {
  if (configCache) {
    return configCache;
  }

  try {
    // Fetch configuration from our API
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error('Failed to fetch config');
    }
    
    configCache = await response.json();
    return configCache;
  } catch (error) {
    console.error('Failed to load app config:', error);
    // Fallback to environment variables for local development
    return {
      stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://di0bluzj0y4p2.cloudfront.net'
    };
  }
}