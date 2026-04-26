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
  set2FARequired: (user: { id: string; identifier: string; channel: string; purpose?: string }) => Promise<void>;
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
      const pending2FAUser = await authStore.getPending2FAUser();

      // Pending 2FA takes priority — explicit flag, not inferred
      if (pending2FAUser) {
        setUser(pending2FAUser);
        setIsAuthenticated(false);
        setNeeds2FAVerification(true);
        return;
      }

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
      } else {
        // No tokens and no pending 2FA — logged out
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

  const set2FARequired = async (pendingUser: { id: string; identifier: string; channel: string; purpose?: string }) => {
    // Clear any previous auth state before entering 2FA flow
    await authStore.clearAll();
    await authStore.savePending2FAUser(pendingUser);
    setUser(pendingUser);
    setIsAuthenticated(false);
    setNeeds2FAVerification(true);
  };

  const login = async (tokens: { access_token: string; refresh_token: string; user: any }) => {
    try {
      await authStore.saveToken(tokens.access_token);
      await authStore.saveRefreshToken(tokens.refresh_token);
      await authStore.saveUser(tokens.user);
      await authStore.set2FAVerified(true);
      await authStore.clearPending2FAUser(); // clear any pending 2FA state
      
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
      
      await authStore.clearAll(); // clears pending 2FA too
      setUser(null);
      setIsAuthenticated(false);
      setNeeds2FAVerification(false);
    } catch (error) {
      console.error('Error during logout:', error);
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

    // Periodically verify the session is still valid (every 60 seconds)
    const interval = setInterval(async () => {
      if (!isAuthenticated) return;
      try {
        await apiClient('/users/me', { method: 'GET' });
      } catch (error: any) {
        // Only log out if the token is definitively expired/invalid
        // A plain 401 mid-refresh or network blip should not log the user out
        if (error.isTokenExpired === true) {
          console.log('Periodic auth check: token expired, logging out...');
          await handleTokenExpiration();
        }
      }
    }, 60000);

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
    set2FARequired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};