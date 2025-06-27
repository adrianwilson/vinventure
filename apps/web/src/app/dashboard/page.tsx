'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../../components/ui/Navigation';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="dashboard" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to VinVenture!</h2>
              <p className="text-gray-600 mb-8">Your dashboard is being prepared. Soon you'll be able to:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <Link href="/discover" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Discover Wineries</h3>
                  <p className="text-gray-600 mb-4">Browse and search for unique wine experiences near you</p>
                  <div className="text-purple-600 font-medium">Explore Now →</div>
                </Link>
                
                <div className="bg-white p-6 rounded-lg shadow-md opacity-75">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Experiences</h3>
                  <p className="text-gray-600 mb-4">Reserve wine tastings, tours, and special events</p>
                  <div className="text-gray-400 font-medium">Coming Soon</div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md opacity-75">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Bookings</h3>
                  <p className="text-gray-600 mb-4">View and manage your upcoming wine experiences</p>
                  <div className="text-gray-400 font-medium">Coming Soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}