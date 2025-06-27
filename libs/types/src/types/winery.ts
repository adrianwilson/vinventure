export interface Winery {
  id: string;
  name: string;
  description: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  status: WineryStatus;
  
  // Location
  address: string;
  city: string;
  region: string;
  country: string;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  
  // Media
  logoUrl: string | null;
  bannerUrl: string | null;
  images: string[];
  
  // Business details
  foundedYear: number | null;
  wineTypes: string[];
  sustainable: boolean;
  rating?: number;
  featured?: boolean;
  
  createdAt: string;
  updatedAt: string;
  
  // Relations (when included)
  experiences?: Experience[];
  _count?: {
    reviews: number;
  };
}

export interface Experience {
  id: string;
  title: string;
  description?: string;
  type: ExperienceType;
  duration: number; // minutes
  price: number;
  maxGuests: number;
  rating?: number;
  
  // Scheduling
  availableDays: string[];
  startTime: string;
  endTime: string;
  
  // Media
  images: string[];
  
  // Requirements
  ageRestriction: number | null;
  requirements: string | null;
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum WineryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

export enum ExperienceType {
  TASTING = 'TASTING',
  TOUR = 'TOUR',
  VIRTUAL_EVENT = 'VIRTUAL_EVENT',
  PRIVATE_EVENT = 'PRIVATE_EVENT'
}

export interface WinerySearchParams {
  search?: string;
  region?: string;
  wineType?: string;
  sustainable?: boolean;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export interface WinerySearchResponse {
  wineries: Winery[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WineryFilters {
  search: string;
  region: string;
  wineType: string;
  sustainable: boolean;
  featured: boolean;
}

export const WINE_TYPES = [
  'Red',
  'White',
  'Rosé',
  'Sparkling',
  'Dessert',
  'Fortified'
] as const;

export const EXPERIENCE_TYPE_LABELS = {
  [ExperienceType.TASTING]: 'Wine Tasting',
  [ExperienceType.TOUR]: 'Winery Tour',
  [ExperienceType.VIRTUAL_EVENT]: 'Virtual Event',
  [ExperienceType.PRIVATE_EVENT]: 'Private Event'
} as const;