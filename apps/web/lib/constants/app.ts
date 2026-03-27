export const AUTH = {
  TOKEN_REFRESH_INTERVAL_MS: 4 * 60 * 1000, // 4 minutes
  TOKEN_EXPIRY_BUFFER_S: 60, // 1 minute
} as const;

export const INTERVIEW = {
  MAX_VIOLATIONS: 3,
  HEARTBEAT_INTERVAL_MS: 30_000,
  QUESTION_DEBOUNCE_MS: 1_000,
  COMPLETE_REDIRECT_DELAY_MS: 3_000,
} as const;

export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as readonly string[],
} as const;

export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/about',
  '/pricing',
  '/auth/callback',
] as const;

export const API_TIMEOUT_MS = 30_000;
