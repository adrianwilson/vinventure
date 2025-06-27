'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CognitoAuthService, CognitoUser } from '../lib/cognito';
import { AuthService, AuthUser } from '../lib/auth';
import { isFirebaseAvailable } from '../lib/firebase';

interface AuthContextType {
  user: CognitoUser | null;
  loading: boolean;
  isAvailable: boolean;
  signIn: (email: string, password: string) => Promise<CognitoUser>;
  signUp: (email: string, password: string, displayName: string, role?: 'GUEST' | 'WINERY_ADMIN') => Promise<CognitoUser>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isAvailable = CognitoAuthService.isAvailable();

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const accessToken = localStorage.getItem('cognito_access_token');
        if (accessToken) {
          const currentUser = await CognitoAuthService.getCurrentUser(accessToken);
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        localStorage.removeItem('cognito_access_token');
        localStorage.removeItem('cognito_id_token');
        localStorage.removeItem('cognito_refresh_token');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<CognitoUser> => {
    const user = await CognitoAuthService.signIn({ email, password });
    
    // Store tokens for session persistence
    localStorage.setItem('cognito_access_token', user.accessToken);
    localStorage.setItem('cognito_id_token', user.idToken);
    localStorage.setItem('cognito_refresh_token', user.refreshToken);
    
    setUser(user);
    return user;
  };

  const signUp = async (
    email: string, 
    password: string, 
    displayName: string, 
    role: 'GUEST' | 'WINERY_ADMIN' = 'GUEST'
  ): Promise<CognitoUser> => {
    const result = await CognitoAuthService.signUp({ email, password, name: displayName });
    
    if (result.confirmationRequired) {
      throw new Error('Email confirmation required. Please check your email.');
    }
    
    // Auto sign in after successful registration
    return await signIn(email, password);
  };

  const signOut = async (): Promise<void> => {
    const accessToken = localStorage.getItem('cognito_access_token');
    if (accessToken) {
      await CognitoAuthService.signOut(accessToken);
    }
    
    // Clear local storage
    localStorage.removeItem('cognito_access_token');
    localStorage.removeItem('cognito_id_token');
    localStorage.removeItem('cognito_refresh_token');
    
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<void> => {
    return CognitoAuthService.forgotPassword(email);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAvailable,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}