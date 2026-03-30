'use client';

import { API_URL } from './api-config';

export type AdminUser = {
  id: string;
  email?: string | null;
  username?: string | null;
  role?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt?: string | null;
};

export const ADMIN_AUTH_EVENT = 'admin-auth-changed';
export const ADMIN_SESSION_PLACEHOLDER = '__admin_session__';

const ADMIN_USER_KEY = 'admin_user';
const LEGACY_ADMIN_TOKEN_KEY = 'admin_token';

function notifyAdminAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
  }
}

export function getStoredAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    window.localStorage.removeItem(ADMIN_USER_KEY);
    return null;
  }
}

export function storeAdminUser(user: AdminUser) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  window.localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
  notifyAdminAuthChanged();
}

export function clearStoredAdminSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(ADMIN_USER_KEY);
  window.localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
  notifyAdminAuthChanged();
}

export async function fetchCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearStoredAdminSession();
      }
      return null;
    }

    const data = await response.json();
    const user = (data?.user || data?.data?.user || data?.data || data) as AdminUser | undefined;
    if (!user?.id) {
      return null;
    }

    storeAdminUser(user);
    return user;
  } catch {
    return getStoredAdminUser();
  }
}

export async function logoutAdminSession() {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Clear client state even if the network call fails.
  } finally {
    clearStoredAdminSession();
  }
}

export async function adminAuthFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = input.startsWith('http://') || input.startsWith('https://')
    ? input
    : `${API_URL}${input.startsWith('/') ? input : `/${input}`}`;

  return fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.headers || {}),
    },
  });
}
