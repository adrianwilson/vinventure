'use client';

import { useState } from 'react';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

type AuthMode = 'login' | 'register' | 'forgot-password';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');

  const renderAuthForm = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm
            onToggleMode={() => setMode('register')}
            onForgotPassword={() => setMode('forgot-password')}
          />
        );
      case 'register':
        return (
          <RegisterForm
            onToggleMode={() => setMode('login')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onBack={() => setMode('login')}
          />
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Welcome Back';
      case 'register':
        return 'Join VinVenture';
      case 'forgot-password':
        return 'Reset Password';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-purple-900 mb-2">VinVenture</h1>
          <h2 className="text-2xl font-semibold text-gray-900">{getTitle()}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'login' && 'Sign in to discover amazing wine experiences'}
            {mode === 'register' && 'Create your account to start exploring wineries'}
            {mode === 'forgot-password' && 'Enter your email to reset your password'}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          {renderAuthForm()}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}