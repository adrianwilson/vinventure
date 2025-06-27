'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navigation from '../../components/ui/Navigation';
import SearchBar from '../../components/ui/SearchBar';
import FilterPanel from '../../components/ui/FilterPanel';
import WineryGrid from '../../components/winery/WineryGrid';
import Pagination from '../../components/ui/Pagination';
import { WineryFilters, WinerySearchResponse } from '../../types/winery';
import { searchWineries } from '../../lib/mock-data';

const initialFilters: WineryFilters = {
  search: '',
  region: '',
  wineType: '',
  sustainable: false,
  featured: false
};

function DiscoverContent() {

  // State
  const [filters, setFilters] = useState<WineryFilters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<WinerySearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 12; // Items per page

  // Initialize filters from URL params (only in browser)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const search = urlParams.get('search') || '';
      const region = urlParams.get('region') || '';
      const wineType = urlParams.get('wineType') || '';
      const sustainable = urlParams.get('sustainable') === 'true';
      const featured = urlParams.get('featured') === 'true';
      const page = parseInt(urlParams.get('page') || '1');

      setFilters({ search, region, wineType, sustainable, featured });
      setCurrentPage(page);
    }
  }, []);

  // Update URL when filters or page change (only in browser)
  const updateURL = useCallback((newFilters: WineryFilters, newPage: number) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      
      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.region) params.set('region', newFilters.region);
      if (newFilters.wineType) params.set('wineType', newFilters.wineType);
      if (newFilters.sustainable) params.set('sustainable', 'true');
      if (newFilters.featured) params.set('featured', 'true');
      if (newPage > 1) params.set('page', newPage.toString());

      const newURL = params.toString() ? `/discover?${params.toString()}` : '/discover';
      window.history.pushState({}, '', newURL);
    }
  }, []);

  // Fetch wineries (using mock data for static export)
  const fetchWineries = useCallback(async (searchFilters: WineryFilters, page: number) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 300));

      const result = searchWineries({
        search: searchFilters.search || undefined,
        region: searchFilters.region || undefined,
        wineType: searchFilters.wineType || undefined,
        sustainable: searchFilters.sustainable || undefined,
        featured: searchFilters.featured || undefined,
        page,
        limit
      });

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching wineries:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Fetch data when filters or page change
  useEffect(() => {
    fetchWineries(filters, currentPage);
  }, [fetchWineries, filters, currentPage]);

  // Debounced search handler
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const handleSearchChange = useCallback((search: string) => {
    const newFilters = { ...filters, search };
    setFilters(newFilters);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      updateURL(newFilters, 1);
    }, 500);
    
    setSearchTimeout(timeout);
  }, [filters, searchTimeout, updateURL]);

  const handleFiltersChange = useCallback((newFilters: WineryFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1);
  }, [updateURL]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters = { ...initialFilters, search: filters.search };
    setFilters(clearedFilters);
    setCurrentPage(1);
    updateURL(clearedFilters, 1);
  }, [filters.search, updateURL]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    updateURL(filters, page);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, updateURL]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="discover" />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Wineries</h1>
          <p className="text-gray-600">
            Find the perfect winery experience for your next adventure
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search by winery name, region, or description..."
                className="w-full"
              />
            </div>
            <div className="lg:w-auto">
              <FilterPanel
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {data && !loading && (
          <div className="mb-6">
            <p className="text-gray-600">
              {data.pagination.total === 0 
                ? 'No wineries found'
                : `Found ${data.pagination.total} winer${data.pagination.total === 1 ? 'y' : 'ies'}`
              }
              {filters.search && ` for "${filters.search}"`}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading wineries</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => fetchWineries(filters, currentPage)}
                  className="text-sm text-red-800 underline hover:text-red-900 mt-2"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Winery Grid */}
        <div className="mb-8">
          <WineryGrid
            wineries={data?.wineries || []}
            loading={loading}
          />
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={data.pagination.totalPages}
            onPageChange={handlePageChange}
            totalItems={data.pagination.total}
            itemsPerPage={limit}
          />
        )}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return <DiscoverContent />;
}