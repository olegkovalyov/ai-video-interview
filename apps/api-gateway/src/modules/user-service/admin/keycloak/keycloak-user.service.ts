import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { KeycloakTokenService } from './keycloak-token.service';
import { LoggerService } from '../../../../core/logging/logger.service';
import { maskEmail } from '../../../../core/logging/pii-mask.util';

export interface CreateKeycloakUserDto {
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  password?: string;
  enabled?: boolean;
}

export interface KeycloakUserResponse {
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
}

const KEYCLOAK_TIMEOUT = 10000; // 10s
const MAX_RETRIES = 2;

/**
 * Keycloak User Service
 * Handles user CRUD operations in Keycloak.
 * Uses HttpService (axios) with timeout and retry for resilience.
 */
@Injectable()
export class KeycloakUserService {
  private readonly keycloakUrl: string;
  private readonly realm: string;

  constructor(
    private readonly tokenService: KeycloakTokenService,
    private readonly httpService: HttpService,
    private readonly loggerService: LoggerService,
  ) {
    const config = this.tokenService.getConfig();
    this.keycloakUrl = config.keycloakUrl;
    this.realm = config.realm;
  }

  /** Create a user in Keycloak. Returns keycloakId from Location header. */
  async createUser(userData: CreateKeycloakUserDto): Promise<KeycloakUserResponse> {
    this.loggerService.info('KeycloakUserService: Creating user', {
      email: maskEmail(userData.email),
    });

    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users`;
    const adminToken = await this.tokenService.getAdminToken();

    const keycloakUser = {
      username: userData.username || userData.email,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      enabled: userData.enabled ?? true,
      emailVerified: true,
      credentials: userData.password
        ? [{ type: 'password', value: userData.password, temporary: false }]
        : [],
    };

    const response = await this.executeWithRetry(() =>
      firstValueFrom(
        this.httpService.post(url, keycloakUser, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          timeout: KEYCLOAK_TIMEOUT,
          // Axios does not follow redirects for POST by default, which is what we want
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
        }),
      ),
    );

    const locationHeader = response.headers['location'] as string;
    if (!locationHeader) {
      throw new Error('Failed to get user ID from Keycloak response (no Location header)');
    }

    const keycloakId = locationHeader.split('/').pop();
    if (!keycloakId) {
      throw new Error('Failed to extract user ID from Keycloak Location header');
    }

    this.loggerService.info('KeycloakUserService: User created', {
      email: maskEmail(userData.email),
      keycloakId,
    });

    return {
      keycloakId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      enabled: userData.enabled ?? true,
    };
  }

  /** List users from Keycloak */
  async listUsers(params?: {
    search?: string;
    max?: number;
    first?: number;
  }): Promise<any[]> {
    const adminToken = await this.tokenService.getAdminToken();
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users`;

    const queryParams: Record<string, any> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.max) queryParams.max = params.max;
    if (params?.first) queryParams.first = params.first;

    const response = await this.executeWithRetry(() =>
      firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${adminToken}` },
          params: queryParams,
          timeout: KEYCLOAK_TIMEOUT,
        }),
      ),
    );

    return response.data;
  }

  /** Get user by ID from Keycloak */
  async getUser(userId: string): Promise<any> {
    const adminToken = await this.tokenService.getAdminToken();
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`;

    const response = await this.executeWithRetry(() =>
      firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${adminToken}` },
          timeout: KEYCLOAK_TIMEOUT,
        }),
      ),
    );

    return response.data;
  }

  /** Update user in Keycloak */
  async updateUser(
    userId: string,
    userData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      enabled?: boolean;
    },
  ): Promise<void> {
    const adminToken = await this.tokenService.getAdminToken();
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`;

    await this.executeWithRetry(() =>
      firstValueFrom(
        this.httpService.put(url, userData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          timeout: KEYCLOAK_TIMEOUT,
        }),
      ),
    );

    this.loggerService.info('KeycloakUserService: User updated', { userId });
  }

  /** Delete user from Keycloak */
  async deleteUser(userId: string): Promise<void> {
    const adminToken = await this.tokenService.getAdminToken();
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`;

    await this.executeWithRetry(() =>
      firstValueFrom(
        this.httpService.delete(url, {
          headers: { Authorization: `Bearer ${adminToken}` },
          timeout: KEYCLOAK_TIMEOUT,
        }),
      ),
    );

    this.loggerService.info('KeycloakUserService: User deleted', { userId });
  }

  // ==========================================================================
  // Retry helper
  // ==========================================================================

  /**
   * Execute with retry and exponential backoff.
   * Retries on network errors and 5xx status codes only.
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = MAX_RETRIES,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Don't retry on 4xx client errors
        const status = error.response?.status;
        if (status && status >= 400 && status < 500) {
          throw error;
        }

        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          this.loggerService.warn(
            `KeycloakUserService: Retry ${attempt + 1}/${retries}`,
            { error: error.message, delay },
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.loggerService.error('KeycloakUserService: All retries exhausted', lastError, {
      retries,
    });
    throw lastError;
  }
}
