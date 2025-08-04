export interface User {
  id: string;
  email: string;
  fullName: string;
  companyName?: string;
  phone?: string;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  companyName?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt: Date;
}
