'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../../components/ui/Navigation';
import BookingsList from '../../components/dashboard/BookingsList';
import FavoritesList from '../../components/favorites/FavoritesList';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'favorites'>('overview');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

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

  if (!user) {
    return null;
  }

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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name || user?.email}!
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your wine experiences and discover new favorites.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'bookings', label: 'My Bookings' },
                { key: 'favorites', label: 'Favorites' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
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