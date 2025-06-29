'use client';

import { useState } from 'react';

interface EmailVerificationFormProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResendCode?: () => Promise<void>;
  isLoading?: boolean;
}

export function EmailVerificationForm({ 
  email, 
  onVerify, 
  onResendCode,
  isLoading = false 
}: EmailVerificationFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setError('');
    setIsVerifying(true);

    try {
      await onVerify(code.trim());
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!onResendCode) return;

    setError('');
    setIsResending(true);

    try {
      await onResendCode();
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-xl">📧</span>
        </div>
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-gray-600">
          We've sent a verification code to{' '}
          <span className="font-medium">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Verification Code
          </label>
          <input
            id="code"
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-lg tracking-widest"
            disabled={isLoading || isVerifying}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || isVerifying || !code.trim()}
        >
          {isVerifying ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Didn't receive the code?
        </p>
        {onResendCode && (
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading || isResending}
            className="text-sm text-purple-600 hover:text-purple-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? 'Sending...' : 'Resend Code'}
          </button>
        )}
      </div>
    </div>
  );
}