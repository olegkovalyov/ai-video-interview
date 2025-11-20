/**
 * Company Read Models
 * Plain objects for CQRS Query side
 * No domain logic, no getters - just data structures optimized for reads
 */

/**
 * Basic Company Read Model
 * Used for list views and basic company information
 */
export interface CompanyReadModel {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  industry: string | null;
  size: string | null; // CompanySize enum value
  location: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Company with Users Count
 * Used when we need to show how many users belong to this company
 */
export interface CompanyWithUsersReadModel extends CompanyReadModel {
  usersCount: number;
}

/**
 * Company with Creator Info
 * Denormalized view with creator user information
 */
export interface CompanyWithCreatorReadModel extends CompanyReadModel {
  creatorName: string | null;
  creatorEmail: string | null;
}

/**
 * Full Company Read Model
 * Includes all related information for detailed views
 */
export interface CompanyDetailReadModel extends CompanyReadModel {
  usersCount: number;
  creatorName: string | null;
  creatorEmail: string | null;
}
