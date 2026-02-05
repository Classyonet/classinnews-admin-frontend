// Prefer the standard NEXT_PUBLIC_API_URL for compatibility, fall back to the admin-specific
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://classinnews-admin-backend.onrender.com';
const API_URL = RAW_API_URL.replace(/\/+$/,'');

interface ApiFetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch(endpoint: string, options: ApiFetchOptions = {}) {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const base = API_URL;
  const path = endpoint.startsWith('/api') && base.endsWith('/api') ? endpoint.replace(/^\/api/, '') : endpoint;
  const response = await fetch(`${base}${path}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe: async (token: string) => {
    return apiFetch('/api/auth/me', { token });
  },
};

// Users API
export const usersAPI = {
  getAll: async (token: string, params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/users?${query}`, { token });
  },

  getById: async (token: string, id: string) => {
    return apiFetch(`/api/users/${id}`, { token });
  },

  update: async (token: string, id: string, data: any) => {
    return apiFetch(`/api/users/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  },

  delete: async (token: string, id: string) => {
    return apiFetch(`/api/users/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  getStats: async (token: string, id: string) => {
    return apiFetch(`/api/users/${id}/stats`, { token });
  },
};

// Articles API
export const articlesAPI = {
  getAll: async (token: string, params?: any) => {
    // Remove undefined/null params so we don't send e.g. status=undefined
    const safeParams: Record<string, string> = {};
    if (params) {
      Object.keys(params).forEach((k) => {
        const v = params[k];
        if (v !== undefined && v !== null) safeParams[k] = String(v);
      });
    }
    const query = new URLSearchParams(safeParams).toString();
    return apiFetch(`/api/articles${query ? `?${query}` : ''}`, { token });
  },

  getById: async (token: string, id: string) => {
    return apiFetch(`/api/articles/${id}`, { token });
  },

  updateStatus: async (token: string, id: string, status: string) => {
    return apiFetch(`/api/articles/${id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    });
  },

  delete: async (token: string, id: string) => {
    return apiFetch(`/api/articles/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};

// Moderation API
export const moderationAPI = {
  getQueue: async (token: string, params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/moderation/queue?${query}`, { token });
  },

  review: async (token: string, data: any) => {
    return apiFetch('/api/moderation/review', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  },

  getStats: async (token: string) => {
    return apiFetch('/api/moderation/stats', { token });
  },
};

// Analytics API
export const analyticsAPI = {
  getOverview: async (token: string, period?: string) => {
    const query = period ? `?period=${period}` : '';
    return apiFetch(`/api/analytics/overview${query}`, { token });
  },

  getTopArticles: async (token: string, params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/analytics/top-articles?${query}`, { token });
  },

  getTopCreators: async (token: string, limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return apiFetch(`/api/analytics/top-creators${query}`, { token });
  },

  getCategories: async (token: string) => {
    return apiFetch('/api/analytics/categories', { token });
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async (token: string) => {
    return apiFetch('/api/categories', { token });
  },

  create: async (token: string, data: any) => {
    return apiFetch('/api/categories', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  },

  update: async (token: string, id: string, data: any) => {
    return apiFetch(`/api/categories/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  },

  delete: async (token: string, id: string) => {
    return apiFetch(`/api/categories/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (token: string) => {
    return apiFetch('/api/dashboard/stats', { token });
  },
};

// Settings API
export const settingsAPI = {
  getAll: async (token: string, category?: string) => {
    const query = category ? `?category=${category}` : '';
    return apiFetch(`/api/settings${query}`, { token });
  },

  update: async (token: string, key: string, data: any) => {
    try {
      const result = await apiFetch(`/api/settings/${key}`, {
        method: 'PUT',
        token,
        body: JSON.stringify(data),
      });
      return result;
    } catch (error: any) {
      console.error(`Failed to update setting ${key}:`, error);
      throw new Error(error.message || `Failed to update setting: ${key}`);
    }
  },

  getActivityLogs: async (token: string, params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/settings/activity-logs?${query}`, { token });
  },
};
