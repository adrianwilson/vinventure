import { Winery, WinerySearchResponse, ExperienceType } from '../types/winery';

// Mock wineries data for static deployment
export const mockWineries: Winery[] = [
  {
    id: '1',
    name: 'Sunset Valley Winery',
    description: 'A family-owned winery specializing in premium Pinot Noir and Chardonnay with stunning valley views.',
    email: 'info@sunsetvalley.com',
    phone: '+1 (555) 123-4567',
    website: 'https://sunsetvalley.com',
    status: 'APPROVED',
    address: '123 Vineyard Lane',
    city: 'Napa',
    region: 'Napa Valley',
    country: 'United States',
    zipCode: '94558',
    latitude: 38.2975,
    longitude: -122.2869,
    logoUrl: null,
    bannerUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800&h=400&fit=crop'
    ],
    foundedYear: 1985,
    wineTypes: ['Red', 'White', 'Rosé'],
    sustainable: true,
    sustainablePractices: true,
    featured: true,
    rating: 4.8,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    experiences: [
      {
        id: 'exp1',
        title: 'Premium Wine Tasting',
        description: 'Taste our award-winning wines with vineyard views',
        type: ExperienceType.TASTING,
        duration: 90,
        price: 45,
        maxGuests: 8,
        rating: 4.9,
        availableDays: ['friday', 'saturday', 'sunday'],
        startTime: '10:00',
        endTime: '17:00',
        images: [],
        ageRestriction: 21,
        requirements: null,
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z'
      }
    ],
    _count: {
      reviews: 127
    }
  },
  {
    id: '2',
    name: 'Mountain Ridge Estate',
    description: 'Boutique winery known for bold Cabernet Sauvignon and intimate tasting experiences.',
    email: 'contact@mountainridge.com',
    phone: '+1 (555) 234-5678',
    website: 'https://mountainridge.com',
    status: 'APPROVED',
    address: '456 Hillside Drive',
    city: 'Sonoma',
    region: 'Sonoma County',
    country: 'United States',
    zipCode: '95476',
    latitude: 38.291859,
    longitude: -122.458036,
    logoUrl: null,
    bannerUrl: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800&h=400&fit=crop'
    ],
    foundedYear: 1992,
    wineTypes: ['Red', 'White'],
    sustainable: false,
    sustainablePractices: false,
    featured: false,
    rating: 4.6,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T14:20:00Z',
    experiences: [
      {
        id: 'exp2',
        title: 'Vineyard Tour & Tasting',
        description: 'Guided tour of our vineyard followed by wine tasting',
        type: ExperienceType.TOUR,
        duration: 120,
        price: 65,
        maxGuests: 12,
        rating: 4.7,
        availableDays: ['saturday', 'sunday'],
        startTime: '11:00',
        endTime: '16:00',
        images: [],
        ageRestriction: 21,
        requirements: 'Comfortable walking shoes recommended',
        isActive: true,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T14:20:00Z'
      }
    ],
    _count: {
      reviews: 89
    }
  },
  {
    id: '3',
    name: 'Coastal Breeze Vineyards',
    description: 'Ocean-view winery specializing in cool-climate wines and sparkling varieties.',
    email: 'info@coastalbreeze.com',
    phone: '+1 (555) 345-6789',
    website: 'https://coastalbreeze.com',
    status: 'APPROVED',
    address: '789 Ocean View Road',
    city: 'Monterey',
    region: 'Central Coast',
    country: 'United States',
    zipCode: '93940',
    latitude: 36.6002,
    longitude: -121.8947,
    logoUrl: null,
    bannerUrl: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800&h=400&fit=crop'
    ],
    foundedYear: 2001,
    wineTypes: ['White', 'Sparkling', 'Rosé'],
    sustainable: true,
    sustainablePractices: true,
    featured: false,
    rating: 4.4,
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-15T12:15:00Z',
    experiences: [
      {
        id: 'exp3',
        title: 'Sparkling Wine Experience',
        description: 'Learn about our sparkling wine production with tasting',
        type: ExperienceType.TASTING,
        duration: 75,
        price: 55,
        maxGuests: 6,
        rating: 4.5,
        availableDays: ['friday', 'saturday'],
        startTime: '14:00',
        endTime: '18:00',
        images: [],
        ageRestriction: 21,
        requirements: null,
        isActive: true,
        createdAt: '2024-01-05T08:00:00Z',
        updatedAt: '2024-01-15T12:15:00Z'
      }
    ],
    _count: {
      reviews: 64
    }
  },
  {
    id: '4',
    name: 'Heritage Oak Winery',
    description: 'Historic winery with centuries-old oak trees and traditional winemaking methods.',
    email: 'hello@heritageoaks.com',
    phone: '+1 (555) 456-7890',
    website: 'https://heritageoaks.com',
    status: 'APPROVED',
    address: '321 Heritage Lane',
    city: 'Paso Robles',
    region: 'Central Coast',
    country: 'United States',
    zipCode: '93446',
    latitude: 35.6269,
    longitude: -120.6906,
    logoUrl: null,
    bannerUrl: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=800&h=400&fit=crop'
    ],
    foundedYear: 1923,
    wineTypes: ['Red', 'White', 'Fortified'],
    sustainable: false,
    sustainablePractices: false,
    featured: true,
    rating: 4.7,
    createdAt: '2024-01-01T07:00:00Z',
    updatedAt: '2024-01-12T11:45:00Z',
    experiences: [
      {
        id: 'exp4',
        title: 'Historic Estate Tour',
        description: 'Explore our historic grounds and taste aged wines',
        type: ExperienceType.TOUR,
        duration: 150,
        price: 75,
        maxGuests: 10,
        rating: 4.8,
        availableDays: ['saturday', 'sunday'],
        startTime: '10:30',
        endTime: '17:30',
        images: [],
        ageRestriction: 21,
        requirements: 'Historic property, please dress appropriately',
        isActive: true,
        createdAt: '2024-01-01T07:00:00Z',
        updatedAt: '2024-01-12T11:45:00Z'
      }
    ],
    _count: {
      reviews: 156
    }
  }
];

// Mock search function for static deployment
export function searchWineries(params: {
  search?: string;
  region?: string;
  wineType?: string;
  sustainable?: boolean;
  featured?: boolean;
  page?: number;
  limit?: number;
}): WinerySearchResponse {
  let filteredWineries = [...mockWineries];

  // Apply filters
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredWineries = filteredWineries.filter(winery =>
      winery.name.toLowerCase().includes(searchLower) ||
      winery.description?.toLowerCase().includes(searchLower) ||
      winery.region.toLowerCase().includes(searchLower)
    );
  }

  if (params.region) {
    const regionLower = params.region.toLowerCase();
    filteredWineries = filteredWineries.filter(winery =>
      winery.region.toLowerCase().includes(regionLower)
    );
  }

  if (params.wineType) {
    filteredWineries = filteredWineries.filter(winery =>
      winery.wineTypes.includes(params.wineType!)
    );
  }

  if (params.sustainable) {
    filteredWineries = filteredWineries.filter(winery => winery.sustainable);
  }

  if (params.featured) {
    filteredWineries = filteredWineries.filter(winery => winery.featured);
  }

  // Apply pagination
  const page = params.page || 1;
  const limit = params.limit || 12;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedWineries = filteredWineries.slice(startIndex, endIndex);

  return {
    wineries: paginatedWineries,
    pagination: {
      total: filteredWineries.length,
      page,
      limit,
      totalPages: Math.ceil(filteredWineries.length / limit)
    }
  };
}