/**
 * Centralized API Configuration
 * Single source of truth for API URL configuration
 */

const FALLBACK_API_URL = 'https://admin-api.classinnews.com';
const ALLOWED_PRODUCTION_HOSTS = new Set(['admin-api.classinnews.com']);

const sanitizeApiUrl = (url?: string): string => {
  const normalized = (url || '').trim().replace(/\/+$/, '');

  if (!normalized) {
    return FALLBACK_API_URL;
  }

  if (process.env.NODE_ENV !== 'production') {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);

    if (
      parsed.protocol === 'https:' &&
      ALLOWED_PRODUCTION_HOSTS.has(parsed.hostname.toLowerCase())
    ) {
      return normalized;
    }
  } catch {
    // Fall through to the known-good production domain below.
  }

  return FALLBACK_API_URL;
};

export const API_URL = (() => {
  return sanitizeApiUrl(
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_ADMIN_API_URL
  );
})();

// Helper to construct API endpoints
export const getApiEndpoint = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

// Export for backward compatibility
export const getApiUrl = () => API_URL;
