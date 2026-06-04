'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../../components/ui/Navigation';
import BookingsList from '../../components/dashboard/BookingsList';
import FavoritesList from '../../components/favorites/FavoritesList';
import RoleAssigner from '../../components/admin/RoleAssigner';
import { getRoleDisplayName, canAccessWineryAdmin, canAccessPlatformAdmin } from '../../lib/roles';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'favorites'>('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      // For development, allow access without authentication
      console.log('No authenticated user found, redirecting to auth...');
      // Temporarily comment out redirect for testing
      // router.push('/auth');
    }
  }, [mounted, user, loading, router]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For development, create a mock user if no authenticated user
  const getDevRole = () => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('dev_user_role');
      console.log(`[DEV] Reading role from localStorage: ${savedRole}`);
      return (savedRole as 'GUEST' | 'WINERY_ADMIN' | 'PLATFORM_ADMIN') || 'GUEST';
    }
    return 'GUEST' as const;
  };

  const currentUser = user || {
    username: 'dev-user',
    email: 'dev@example.com',
    name: 'Development User',
    role: getDevRole(),
    displayName: 'Development User'
  };

  console.log(`[DEV] Current user role: ${currentUser.role}`);
  console.log(`[DEV] Can access winery admin: ${canAccessWineryAdmin(currentUser.role)}`);
  console.log(`[DEV] Can access platform admin: ${canAccessPlatformAdmin(currentUser.role)}`);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/discover" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Discover Wineries</h3>
              <p className="text-gray-600 mb-4">Browse and search for unique wine experiences near you</p>
              <div className="text-purple-600 font-medium">Explore Now →</div>
            </Link>
            
            <button 
              onClick={() => setActiveTab('bookings')}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My Bookings</h3>
              <p className="text-gray-600 mb-4">View and manage your upcoming wine experiences</p>
              <div className="text-purple-600 font-medium">View Bookings →</div>
            </button>
            
            <button 
              onClick={() => setActiveTab('favorites')}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Favorites</h3>
              <p className="text-gray-600 mb-4">Your saved wineries and experiences</p>
              <div className="text-purple-600 font-medium">View Favorites →</div>
            </button>

            {/* Admin Access Cards - Only render after mounting to prevent hydration issues */}
            {mounted && canAccessWineryAdmin(currentUser?.role) && (
              <Link 
                href="/winery-admin"
                className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer text-white"
              >
                <h3 className="text-lg font-semibold mb-2">Winery Admin</h3>
                <p className="text-purple-100 mb-4">Manage your winery, bookings, and analytics</p>
                <div className="text-white font-medium">Admin Dashboard →</div>
              </Link>
            )}

            {mounted && canAccessPlatformAdmin(currentUser?.role) && (
              <Link 
                href="/admin"
                className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer text-white"
              >
                <h3 className="text-lg font-semibold mb-2">Platform Admin</h3>
                <p className="text-red-100 mb-4">Manage users, wineries, and platform settings</p>
                <div className="text-white font-medium">Platform Dashboard →</div>
              </Link>
            )}

          </div>
        );
      
      case 'bookings':
        return <BookingsList />;
      
      case 'favorites':
        return <FavoritesList />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="dashboard" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Development Tool - Role Assigner - Only show for development */}
          {mounted && currentUser.role === 'GUEST' && (
            <RoleAssigner onRoleUpdated={() => window.location.reload()} />
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Welcome back, {currentUser?.name || currentUser?.displayName || currentUser?.email}!
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage your wine experiences and discover new favorites.
                </p>
              </div>
              {mounted && (
                <div className="flex-shrink-0">
                  <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                    {getRoleDisplayName(currentUser?.role || 'GUEST')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6 overflow-x-auto">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'bookings', label: 'My Bookings' },
                { key: 'favorites', label: 'Favorites' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'overview' | 'bookings' | 'favorites')}
                  className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
}