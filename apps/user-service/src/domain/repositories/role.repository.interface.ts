/**
 * Role data structure
 */
export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role Repository Interface
 * Manages role data (separate from User aggregate)
 */
export interface IRoleRepository {
  /**
   * Find role by ID
   */
  findById(id: string): Promise<Role | null>;

  /**
   * Find role by name
   */
  findByName(name: string): Promise<Role | null>;

  /**
   * List all roles
   */
  findAll(): Promise<Role[]>;

  /**
   * Get user roles
   */
  findByUserId(userId: string): Promise<Role[]>;

  /**
   * Assign role to user
   */
  assignToUser(userId: string, roleId: string, assignedBy: string): Promise<void>;

  /**
   * Remove role from user
   */
  removeFromUser(userId: string, roleId: string): Promise<void>;

  /**
   * Check if user has role
   */
  userHasRole(userId: string, roleId: string): Promise<boolean>;
}
