'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RoleAssignerProps {
  onRoleUpdated?: () => void;
}

export default function RoleAssigner({ onRoleUpdated }: RoleAssignerProps) {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'GUEST' | 'WINERY_ADMIN' | 'PLATFORM_ADMIN'>('WINERY_ADMIN');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  console.log(`[DEV] RoleAssigner rendered with selectedRole: ${selectedRole}`);

  const handleAssignRole = async () => {
    setLoading(true);
    setMessage('');

    console.log(`[DEV] Starting role assignment to: ${selectedRole}`);
    console.log(`[DEV] Current user:`, user);

    try {
      // For development: always simulate role assignment locally since backend likely isn't running
      console.log(`[DEV] Simulating role assignment: ${selectedRole}`);
      
      // Store the selected role in localStorage for development
      if (typeof window !== 'undefined') {
        localStorage.setItem('dev_user_role', selectedRole);
        console.log(`[DEV] Stored role in localStorage: ${selectedRole}`);
        console.log(`[DEV] localStorage value:`, localStorage.getItem('dev_user_role'));
      }
      
      setMessage(`✅ Role assigned to ${selectedRole} (Development Mode) - Refreshing in 2 seconds...`);
      
      // Refresh the page to see changes
      setTimeout(() => {
        console.log(`[DEV] Refreshing page...`);
        if (onRoleUpdated) {
          onRoleUpdated();
        } else {
          window.location.reload();
        }
      }, 2000);
      
      return;

      // Try to make real API call if user has token
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/auth/assign-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user!.accessToken}`,
        },
        body: JSON.stringify({ role: selectedRole }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setMessage(`✅ ${result.message} - Please refresh the page to see changes.`);
      
      onRoleUpdated?.();
    } catch (error: any) {
      console.error('Failed to assign role:', error);
      
      if (error.name === 'AbortError') {
        // Backend timeout - fall back to development mode
        console.log(`[DEV] Backend timeout, simulating role assignment: ${selectedRole}`);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('dev_user_role', selectedRole);
        }
        
        setMessage(`✅ Role assigned to ${selectedRole} (Development Mode) - Refreshing page...`);
        
        setTimeout(() => {
          if (onRoleUpdated) {
            onRoleUpdated();
          } else {
            window.location.reload();
          }
        }, 1000);
      } else {
        setMessage('❌ Failed to assign role. Make sure the backend server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">🔧 Development: Role Assignment</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-yellow-800 mb-2">
            Assign Role to Current User:
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as any)}
            className="block w-full px-3 py-2 border border-yellow-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="GUEST">Guest</option>
            <option value="WINERY_ADMIN">Winery Administrator</option>
            <option value="PLATFORM_ADMIN">Platform Administrator</option>
          </select>
        </div>

        <button
          onClick={handleAssignRole}
          disabled={loading}
          className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Assigning Role...' : `Assign ${selectedRole} Role`}
        </button>

        {message && (
          <div className="text-sm text-yellow-800 bg-yellow-100 p-3 rounded border">
            {message}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-yellow-600">
        <strong>Note:</strong> This is a temporary development tool. Remove before production deployment.
      </div>
    </div>
  );
}