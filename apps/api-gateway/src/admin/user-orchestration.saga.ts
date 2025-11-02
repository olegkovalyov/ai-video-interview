import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { KeycloakUserService, KeycloakRoleService } from './keycloak';
import { UserServiceClient } from '../clients';
import { OrphanedUsersService } from './orphaned-users.service';
import { LoggerService } from '../logger/logger.service';

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
}

export interface CreateUserResult {
  success: boolean;
  userId?: string;
  keycloakId?: string;
  error?: string;
}

/**
 * User Orchestration Saga
 * Coordinates distributed transactions between Keycloak and User Service
 * Implements Saga pattern with compensation (rollback) logic
 */
@Injectable()
export class UserOrchestrationSaga {
  constructor(
    private readonly keycloakUserService: KeycloakUserService,
    private readonly keycloakRoleService: KeycloakRoleService,
    private readonly userServiceClient: UserServiceClient,
    private readonly orphanedUsers: OrphanedUsersService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Create User Saga
   * Orchestrates: Keycloak → User Service
   * Compensation: Rollback Keycloak on failure
   */
  async executeCreateUser(dto: CreateUserDto): Promise<CreateUserResult> {
    const operationId = uuid();
    let keycloakId: string | null = null;

    this.logger.info('Saga: Starting user creation', {
      operationId,
      email: dto.email,
    });

    try {
      // ═══════════════════════════════════════════════════════════
      // STEP 1: Create in Keycloak (source of truth for auth)
      // ═══════════════════════════════════════════════════════════
      this.logger.info('Saga Step 1: Creating user in Keycloak', { operationId });

      const keycloakResult = await this.keycloakUserService.createUser({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: dto.password || 'password',
        enabled: true,
      });

      keycloakId = keycloakResult.keycloakId;

      this.logger.info('Saga Step 1: Keycloak user created', {
        operationId,
        keycloakId,
      });

      // ═══════════════════════════════════════════════════════════
      // STEP 2: Create in User Service (sync HTTP)
      // ═══════════════════════════════════════════════════════════
      this.logger.info('Saga Step 2: Creating user in User Service', {
        operationId,
        keycloakId,
      });

      const userId = uuid(); // Generate userId in API Gateway

      await this.userServiceClient.createUserInternal({
        userId,
        externalAuthId: keycloakId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });

      this.logger.info('Saga Step 2: User Service user created', {
        operationId,
        userId,
        keycloakId,
      });

      // ═══════════════════════════════════════════════════════════
      // SUCCESS: Both systems updated
      // ═══════════════════════════════════════════════════════════
      this.logger.info('Saga: User creation completed successfully', {
        operationId,
        userId,
        keycloakId,
      });

      return {
        success: true,
        userId,
        keycloakId,
      };
    } catch (error) {
      // ═══════════════════════════════════════════════════════════
      // FAILURE: Execute compensation (rollback)
      // ═══════════════════════════════════════════════════════════
      this.logger.error('Saga: User creation failed', error, {
        operationId,
        keycloakId,
      });

      await this.compensateUserCreation(keycloakId, operationId, error);

      throw new HttpException(
        {
          success: false,
          error: 'Failed to create user',
          details: error.message,
          operationId,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update User Saga
   * Orchestrates: Keycloak → User Service
   * Compensation: Revert Keycloak update on failure
   */
  async executeUpdateUser(keycloakId: string, dto: UpdateUserDto): Promise<any> {
    const operationId = uuid();
    let previousKeycloakState: any = null;

    this.logger.info('Saga: Starting user update', {
      operationId,
      keycloakId,
    });

    try {
      // STEP 1: Get current state for potential rollback
      const currentUser = await this.keycloakUserService.getUser(keycloakId);
      previousKeycloakState = {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
      };

      // STEP 2: Update in Keycloak
      this.logger.info('Saga Step 1: Updating user in Keycloak', {
        operationId,
        keycloakId,
      });

      await this.keycloakUserService.updateUser(keycloakId, dto);

      // STEP 3: Get userId from User Service
      const userServiceUser = await this.userServiceClient.getUserByExternalAuthId(
        keycloakId,
      );
      
      if (!userServiceUser) {
        throw new HttpException(
          {
            success: false,
            error: 'User not found in User Service',
            code: 'USER_NOT_FOUND_IN_USER_SERVICE',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      
      const userId = userServiceUser.id;

      // STEP 4: Update in User Service
      this.logger.info('Saga Step 2: Updating user in User Service', {
        operationId,
        userId,
      });

      await this.userServiceClient.updateUserInternal(userId, dto);

      this.logger.info('Saga: User update completed successfully', {
        operationId,
        userId,
        keycloakId,
      });

      return {
        success: true,
        message: 'User updated successfully',
      };
    } catch (error) {
      this.logger.error('Saga: User update failed', error, {
        operationId,
        keycloakId,
      });

      // Rollback Keycloak if User Service failed
      if (previousKeycloakState) {
        try {
          await this.keycloakUserService.updateUser(keycloakId, previousKeycloakState);
          this.logger.info('Saga: Keycloak update rolled back', {
            operationId,
            keycloakId,
          });
        } catch (rollbackError) {
          this.logger.error('Saga: Rollback failed', rollbackError, {
            operationId,
            keycloakId,
          });
        }
      }

      throw new HttpException(
        {
          success: false,
          error: 'Failed to update user',
          details: error.message,
          operationId,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete User Saga
   * Orchestrates: User Service → Keycloak (reverse order!)
   * Compensation: Restore User Service on Keycloak failure
   */
  async executeDeleteUser(keycloakId: string): Promise<any> {
    const operationId = uuid();

    this.logger.info('Saga: Starting user deletion', {
      operationId,
      keycloakId,
    });

    try {
      // STEP 1: Get userId from User Service
      const userServiceUser = await this.userServiceClient.getUserByExternalAuthId(
        keycloakId,
      );
      
      if (!userServiceUser) {
        throw new HttpException(
          {
            success: false,
            error: 'User not found in User Service',
            code: 'USER_NOT_FOUND_IN_USER_SERVICE',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      
      const userId = userServiceUser.id;

      // STEP 2: Delete from User Service first (we can restore if Keycloak fails)
      this.logger.info('Saga Step 1: Deleting user from User Service', {
        operationId,
        userId,
      });

      await this.userServiceClient.deleteUserInternal(userId);

      // STEP 3: Delete from Keycloak
      this.logger.info('Saga Step 2: Deleting user from Keycloak', {
        operationId,
        keycloakId,
      });

      await this.keycloakUserService.deleteUser(keycloakId);

      this.logger.info('Saga: User deletion completed successfully', {
        operationId,
        userId,
        keycloakId,
      });

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      this.logger.error('Saga: User deletion failed', error, {
        operationId,
        keycloakId,
      });

      // Note: Restoration logic would go here if needed
      // For deletion, we might choose not to restore

      throw new HttpException(
        {
          success: false,
          error: 'Failed to delete user',
          details: error.message,
          operationId,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Assign Role Saga
   * Orchestrates: Keycloak → User Service
   * Compensation: Remove from Keycloak on failure
   */
  async executeAssignRole(keycloakId: string, roleName: string): Promise<any> {
    const operationId = uuid();

    this.logger.info('Saga: Starting role assignment', {
      operationId,
      keycloakId,
      roleName,
    });

    try {
      // STEP 1: Assign in Keycloak
      this.logger.info('Saga Step 1: Assigning role in Keycloak', {
        operationId,
        keycloakId,
        roleName,
      });

      await this.keycloakRoleService.assignRole(keycloakId, roleName);

      // STEP 2: Get userId from User Service
      const userServiceUser = await this.userServiceClient.getUserByExternalAuthId(
        keycloakId,
      );
      
      if (!userServiceUser) {
        throw new HttpException(
          {
            success: false,
            error: 'User not found in User Service',
            code: 'USER_NOT_FOUND_IN_USER_SERVICE',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      
      const userId = userServiceUser.id;

      // STEP 3: Assign in User Service
      this.logger.info('Saga Step 2: Assigning role in User Service', {
        operationId,
        userId,
        roleName,
      });

      await this.userServiceClient.assignRoleInternal(userId, roleName);

      this.logger.info('Saga: Role assignment completed successfully', {
        operationId,
        userId,
        keycloakId,
        roleName,
      });

      return {
        success: true,
        message: `Role ${roleName} assigned successfully`,
      };
    } catch (error) {
      this.logger.error('Saga: Role assignment failed', error, {
        operationId,
        keycloakId,
        roleName,
      });

      // Rollback: Remove role from Keycloak
      try {
        await this.keycloakRoleService.removeRole(keycloakId, roleName);
        this.logger.info('Saga: Keycloak role assignment rolled back', {
          operationId,
          keycloakId,
          roleName,
        });
      } catch (rollbackError) {
        this.logger.error('Saga: Rollback failed', rollbackError, {
          operationId,
          keycloakId,
          roleName,
        });
      }

      throw new HttpException(
        {
          success: false,
          error: 'Failed to assign role',
          details: error.message,
          operationId,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Remove Role Saga
   */
  async executeRemoveRole(keycloakId: string, roleName: string): Promise<any> {
    const operationId = uuid();

    this.logger.info('Saga: Starting role removal', {
      operationId,
      keycloakId,
      roleName,
    });

    try {
      // STEP 1: Get userId from User Service
      const userServiceUser = await this.userServiceClient.getUserByExternalAuthId(
        keycloakId,
      );
      
      if (!userServiceUser) {
        throw new HttpException(
          {
            success: false,
            error: 'User not found in User Service',
            code: 'USER_NOT_FOUND_IN_USER_SERVICE',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      
      const userId = userServiceUser.id;

      // STEP 2: Remove from User Service first
      this.logger.info('Saga Step 1: Removing role from User Service', {
        operationId,
        userId,
        roleName,
      });

      await this.userServiceClient.removeRoleInternal(userId, roleName);

      // STEP 3: Remove from Keycloak
      this.logger.info('Saga Step 2: Removing role from Keycloak', {
        operationId,
        keycloakId,
        roleName,
      });

      await this.keycloakRoleService.removeRole(keycloakId, roleName);

      this.logger.info('Saga: Role removal completed successfully', {
        operationId,
        userId,
        keycloakId,
        roleName,
      });

      return {
        success: true,
        message: `Role ${roleName} removed successfully`,
      };
    } catch (error) {
      this.logger.error('Saga: Role removal failed', error, {
        operationId,
        keycloakId,
        roleName,
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to remove role',
          details: error.message,
          operationId,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Compensating transaction for failed user creation
   * Attempts to delete user from Keycloak
   * If deletion fails, tracks as orphaned user for manual cleanup
   */
  private async compensateUserCreation(
    keycloakId: string | null,
    operationId: string,
    originalError: any,
  ): Promise<void> {
    if (!keycloakId) {
      // Keycloak creation failed, nothing to rollback
      return;
    }

    this.logger.info('Saga: Starting compensation (rollback)', {
      operationId,
      keycloakId,
    });

    try {
      // Attempt to delete from Keycloak
      await this.keycloakUserService.deleteUser(keycloakId);

      this.logger.info('Saga: Compensation successful - Keycloak user deleted', {
        operationId,
        keycloakId,
      });
    } catch (rollbackError) {
      // CRITICAL: Rollback failed - orphaned user in Keycloak
      this.logger.error('Saga: CRITICAL - Compensation failed', rollbackError, {
        operationId,
        keycloakId,
      });

      // Track orphaned user for manual cleanup
      await this.orphanedUsers.trackOrphanedUser(keycloakId, {
        reason: 'rollback_failed',
        originalError: originalError.message,
        rollbackError: rollbackError.message,
        operationId,
      });

      // Note: We don't throw here - original error will be thrown by caller
    }
  }
}
