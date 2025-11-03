export type UserRole = 'admin' | 'hr' | 'candidate';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface UserFilters {
  search: string;
  role: UserRole | 'all';
  status: UserStatus | 'all';
}

export interface UserStats {
  total: number;
  active: number;
  suspended: number;
  admins: number;
  hrs: number;
}
