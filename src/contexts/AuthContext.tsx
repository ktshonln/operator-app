import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authStore } from '../api/authStore';
import { apiClient } from '../api/client';

interface AuthContextType {
  isAuthenticated: boolean;
  needs2FAVerification: boolean;
  user: any;
  loading: boolean;
  login: (tokens: { access_token: string; refresh_token: string; user: any }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needs2FAVerification, setNeeds2FAVerification] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      const token = await authStore.getToken();
      const refreshToken = await authStore.getRefreshToken();
      const storedUser = await authStore.getUser();
      
      const hasTokens = !!(token && refreshToken);
      
      if (hasTokens) {
        // Verify token is still valid by making a test API call
        try {
          const currentUser = await apiClient('/users/me', { method: 'GET' });
          setUser(currentUser);
          setIsAuthenticated(true);
          setNeeds2FAVerification(false);
          
          // Update stored user data if it's different
          if (JSON.stringify(currentUser) !== JSON.stringify(storedUser)) {
            await authStore.saveUser(currentUser);
          }
        } catch (error: any) {
          console.log('Token validation failed:', error.message);
          
          if (error.isTokenExpired) {
            // Token expired, clear everything and redirect to login
            await logout();
          } else {
            // Other error, but tokens exist - might be network issue
            setUser(storedUser);
            setIsAuthenticated(true);
            setNeeds2FAVerification(false);
          }
        }
      } else if (storedUser && !hasTokens) {
        // User exists but no tokens - might be in 2FA flow
        setUser(storedUser);
        setIsAuthenticated(false);
        setNeeds2FAVerification(true);
      } else {
        // No user and no tokens - logged out
        setUser(null);
        setIsAuthenticated(false);
        setNeeds2FAVerification(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
      setNeeds2FAVerification(false);
    }
  };

  const login = async (tokens: { access_token: string; refresh_token: string; user: any }) => {
    try {
      await authStore.saveToken(tokens.access_token);
      await authStore.saveRefreshToken(tokens.refresh_token);
      await authStore.saveUser(tokens.user);
      await authStore.set2FAVerified(true);
      
      setUser(tokens.user);
      setIsAuthenticated(true);
      setNeeds2FAVerification(false);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Try to call logout API if we have a token
      const token = await authStore.getToken();
      if (token) {
        try {
          await apiClient('/auth/logout', { method: 'POST' });
        } catch (error) {
          // Ignore logout API errors - we're clearing tokens anyway
          console.log('Logout API call failed, but continuing with local logout');
        }
      }
      
      await authStore.clearAll();
      setUser(null);
      setIsAuthenticated(false);
      setNeeds2FAVerification(false);
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, clear the local state
      setUser(null);
      setIsAuthenticated(false);
      setNeeds2FAVerification(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      await checkAuthStatus();
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Listen for token expiration events
  useEffect(() => {
    const handleTokenExpiration = async () => {
      console.log('Token expired, logging out...');
      await logout();
    };

    // Check auth status periodically (every 60 seconds instead of 30)
    const interval = setInterval(async () => {
      if (isAuthenticated) {
        try {
          // Make a lightweight API call to check if tokens are still valid
          await apiClient('/users/me', { method: 'GET' });
        } catch (error: any) {
          if (error.isTokenExpired || error.status === 401) {
            console.log('Periodic auth check failed, tokens expired');
            await handleTokenExpiration();
          }
        }
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value: AuthContextType = {
    isAuthenticated,
    needs2FAVerification,
    user,
    loading,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};