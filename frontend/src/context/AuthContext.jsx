import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import apiClient, { getAccessToken, setAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await apiClient.get('/users/me');
      setUser(response.data);
      return response.data;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    // Check current session via HttpOnly cookie or session token
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { accessToken, user: loggedInUser } = response.data;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (name, email, password) => {
    const response = await apiClient.post('/auth/register', { name, email, password });
    const { accessToken, user: createdUser } = response.data;
    setAccessToken(accessToken);
    setUser(createdUser);
    return createdUser;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors during logout cleanup
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateUserState = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        initializing,
        login,
        register,
        logout,
        refreshProfile,
        updateUserState,
        hasToken: Boolean(getAccessToken()),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
