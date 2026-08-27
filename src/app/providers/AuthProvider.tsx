import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { User, LoginCredentials, RegisterPayload, AuthResponse } from '../../types';
import { apiClient } from '../../lib/api/client';
import { API_ENDPOINTS } from '../../lib/api/endpoints';
import { tokenStorage } from '../../lib/storage/token.storage';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const mergeGuestCart = useCallback(async () => {
    try {
      const sessionId = localStorage.getItem('hayat_session_id');
      if (sessionId) {
        await apiClient.post(API_ENDPOINTS.CART.MERGE, { sessionId });
        tokenStorage.removeSessionId();
      }
    } catch {
      // Silently fail - cart merge is not critical
    }
  }, []);

  const handleAuthResponse = useCallback(
    async (data: AuthResponse) => {
      tokenStorage.setAccessToken(data.accessToken);
      tokenStorage.setRefreshToken(data.refreshToken);
      setUser(data.user);
      await mergeGuestCart();
    },
    [mergeGuestCart]
  );

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
      await handleAuthResponse(data);
      toast.success(`Bienvenue ${data.user.firstName || data.user.email} !`);
    },
    [handleAuthResponse]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, payload);
      await handleAuthResponse(data);
      toast.success('Compte créé avec succès !');
    },
    [handleAuthResponse]
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
      }
    } catch {
      // Ignore errors during logout
    } finally {
      tokenStorage.clearAll();
      setUser(null);
      toast.success('Déconnexion réussie');
    }
  }, []);

  // Check existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
        setUser(data);
      } catch {
        tokenStorage.clearAll();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
