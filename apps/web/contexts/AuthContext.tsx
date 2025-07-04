'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CognitoAuthService, CognitoUser } from '../lib/cognito';

interface AuthContextType {
  user: CognitoUser | null;
  loading: boolean;
  isAvailable: boolean;
  signIn: (email: string, password: string) => Promise<CognitoUser>;
  signUp: (email: string, password: string, displayName: string, role?: 'GUEST' | 'WINERY_ADMIN') => Promise<{ user: any; confirmationRequired: boolean }>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During SSR, provide default values instead of throwing
    if (typeof window === 'undefined') {
      return {
        user: null,
        loading: false,
        isAvailable: false,
        signIn: async () => { throw new Error('Cannot sign in during SSR'); },
        signUp: async () => { throw new Error('Cannot sign up during SSR'); },
        confirmEmail: async () => { throw new Error('Cannot confirm email during SSR'); },
        signOut: async () => { throw new Error('Cannot sign out during SSR'); },
        resetPassword: async () => { throw new Error('Cannot reset password during SSR'); },
        refreshSession: async () => { throw new Error('Cannot refresh session during SSR'); },
      } as AuthContextType;
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [loading, setLoading] = useState(typeof window === 'undefined' ? false : true);
  const isAvailable = typeof window === 'undefined' ? false : CognitoAuthService.isAvailable();

  useEffect(() => {
    // Check for existing session on mount (only in browser)
    const checkSession = async () => {
      try {
        if (typeof window !== 'undefined') {
          const accessToken = localStorage.getItem('cognito_access_token');
          if (accessToken) {
            try {
              const currentUser = await CognitoAuthService.getCurrentUser(accessToken);
              setUser(currentUser);
            } catch (error) {
              // Try to refresh tokens if access token is expired
              console.log('Access token expired, attempting refresh...');
              await refreshSession();
            }
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
        clearTokens();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const clearTokens = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cognito_access_token');
      localStorage.removeItem('cognito_id_token');
      localStorage.removeItem('cognito_refresh_token');
    }
  };

  const signIn = async (email: string, password: string): Promise<CognitoUser> => {
    const user = await CognitoAuthService.signIn({ email, password });
    
    // Store tokens for session persistence (only in browser)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cognito_access_token', user.accessToken);
      localStorage.setItem('cognito_id_token', user.idToken);
      localStorage.setItem('cognito_refresh_token', user.refreshToken);
    }
    
    setUser(user);
    return user;
  };

  const signUp = async (
    email: string, 
    password: string, 
    displayName: string, 
    role: 'GUEST' | 'WINERY_ADMIN' = 'GUEST'
  ): Promise<{ user: any; confirmationRequired: boolean }> => {
    return await CognitoAuthService.signUp({ email, password, name: displayName });
  };

  const confirmEmail = async (email: string, code: string): Promise<void> => {
    await CognitoAuthService.confirmSignUp(email, code);
  };

  const signOut = async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('cognito_access_token');
      if (accessToken) {
        await CognitoAuthService.signOut(accessToken);
      }
    }
    
    // Clear local storage
    clearTokens();
    
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<void> => {
    return CognitoAuthService.forgotPassword(email);
  };

  const refreshSession = async (): Promise<void> => {
    if (typeof window === 'undefined') {
      throw new Error('Cannot refresh session during server-side rendering');
    }

    const refreshToken = localStorage.getItem('cognito_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const tokens = await CognitoAuthService.refreshTokens(refreshToken);
      
      // Update stored tokens
      localStorage.setItem('cognito_access_token', tokens.accessToken);
      localStorage.setItem('cognito_id_token', tokens.idToken);
      
      // Get updated user info
      const currentUser = await CognitoAuthService.getCurrentUser(tokens.accessToken);
      setUser(currentUser);
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearTokens();
      setUser(null);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAvailable,
    signIn,
    signUp,
    confirmEmail,
    signOut,
    resetPassword,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}