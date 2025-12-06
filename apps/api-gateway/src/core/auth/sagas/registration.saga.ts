import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { UserServiceClient } from '../../../modules/user-service/clients/user-service.client';
import { KeycloakUserService, KeycloakRoleService } from '../../../modules/user-service/admin/keycloak';
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
    private readonly keycloakRoleService: KeycloakRoleService,
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

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Check if user already exists (fast path)
    // If user-service is unavailable - just throw 503, DO NOT delete from Keycloak!
    // ═══════════════════════════════════════════════════════════
    let existingUser: { userId: string; email: string; firstName: string; lastName: string } | null;

    try {
      existingUser = await this.checkUserExists(dto.keycloakId);
    } catch (checkError) {
      // User-service unavailable during CHECK - this is NOT a reason to delete from Keycloak!
      this.logger.error('RegistrationSaga: User-service unavailable during existence check', checkError, {
        operationId,
        keycloakId: dto.keycloakId,
        errorCode: checkError.code,
      });

      throw new HttpException(
        {
          success: false,
          error: 'Service temporarily unavailable',
          details: 'Please try again in a few moments.',
          code: 'USER_SERVICE_UNAVAILABLE',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

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
    // From this point, if we fail - we SHOULD delete from Keycloak
    // because user exists in Keycloak but NOT in user-service
    // ═══════════════════════════════════════════════════════════
    this.logger.info('RegistrationSaga: Creating new user (first login)', {
      operationId,
      keycloakId: dto.keycloakId,
      email: dto.email,
    });

    const userId = uuid();

    try {
      // STEP 2.1: Create user in User Service
      await this.userServiceClient.createUser({
        userId,
        externalAuthId: dto.keycloakId,
        email: dto.email,
        firstName: dto.firstName || 'Unknown',
        lastName: dto.lastName || 'User',
      });

      this.logger.info('RegistrationSaga: User created successfully', {
        operationId,
        userId,
        email: dto.email,
        isFirstLogin: true,
      });

      // Assign pending role in Keycloak (will be in JWT token)
      try {
        this.logger.info('RegistrationSaga: Assigning pending role in Keycloak', {
          operationId,
          userId,
          keycloakId: dto.keycloakId,
        });

        await this.keycloakRoleService.assignRole(dto.keycloakId, 'pending');

        this.logger.info('RegistrationSaga: Pending role assigned in Keycloak', {
          operationId,
          userId,
        });
      } catch (roleError) {
        this.logger.error('RegistrationSaga: Failed to assign pending role', {
          errorMessage: roleError.message,
          operationId,
          userId,
        });
        // Don't fail registration if pending role assignment fails
        // User will be redirected to /select-role anyway
      }

      // Get full user details after creation
      const fullUser = await this.userServiceClient.getUserById(userId);

      return {
        userId: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        isNew: true, // First login - can show onboarding!
      };
    } catch (createError) {
      // ═══════════════════════════════════════════════════════════
      // COMPENSATION: Failed to create user in User Service
      // User exists in Keycloak but NOT in User Service - inconsistent state!
      // We delete from Keycloak so user can re-register cleanly.
      // ═══════════════════════════════════════════════════════════
      this.logger.error('RegistrationSaga: Failed to create user in User Service', createError, {
        operationId,
        keycloakId: dto.keycloakId,
        email: dto.email,
      });

      try {
        this.logger.warn('RegistrationSaga: COMPENSATION - Deleting user from Keycloak (failed to create in user-service)', {
          operationId,
          keycloakId: dto.keycloakId,
          email: dto.email,
        });

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
          details: 'User Service is temporarily unavailable. Please try again later.',
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
