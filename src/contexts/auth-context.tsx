'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import {
  ADMIN_SESSION_PLACEHOLDER,
  clearStoredAdminSession,
  fetchCurrentAdmin,
  getStoredAdminUser,
  logoutAdminSession,
  storeAdminUser,
} from '@/lib/admin-session';

interface User {
  id: string;
  email?: string | null;
  username?: string | null;
  role?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedUser = getStoredAdminUser();
    if (cachedUser) {
      setUser(cachedUser);
      setToken(ADMIN_SESSION_PLACEHOLDER);
    }

    const checkAuth = async () => {
      try {
        const currentUser = await fetchCurrentAdmin();
        if (currentUser) {
          setUser(currentUser as User);
          setToken(ADMIN_SESSION_PLACEHOLDER);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        clearStoredAdminSession();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const userData = response.data?.user || response.user;
      storeAdminUser(userData);
      setToken(ADMIN_SESSION_PLACEHOLDER);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await logoutAdminSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
