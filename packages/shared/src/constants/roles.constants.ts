export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  HR_VIEWER: 'hr_viewer',
} as const;

export const PERMISSIONS = {
  // User management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Interview management
  INTERVIEW_CREATE: 'interview:create',
  INTERVIEW_READ: 'interview:read',
  INTERVIEW_UPDATE: 'interview:update',
  INTERVIEW_DELETE: 'interview:delete',
  INTERVIEW_PUBLISH: 'interview:publish',
  
  // Results and analytics
  RESULTS_READ: 'results:read',
  RESULTS_EXPORT: 'results:export',
  ANALYTICS_READ: 'analytics:read',
  
  // System administration
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_LOGS: 'system:logs',
  BILLING_MANAGE: 'billing:manage',
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.INTERVIEW_CREATE,
    PERMISSIONS.INTERVIEW_READ,
    PERMISSIONS.INTERVIEW_UPDATE,
    PERMISSIONS.INTERVIEW_DELETE,
    PERMISSIONS.INTERVIEW_PUBLISH,
    PERMISSIONS.RESULTS_READ,
    PERMISSIONS.RESULTS_EXPORT,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.BILLING_MANAGE,
  ],
  [ROLES.HR_MANAGER]: [
    PERMISSIONS.INTERVIEW_CREATE,
    PERMISSIONS.INTERVIEW_READ,
    PERMISSIONS.INTERVIEW_UPDATE,
    PERMISSIONS.INTERVIEW_PUBLISH,
    PERMISSIONS.RESULTS_READ,
    PERMISSIONS.RESULTS_EXPORT,
    PERMISSIONS.ANALYTICS_READ,
  ],
  [ROLES.HR_VIEWER]: [
    PERMISSIONS.INTERVIEW_READ,
    PERMISSIONS.RESULTS_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],
} as const;
