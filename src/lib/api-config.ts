/**
 * Centralized API Configuration
 * Single source of truth for API URL configuration
 */

export const API_URL = (() => {
  const url = 
    process.env.NEXT_PUBLIC_API_URL || 
    process.env.NEXT_PUBLIC_ADMIN_API_URL || 
    'https://classinnews-admin-backend.onrender.com';
  
  // Never use localhost in production
  if (typeof window !== 'undefined' && url.includes('localhost')) {
    return 'https://classinnews-admin-backend.onrender.com';
  }
  
  // Remove trailing slashes
  return url.replace(/\/+$/, '');
})();

// Helper to construct API endpoints
export const getApiEndpoint = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

// Export for backward compatibility
export const getApiUrl = () => API_URL;
