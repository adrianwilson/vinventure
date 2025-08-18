'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navigation from '../../components/ui/Navigation';
import WineryManagement from '../../components/winery-admin/WineryManagement';
import BookingManagement from '../../components/winery-admin/BookingManagement';
import Analytics from '../../components/winery-admin/Analytics';

export default function WineryAdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'winery' | 'bookings' | 'analytics'>('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth');
    }
    // TODO: Check if user has WINERY_ADMIN role
    // For now, we'll allow any authenticated user to access this
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats Cards */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Bookings</h3>
              <p className="text-3xl font-bold text-purple-600">24</p>
              <p className="text-sm text-gray-500 mt-1">+3 this week</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue</h3>
              <p className="text-3xl font-bold text-green-600">$2,450</p>
              <p className="text-sm text-gray-500 mt-1">+12% this month</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Rating</h3>
              <p className="text-3xl font-bold text-yellow-600">4.8</p>
              <p className="text-sm text-gray-500 mt-1">From 18 reviews</p>
            </div>

            {/* Quick Actions */}
            <div className="col-span-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setActiveTab('winery')}
                  className="bg-purple-50 border border-purple-200 p-4 rounded-lg hover:bg-purple-100 transition-colors text-left"
                >
                  <h4 className="font-medium text-purple-900">Manage Winery</h4>
                  <p className="text-sm text-purple-700 mt-1">Update your winery profile and experiences</p>
                </button>
                
                <button 
                  onClick={() => setActiveTab('bookings')}
                  className="bg-blue-50 border border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition-colors text-left"
                >
                  <h4 className="font-medium text-blue-900">View Bookings</h4>
                  <p className="text-sm text-blue-700 mt-1">Manage upcoming and past bookings</p>
                </button>
                
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition-colors text-left"
                >
                  <h4 className="font-medium text-green-900">View Analytics</h4>
                  <p className="text-sm text-green-700 mt-1">Track performance and insights</p>
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'winery':
        return <WineryManagement />;
      
      case 'bookings':
        return <BookingManagement />;
      
      case 'analytics':
        return <Analytics />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="winery-admin" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Winery Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your winery, bookings, and analyze performance.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'winery', label: 'Winery Management' },
                { key: 'bookings', label: 'Bookings' },
                { key: 'analytics', label: 'Analytics' }
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
          <div>
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
}