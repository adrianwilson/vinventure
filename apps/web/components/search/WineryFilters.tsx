'use client';

import { useState } from 'react';
import { WineryFilters, WINE_TYPES } from '../../types/winery';

interface WineryFiltersProps {
  filters: WineryFilters;
  onFiltersChange: (filters: WineryFilters) => void;
  resultsCount?: number;
}

const regions = [
  'Napa Valley',
  'Sonoma County',
  'Paso Robles',
  'Santa Barbara County',
  'Willamette Valley',
  'Finger Lakes',
  'Columbia Valley',
  'Okanagan Valley'
];

export default function WineryFiltersComponent({ 
  filters, 
  onFiltersChange, 
  resultsCount 
}: WineryFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof WineryFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      region: '',
      wineType: '',
      sustainable: false,
      featured: false
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.region || 
    filters.wineType || 
    filters.sustainable || 
    filters.featured;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search wineries by name, location, or wine type..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => updateFilter('featured', !filters.featured)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.featured
              ? 'bg-purple-100 text-purple-800 border border-purple-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⭐ Featured
        </button>
        
        <button
          onClick={() => updateFilter('sustainable', !filters.sustainable)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.sustainable
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🌱 Sustainable
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters Toggle */}
      <div className="border-t pt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span>Advanced Filters</span>
          <svg 
            className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Region Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <select
              value={filters.region}
              onChange={(e) => updateFilter('region', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Wine Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wine Type
            </label>
            <select
              value={filters.wineType}
              onChange={(e) => updateFilter('wineType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Wine Types</option>
              {WINE_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Results Count */}
      {resultsCount !== undefined && (
        <div className="mt-4 pt-4 border-t text-sm text-gray-600">
          {resultsCount === 0 ? (
            <span>No wineries found</span>
          ) : (
            <span>
              {resultsCount} winer{resultsCount === 1 ? 'y' : 'ies'} found
              {hasActiveFilters && ' matching your criteria'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}