import { Injectable, HttpException, HttpStatus, OnModuleDestroy } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { UserServiceClient } from '../../../modules/user-service/clients/user-service.client';
import { KeycloakUserService, KeycloakRoleService } from '../../../modules/user-service/admin/keycloak';
import { LoggerService } from '../../logging/logger.service';
import { maskEmail } from '../../logging/pii-mask.util';

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
interface CachedUser {
  result: UserResult;
  expiresAt: number;
}

@Injectable()
export class RegistrationSaga implements OnModuleDestroy {
  private readonly userCache = new Map<string, CachedUser>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly keycloakUserService: KeycloakUserService,
    private readonly keycloakRoleService: KeycloakRoleService,
    private readonly logger: LoggerService,
  ) {
    this.cleanupTimer = setInterval(() => this.evictExpired(), this.CLEANUP_INTERVAL);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.userCache) {
      if (entry.expiresAt <= now) {
        this.userCache.delete(key);
      }
    }
  }

  /**
   * Ensure user exists in User Service
   * Called on every login (fast path if user exists)
   * Creates user on first login (sync, +100ms)
   */
  async ensureUserExists(dto: EnsureUserExistsDto): Promise<UserResult> {
    const operationId = uuid();

    // ═══════════════════════════════════════════════════════════
    // CACHE HIT: Return cached result if fresh (avoids HTTP to user-service)
    // ═══════════════════════════════════════════════════════════
    const cached = this.userCache.get(dto.keycloakId);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug('RegistrationSaga: Cache hit for user', {
        operationId,
        keycloakId: dto.keycloakId,
      });
      return cached.result;
    }

    this.logger.info('RegistrationSaga: Ensuring user exists', {
      operationId,
      keycloakId: dto.keycloakId,
      email: maskEmail(dto.email),
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
        email: maskEmail(existingUser.email),
      });

      const result: UserResult = {
        userId: existingUser.userId,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        isNew: false,
      };
      this.userCache.set(dto.keycloakId, {
        result,
        expiresAt: Date.now() + this.CACHE_TTL,
      });
      return result;
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 2: User doesn't exist - create it (first login)
    // From this point, if we fail - we SHOULD delete from Keycloak
    // because user exists in Keycloak but NOT in user-service
    // ═══════════════════════════════════════════════════════════
    this.logger.info('RegistrationSaga: Creating new user (first login)', {
      operationId,
      keycloakId: dto.keycloakId,
      email: maskEmail(dto.email),
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
        email: maskEmail(dto.email),
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

      const newUserResult: UserResult = {
        userId: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        isNew: true, // First login - can show onboarding!
      };
      this.userCache.set(dto.keycloakId, {
        result: { ...newUserResult, isNew: false }, // Subsequent hits should not trigger onboarding
        expiresAt: Date.now() + this.CACHE_TTL,
      });
      return newUserResult;
    } catch (createError) {
      // ═══════════════════════════════════════════════════════════
      // COMPENSATION: Failed to create user in User Service
      // User exists in Keycloak but NOT in User Service - inconsistent state!
      // We delete from Keycloak so user can re-register cleanly.
      // ═══════════════════════════════════════════════════════════
      this.logger.error('RegistrationSaga: Failed to create user in User Service', createError, {
        operationId,
        keycloakId: dto.keycloakId,
        email: maskEmail(dto.email),
      });

      try {
        this.logger.warn('RegistrationSaga: COMPENSATION - Deleting user from Keycloak (failed to create in user-service)', {
          operationId,
          keycloakId: dto.keycloakId,
          email: maskEmail(dto.email),
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
          email: maskEmail(dto.email),
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
