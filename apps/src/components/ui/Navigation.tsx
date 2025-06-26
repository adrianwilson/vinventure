'use client';

import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface NavigationProps {
  currentPage?: 'home' | 'discover' | 'dashboard' | 'auth';
}

export default function Navigation({ currentPage = 'home' }: NavigationProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

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