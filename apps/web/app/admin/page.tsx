'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Navigation from '../../components/ui/Navigation';
import { getRoleDisplayName, canAccessPlatformAdmin } from '../../lib/roles';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'GUEST' | 'WINERY_ADMIN' | 'PLATFORM_ADMIN';
  createdAt: string;
  isActive: boolean;
}

interface UserRoleAssignmentProps {
  user: User;
  onRoleUpdate: (userId: string, newRole: 'GUEST' | 'WINERY_ADMIN' | 'PLATFORM_ADMIN') => void;
}

function UserRoleAssignment({ user, onRoleUpdate }: UserRoleAssignmentProps) {
  const [selectedRole, setSelectedRole] = useState<'GUEST' | 'WINERY_ADMIN' | 'PLATFORM_ADMIN'>(user.role);
  const [loading, setLoading] = useState(false);

  const handleRoleUpdate = async () => {
    if (selectedRole === user.role) return;
    
    setLoading(true);
    try {
      await onRoleUpdate(user.id, selectedRole);
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as 'GUEST' | 'WINERY_ADMIN' | 'PLATFORM_ADMIN')}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        disabled={loading}
      >
        <option value="GUEST">Guest</option>
        <option value="WINERY_ADMIN">Winery Admin</option>
        <option value="PLATFORM_ADMIN">Platform Admin</option>
      </select>
      
      {selectedRole !== user.role && (
        <button
          onClick={handleRoleUpdate}
          disabled={loading}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update'}
        </button>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth');
    }
  }, [mounted, user, loading, router]);

  // For development, create a mock user if no authenticated user
  const currentUser = user || {
    username: 'dev-user',
    email: 'dev@example.com',
    name: 'Development User',
    role: 'PLATFORM_ADMIN' as const,
    displayName: 'Development User',
    accessToken: 'dev-token',
  };

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setApiError(null);

    try {
      // Try to fetch from backend API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${currentUser.accessToken || 'dev-token'}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Failed to fetch users from API, using mock data:', message);
      setApiError('Backend API is not available. Using development mock data.');

      // Mock users for development
      setUsers([
        {
          id: '1',
          email: 'alice@example.com',
          name: 'Alice Johnson',
          role: 'GUEST',
          createdAt: '2024-01-15T10:30:00Z',
          isActive: true
        },
        {
          id: '2',
          email: 'bob@wineryowner.com',
          name: 'Bob Smith',
          role: 'WINERY_ADMIN',
          createdAt: '2024-01-10T14:20:00Z',
          isActive: true
        },
        {
          id: '3',
          email: 'charlie@platform.com',
          name: 'Charlie Brown',
          role: 'PLATFORM_ADMIN',
          createdAt: '2024-01-05T09:15:00Z',
          isActive: true
        },
        {
          id: '4',
          email: 'diana@guest.com',
          name: 'Diana Prince',
          role: 'GUEST',
          createdAt: '2024-01-20T16:45:00Z',
          isActive: false
        }
      ]);
    } finally {
      setLoadingUsers(false);
    }
  }, [currentUser.accessToken]);

  useEffect(() => {
    if (mounted) {
      fetchUsers();
    }
  }, [mounted, fetchUsers]);

  const handleRoleUpdate = async (userId: string, newRole: 'GUEST' | 'WINERY_ADMIN' | 'PLATFORM_ADMIN') => {
    try {
      // Try to update via API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.accessToken || 'dev-token'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      console.warn('API update failed, updating mock data locally:', error);
    }
    
    // Update local state (works for both API success and mock data)
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      )
    );
  };

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

  // Check if user has platform admin access
  if (!canAccessPlatformAdmin(currentUser.role)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="admin" />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-red-500 text-6xl mb-4">🚫</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-6">
                You need Platform Administrator privileges to access this page.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Current role: <span className="font-medium">{getRoleDisplayName(currentUser.role || 'GUEST')}</span>
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="admin" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Platform Administration
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage users, roles, and platform settings.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-red-100 px-3 py-1 rounded-full text-sm text-red-800">
                  {getRoleDisplayName(currentUser.role || 'GUEST')}
                </div>
              </div>
            </div>
          </div>

          {/* API Error Alert */}
          {apiError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="text-yellow-400">⚠️</div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Development Mode</h3>
                  <p className="mt-1 text-sm text-yellow-700">{apiError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Users Management */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <p className="mt-1 text-sm text-gray-600">Manage user roles and permissions</p>
            </div>

            <div className="overflow-x-auto">
              {loadingUsers ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading users...</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || user.email}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'PLATFORM_ADMIN' 
                              ? 'bg-red-100 text-red-800'
                              : user.role === 'WINERY_ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getRoleDisplayName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <UserRoleAssignment 
                            user={user} 
                            onRoleUpdate={handleRoleUpdate}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}