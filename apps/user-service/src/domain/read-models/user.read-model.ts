/**
 * User Read Models
 * Plain objects for CQRS Query side
 * No domain logic, no getters - just data structures optimized for reads
 */

/**
 * Basic User Read Model
 * Used for list views and basic user information
 */
export interface UserReadModel {
  id: string;
  externalAuthId: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  status: string; // UserStatus enum value
  role: string; // UserRole enum value
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  timezone: string;
  language: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

/**
 * User with Profile Info
 * Denormalized view with role-specific profile information
 */
export interface UserWithProfileReadModel extends UserReadModel {
  // Candidate profile info (if role = CANDIDATE)
  candidateProfile?: {
    id: string;
    title: string | null;
    summary: string | null;
    yearsOfExperience: number | null;
    currentCompany: string | null;
    currentPosition: string | null;
    location: string | null;
    availability: string | null;
    resumeUrl: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
  } | null;
}

/**
 * User Summary Read Model
 * Lightweight model for dropdowns and references
 */
export interface UserSummaryReadModel {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

/**
 * User Permissions Read Model
 * For authorization checks
 */
export interface UserPermissionsReadModel {
  userId: string;
  role: string;
  permissions: string[];
  companyIds: string[]; // For HR users
}
