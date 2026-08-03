import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as authApi from '@/api/auth';
import { getAccessToken } from '@/api/httpClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkAppState = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      // Recover a session on hard refresh via the httpOnly refresh cookie -
      // the in-memory access token is gone, but the cookie survives.
      if (!getAccessToken()) {
        await authApi.refresh();
      }
      const currentUser = await authApi.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      // No valid session - this is the normal "logged out" state, not an error to surface.
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  const login = async (credentials) => {
    const loggedInUser = await authApi.login(credentials);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return loggedInUser;
  };

  const register = async (details) => {
    const newUser = await authApi.register(details);
    setUser(newUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return newUser;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        // Kept for backwards-compat with components that gate on public-settings
        // loading state under the old Base44 flow - there's no separate public
        // settings fetch anymore, so this is always false.
        isLoadingPublicSettings: false,
        authError,
        login,
        register,
        logout,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
