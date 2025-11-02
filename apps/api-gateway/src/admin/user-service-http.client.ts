import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../logger/logger.service';
import { CreateUserInternalDto, CreateUserInternalResponse } from './dto/create-user-internal.dto';

/**
 * HTTP Client for User Service
 * Handles synchronous communication for Saga orchestration
 */
@Injectable()
export class UserServiceHttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number = 5000; // 5 seconds timeout
  private readonly internalToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.baseUrl = this.config.get<string>('USER_SERVICE_URL', 'http://localhost:3002');
    this.internalToken = this.config.get<string>('INTERNAL_SERVICE_TOKEN', 'internal-secret');
  }

  /**
   * POST /internal/users
   * Create user synchronously
   */
  async createUser(dto: CreateUserInternalDto): Promise<CreateUserInternalResponse> {
    try {
      this.logger.info('UserServiceHttpClient: Creating user', {
        userId: dto.userId,
        email: dto.email,
      });

      const response = await firstValueFrom(
        this.httpService.post<CreateUserInternalResponse>(
          `${this.baseUrl}/internal/users`,
          dto,
          {
            headers: this.getHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      this.logger.info('UserServiceHttpClient: User created successfully', {
        userId: dto.userId,
      });

      return response.data;
    } catch (error) {
      this.logger.error('UserServiceHttpClient: Failed to create user', {
        errorMessage: error.message,
        errorStack: error.stack,
        errorResponse: error.response?.data,
        errorStatus: error.response?.status,
        errorCode: error.code,
        userId: dto.userId,
        email: dto.email,
        url: `${this.baseUrl}/internal/users`,
      });

      // Handle specific HTTP errors
      if (error.response?.status === 409) {
        throw new HttpException(
          {
            success: false,
            error: 'User already exists in User Service',
            code: 'USER_ALREADY_EXISTS',
          },
          HttpStatus.CONFLICT,
        );
      }

      if (error.code === 'ECONNABORTED') {
        throw new HttpException(
          {
            success: false,
            error: 'User Service timeout',
            code: 'USER_SERVICE_TIMEOUT',
          },
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      if (error.code === 'ECONNREFUSED') {
        throw new HttpException(
          {
            success: false,
            error: 'User Service unavailable',
            code: 'USER_SERVICE_UNAVAILABLE',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        {
          success: false,
          error: 'Failed to create user in User Service',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PUT /internal/users/:id
   * Update user synchronously
   */
  async updateUser(
    userId: string,
    dto: { firstName?: string; lastName?: string },
  ): Promise<any> {
    try {
      this.logger.info('UserServiceHttpClient: Updating user', { userId });

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/internal/users/${userId}`,
          dto,
          {
            headers: this.getHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      this.logger.info('UserServiceHttpClient: User updated successfully', { userId });

      return response.data;
    } catch (error) {
      this.logger.error('UserServiceHttpClient: Failed to update user', error, { userId });

      if (error.response?.status === 404) {
        throw new HttpException(
          {
            success: false,
            error: 'User not found in User Service',
            code: 'USER_NOT_FOUND',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          error: 'Failed to update user in User Service',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * DELETE /internal/users/:id
   * Delete user synchronously
   */
  async deleteUser(userId: string): Promise<any> {
    try {
      this.logger.info('UserServiceHttpClient: Deleting user', { userId });

      const response = await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/internal/users/${userId}`, {
          headers: this.getHeaders(),
          timeout: this.timeout,
        }),
      );

      this.logger.info('UserServiceHttpClient: User deleted successfully', { userId });

      return response.data;
    } catch (error) {
      this.logger.error('UserServiceHttpClient: Failed to delete user', error, { userId });

      if (error.response?.status === 404) {
        throw new HttpException(
          {
            success: false,
            error: 'User not found in User Service',
            code: 'USER_NOT_FOUND',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          error: 'Failed to delete user in User Service',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /internal/users/:id/roles
   * Assign role synchronously
   */
  async assignRole(userId: string, roleName: string): Promise<any> {
    try {
      this.logger.info('UserServiceHttpClient: Assigning role', { userId, roleName });

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/internal/users/${userId}/roles`,
          { roleName },
          {
            headers: this.getHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      this.logger.info('UserServiceHttpClient: Role assigned successfully', {
        userId,
        roleName,
      });

      return response.data;
    } catch (error) {
      this.logger.error('UserServiceHttpClient: Failed to assign role', error, {
        userId,
        roleName,
      });

      if (error.response?.status === 404) {
        throw new HttpException(
          {
            success: false,
            error: 'User not found in User Service',
            code: 'USER_NOT_FOUND',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          error: 'Failed to assign role in User Service',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * DELETE /internal/users/:id/roles/:roleName
   * Remove role synchronously
   */
  async removeRole(userId: string, roleName: string): Promise<any> {
    try {
      this.logger.info('UserServiceHttpClient: Removing role', { userId, roleName });

      const response = await firstValueFrom(
        this.httpService.delete(
          `${this.baseUrl}/internal/users/${userId}/roles/${roleName}`,
          {
            headers: this.getHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      this.logger.info('UserServiceHttpClient: Role removed successfully', {
        userId,
        roleName,
      });

      return response.data;
    } catch (error) {
      this.logger.error('UserServiceHttpClient: Failed to remove role', error, {
        userId,
        roleName,
      });

      if (error.response?.status === 404) {
        throw new HttpException(
          {
            success: false,
            error: 'User not found in User Service',
            code: 'USER_NOT_FOUND',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          error: 'Failed to remove role in User Service',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /internal/users/by-external-auth/:externalAuthId
   * Get user by external auth ID (for login flow)
   */
  async getUserByExternalAuthId(externalAuthId: string): Promise<any> {
    try {
      this.logger.info('UserServiceHttpClient: Getting user by external auth ID', {
        externalAuthId,
      });

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/internal/users/by-external-auth/${externalAuthId}`,
          {
            headers: this.getHeaders(),
            timeout: this.timeout,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'UserServiceHttpClient: Failed to get user by external auth ID',
        error,
        { externalAuthId },
      );

      if (error.response?.status === 404) {
        throw new HttpException(
          {
            success: false,
            error: 'User not found in User Service',
            code: 'USER_NOT_FOUND',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          error: 'Failed to get user from User Service',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get headers for internal service communication
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Internal-Token': this.internalToken,
    };
  }
}
