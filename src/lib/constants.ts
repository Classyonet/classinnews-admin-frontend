/**
 * Application Constants
 * Centralized constants to avoid magic strings
 */

export const AD_POSITIONS = {
  TOP: 'top',
  SIDEBAR_TOP: 'sidebar_top',
  SIDEBAR_MIDDLE: 'sidebar_middle',
  SIDEBAR_BOTTOM: 'sidebar_bottom',
  CONTENT_TOP: 'content_top',
  CONTENT_BOTTOM: 'content_bottom',
  INLINE_1: 'inline_1',
  INLINE_2: 'inline_2',
  BOTTOM: 'bottom',
} as const;

export const AD_POSITION_LABELS: Record<string, string> = {
  [AD_POSITIONS.TOP]: 'Top Banner',
  [AD_POSITIONS.SIDEBAR_TOP]: 'Sidebar Top',
  [AD_POSITIONS.SIDEBAR_MIDDLE]: 'Sidebar Middle',
  [AD_POSITIONS.SIDEBAR_BOTTOM]: 'Sidebar Bottom',
  [AD_POSITIONS.CONTENT_TOP]: 'Content Top',
  [AD_POSITIONS.CONTENT_BOTTOM]: 'Content Bottom',
  [AD_POSITIONS.INLINE_1]: 'Inline 1',
  [AD_POSITIONS.INLINE_2]: 'Inline 2',
  [AD_POSITIONS.BOTTOM]: 'Bottom Banner',
};

export const PAGE_TYPES = {
  HOMEPAGE: 'homepage',
  ARTICLE: 'article',
} as const;

export const PAGE_TYPE_LABELS: Record<string, string> = {
  [PAGE_TYPES.HOMEPAGE]: 'Homepage',
  [PAGE_TYPES.ARTICLE]: 'Article Page',
};

export const AD_TYPES = {
  CODE: 'code',
  IMAGE: 'image',
} as const;

export const AD_TYPE_LABELS: Record<string, string> = {
  [AD_TYPES.CODE]: 'Ad Code (HTML/JS)',
  [AD_TYPES.IMAGE]: 'Image Ad',
};

// Common status values
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Toast/notification durations (ms)
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 4000,
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_LOGO_TYPES: ['image/jpeg', 'image/png', 'image/svg+xml'],
} as const;

// API response codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
