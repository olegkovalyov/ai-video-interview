import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { UserServiceClient } from '../../../modules/user-service/clients/user-service.client';
import { KeycloakUserService } from '../../../modules/user-service/admin/keycloak';
import { LoggerService } from '../../logging/logger.service';

export interface EnsureUserExistsDto {
  keycloakId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface UserResult {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  isNew: boolean;
}

/**
 * Registration Saga
 * Ensures user exists in User Service on first login
 * Uses synchronous HTTP calls for strong consistency
 * 
 * Flow:
 * 1. User logs in via Keycloak (OAuth2)
 * 2. Check if user exists in User Service
 * 3. If not - create user synchronously
 * 4. Return user profile (with isNew flag for onboarding)
 */
@Injectable()
export class RegistrationSaga {
  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly keycloakUserService: KeycloakUserService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Ensure user exists in User Service
   * Called on every login (fast path if user exists)
   * Creates user on first login (sync, +100ms)
   */
  async ensureUserExists(dto: EnsureUserExistsDto): Promise<UserResult> {
    const operationId = uuid();

    this.logger.info('RegistrationSaga: Ensuring user exists', {
      operationId,
      keycloakId: dto.keycloakId,
      email: dto.email,
    });

    try {
      // ═══════════════════════════════════════════════════════════
      // STEP 1: Check if user already exists (fast path)
      // ═══════════════════════════════════════════════════════════
      const existingUser = await this.checkUserExists(dto.keycloakId);

      if (existingUser) {
        this.logger.info('RegistrationSaga: User already exists', {
          operationId,
          userId: existingUser.userId,
          email: existingUser.email,
        });

        return {
          userId: existingUser.userId,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          isNew: false, // Returning user
        };
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 2: User doesn't exist - create it (first login)
      // ═══════════════════════════════════════════════════════════
      this.logger.info('RegistrationSaga: Creating new user (first login)', {
        operationId,
        keycloakId: dto.keycloakId,
        email: dto.email,
      });

      const userId = uuid();

      // STEP 2.1: Create user in User Service
      const newUser = await this.userServiceClient.createUserInternal({
        userId,
        externalAuthId: dto.keycloakId,
        email: dto.email,
        firstName: dto.firstName || 'Unknown',
        lastName: dto.lastName || 'User',
      });

      if (!newUser || !newUser.data || !newUser.data.userId) {
        throw new Error('User Service returned empty response after user creation');
      }

      this.logger.info('RegistrationSaga: User created successfully', {
        operationId,
        userId,
        email: dto.email,
        isFirstLogin: true,
      });

      // STEP 2.2: Auto-assign 'candidate' role for new users
      try {
        this.logger.info('RegistrationSaga: Assigning candidate role', {
          operationId,
          userId,
        });

        await this.userServiceClient.assignRoleInternal(userId, 'candidate');

        this.logger.info('RegistrationSaga: Candidate role assigned', {
          operationId,
          userId,
        });
      } catch (roleError) {
        // If role assignment fails, we need to rollback user creation
        this.logger.error('RegistrationSaga: Failed to assign candidate role', {
          errorMessage: roleError.message,
          errorStack: roleError.stack,
          errorResponse: roleError.response?.data,
          operationId,
          userId,
        });

        // Compensation: Delete user from User Service
        try {
          await this.userServiceClient.deleteUserInternal(userId);
          this.logger.info('RegistrationSaga: User deleted from User Service (role assignment failed)', {
            operationId,
            userId,
          });
        } catch (deleteError) {
          this.logger.error('RegistrationSaga: Failed to delete user after role assignment failure', {
            errorMessage: deleteError.message,
            operationId,
            userId,
          });
        }

        throw roleError; // Re-throw to trigger Keycloak compensation
      }

      return {
        userId: newUser.data.userId,
        email: newUser.data.email,
        firstName: newUser.data.firstName,
        lastName: newUser.data.lastName,
        isNew: true, // First login - can show onboarding!
      };
    } catch (error) {
      this.logger.error('RegistrationSaga: Failed to ensure user exists', error, {
        operationId,
        keycloakId: dto.keycloakId,
        email: dto.email,
      });

      // ═══════════════════════════════════════════════════════════
      // COMPENSATION: User created in Keycloak but NOT in User Service
      // ═══════════════════════════════════════════════════════════
      // PROBLEM: User self-registered via OAuth - we can't delete from Keycloak
      // because user is already authenticated and has active session.
      //
      // SOLUTION OPTIONS:
      // 1. Delete from Keycloak (harsh - user will get 401 on next request)
      // 2. Mark as orphaned and retry on next login
      // 3. Keep user logged in but show error (current state is inconsistent)
      //
      // For now: We try to delete from Keycloak to maintain consistency.
      // User will need to re-register.

      try {
        this.logger.warn('RegistrationSaga: COMPENSATION - Deleting user from Keycloak to restore consistency', {
          operationId,
          keycloakId: dto.keycloakId,
          email: dto.email,
        });

        // Delete from Keycloak to prevent orphaned state
        await this.keycloakUserService.deleteUser(dto.keycloakId);

        this.logger.info('RegistrationSaga: Compensation successful - user deleted from Keycloak', {
          operationId,
          keycloakId: dto.keycloakId,
        });
      } catch (compensationError) {
        this.logger.error('RegistrationSaga: CRITICAL - Compensation failed! ORPHANED USER in Keycloak', compensationError, {
          operationId,
          keycloakId: dto.keycloakId,
          email: dto.email,
          action: 'MANUAL_CLEANUP_REQUIRED',
        });
      }

      throw new HttpException(
        {
          success: false,
          error: 'Failed to initialize user profile',
          details: 'User Service is temporarily unavailable. Please contact support.',
          code: 'USER_SERVICE_UNAVAILABLE',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Check if user exists in User Service
   * Returns user profile or null if not found
   */
  private async checkUserExists(
    keycloakId: string,
  ): Promise<{
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null> {
    try {
      const response = await this.userServiceClient.getUserByExternalAuthId(keycloakId);

      // UserServiceClient already returns response.data from axios
      if (response && response.id) {
        return {
          userId: response.id, // User Service returns 'id' not 'userId'
          email: response.email,
          firstName: response.firstName || 'Unknown',
          lastName: response.lastName || 'User',
        };
      }

      return null;
    } catch (error) {
      // 404 = user doesn't exist (expected for first login)
      if (error.response?.status === 404 || error.status === 404) {
        return null;
      }

      // Other errors should bubble up
      throw error;
    }
  }
}
