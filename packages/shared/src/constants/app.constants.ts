export const APP_CONFIG = {
  JWT: {
    ACCESS_TOKEN_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '30d',
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
  INTERVIEW: {
    DEFAULT_QUESTION_TIME_LIMIT: 120, // seconds
    MAX_QUESTIONS_PER_INTERVIEW: 20,
    PUBLIC_LINK_EXPIRES_IN_DAYS: 30,
  },
  MEDIA: {
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_VIDEO_FORMATS: ['mp4', 'webm', 'mov'],
    ALLOWED_AUDIO_FORMATS: ['mp3', 'wav', 'webm'],
  },
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
  },
  INTERVIEWS: {
    BASE: '/interviews',
    QUESTIONS: (id: string) => `/interviews/${id}/questions`,
    PUBLIC_LINK: (id: string) => `/interviews/${id}/public-link`,
  },
  PUBLIC: {
    INTERVIEW: (token: string) => `/public/interview/${token}`,
    START_SESSION: (token: string) => `/public/interview/${token}/start`,
    SUBMIT_RESPONSE: (token: string) => `/public/interview/${token}/response`,
    COMPLETE: (token: string) => `/public/interview/${token}/complete`,
  },
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  INTERVIEW_NOT_FOUND: 'Interview not found',
  INTERVIEW_EXPIRED: 'Interview has expired',
  SESSION_NOT_FOUND: 'Session not found',
  INVALID_TOKEN: 'Invalid token',
} as const;
