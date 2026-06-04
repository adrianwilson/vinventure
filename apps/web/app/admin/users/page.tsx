'use client';

import { useState } from 'react';
import { CognitoAuthService } from '../../../lib/cognito';

interface UserInfo {
  username?: string;
  attributes: Record<string, string>;
  userStatus?: string;
  enabled?: boolean;
  userCreateDate?: Date;
  userLastModifiedDate?: Date;
}

export default function AdminUsersPage() {
  const [email, setEmail] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleGetUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setUserInfo(null);

    try {
      const user = await CognitoAuthService.adminGetUser(email);
      setUserInfo(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUser = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await CognitoAuthService.adminConfirmSignUp(email);
      setMessage('User confirmed successfully!');
      // Refresh user info
      const user = await CognitoAuthService.adminGetUser(email);
      setUserInfo(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await CognitoAuthService.resendConfirmationCode(email);
      setMessage('Confirmation code resent successfully!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin - User Management</h1>
        
        <form onSubmit={handleGetUser} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              User Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Get User Info'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        {userInfo && (
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">User Information</h2>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <p><strong>Email:</strong> {userInfo.attributes?.email}</p>
              <p><strong>Name:</strong> {userInfo.attributes?.name}</p>
              <p><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  userInfo.userStatus === 'CONFIRMED' 
                    ? 'bg-green-100 text-green-800'
                    : userInfo.userStatus === 'UNCONFIRMED'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {userInfo.userStatus}
                </span>
              </p>
              <p><strong>Enabled:</strong> {userInfo.enabled ? 'Yes' : 'No'}</p>
              <p><strong>Created:</strong> {userInfo.userCreateDate?.toLocaleString() ?? 'N/A'}</p>
              <p><strong>Last Modified:</strong> {userInfo.userLastModifiedDate?.toLocaleString() ?? 'N/A'}</p>
            </div>

            {userInfo.userStatus === 'UNCONFIRMED' && (
              <div className="space-y-2">
                <button
                  onClick={handleConfirmUser}
                  disabled={loading}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? 'Confirming...' : 'Admin Confirm User'}
                </button>
                
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Resend Confirmation Code'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-sm text-gray-600">
          <h3 className="font-medium mb-2">Available Actions:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Get User Info:</strong> View user status and details</li>
            <li><strong>Admin Confirm:</strong> Manually confirm unconfirmed users</li>
            <li><strong>Resend Code:</strong> Send new confirmation code to user&apos;s email</li>
          </ul>
        </div>
      </div>
    </div>
  );
}