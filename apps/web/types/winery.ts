// Winery Status enum
export enum WineryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

// Wine types
export const WINE_TYPES = [
  'Red',
  'White',
  'Rosé',
  'Sparkling',
  'Dessert',
  'Fortified',
  'Orange'
];

// Experience types
export enum ExperienceType {
  TASTING = 'TASTING',
  TOUR = 'TOUR',
  PAIRING = 'PAIRING',
  WORKSHOP = 'WORKSHOP',
  PRIVATE = 'PRIVATE',
  HARVEST = 'HARVEST',
  BARREL_TASTING = 'BARREL_TASTING',
  CUSTOM = 'CUSTOM'
}

export const EXPERIENCE_TYPE_LABELS: Record<ExperienceType, string> = {
  [ExperienceType.TASTING]: 'Wine Tasting',
  [ExperienceType.TOUR]: 'Vineyard Tour',
  [ExperienceType.PAIRING]: 'Food & Wine Pairing',
  [ExperienceType.WORKSHOP]: 'Wine Workshop',
  [ExperienceType.PRIVATE]: 'Private Experience',
  [ExperienceType.HARVEST]: 'Harvest Experience',
  [ExperienceType.BARREL_TASTING]: 'Barrel Tasting',
  [ExperienceType.CUSTOM]: 'Custom Experience'
};

export interface Winery {
  id: string;
  name: string;
  description?: string;
  email: string;
  phone?: string;
  website?: string;
  status: WineryStatus;
  address: string;
  city: string;
  region: string;
  country: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  images: string[];
  foundedYear?: number | null;
  wineTypes: string[];
  sustainable: boolean;
  rating?: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
  experiences?: Experience[];
  _count?: {
    reviews?: number;
  };
}

export interface Experience {
  id: string;
  title: string;
  description: string;
  type: ExperienceType;
  duration: number; // in minutes
  price: number;
  maxGuests: number;
  rating?: number;
  availableDays: string[];
  startTime: string;
  endTime: string;
  ageRestriction?: number;
  requirements?: string;
  wineryId: string;
  winery?: Winery;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WineryFilters {
  search: string;
  region: string;
  wineType: string;
  sustainable: boolean;
  featured: boolean;
}

export interface WinerySearchResponse {
  wineries: Winery[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}