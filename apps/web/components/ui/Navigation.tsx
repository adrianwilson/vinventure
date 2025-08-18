'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface NavigationProps {
  currentPage?: 'home' | 'discover' | 'map' | 'favorites' | 'dashboard' | 'winery-admin' | 'auth';
}

export default function Navigation({ currentPage = 'home' }: NavigationProps) {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render auth-dependent content until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-purple-900">
                VinVenture
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/discover" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'discover' 
                    ? 'text-purple-600 bg-purple-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Discover
              </Link>
              <Link 
                href="/map" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'map' 
                    ? 'text-purple-600 bg-purple-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Map
              </Link>
              <Link 
                href="/favorites" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'favorites' 
                    ? 'text-purple-600 bg-purple-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Favorites
              </Link>
              {loading && (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-purple-900">
              VinVenture
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Public Navigation */}
            <Link 
              href="/discover" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'discover' 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Discover
            </Link>
            
            <Link 
              href="/map" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'map' 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Map
            </Link>

            {/* Favorites - Always visible for testing */}
            <Link 
              href="/favorites" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'favorites' 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Favorites
            </Link>

            {/* Authenticated Navigation */}
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'dashboard' 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </Link>
                
                {/* TODO: Add role-based visibility - show only for WINERY_ADMIN users */}
                <Link 
                  href="/winery-admin" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'winery-admin' 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Winery Admin
                </Link>
                
                <span className="text-gray-700 text-sm">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link 
                href="/auth" 
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}