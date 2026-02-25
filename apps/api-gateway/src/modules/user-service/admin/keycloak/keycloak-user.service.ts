import { Injectable, Logger } from '@nestjs/common';
import { KeycloakTokenService } from './keycloak-token.service';

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

/**
 * Keycloak User Service
 * Handles user CRUD operations in Keycloak
 */
@Injectable()
export class KeycloakUserService {
  private readonly logger = new Logger(KeycloakUserService.name);
  private readonly keycloakUrl: string;
  private readonly realm: string;

  constructor(private readonly tokenService: KeycloakTokenService) {
    const config = this.tokenService.getConfig();
    this.keycloakUrl = config.keycloakUrl;
    this.realm = config.realm;
  }

  /**
   * Создаёт нового пользователя в Keycloak
   * Возвращает keycloakId созданного пользователя
   */
  async createUser(userData: CreateKeycloakUserDto): Promise<KeycloakUserResponse> {
    this.logger.log('Creating user in Keycloak', {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
    });

    try {
      // 1. Получаем admin token
      const adminToken = await this.tokenService.getAdminToken();

      // 2. Создаём пользователя
      const createUrl = `${this.keycloakUrl}/admin/realms/${this.realm}/users`;

      const keycloakUser = {
        username: userData.username || userData.email, // username or fallback to email
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: userData.enabled ?? true,
        emailVerified: true, // Автоматически верифицируем email при создании админом
        credentials: userData.password ? [
          {
            type: 'password',
            value: userData.password,
            temporary: false,
          },
        ] : [],
      };

      this.logger.debug('Sending create user request to Keycloak', {
        url: createUrl,
        username: keycloakUser.username,
      });

      const response = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(keycloakUser),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Failed to create user in Keycloak', {
          status: response.status,
          error,
          email: userData.email,
        });
        throw new Error(`Failed to create user in Keycloak: ${response.status} ${error}`);
      }

      // 3. Извлекаем keycloakId из Location header
      const locationHeader = response.headers.get('location');
      if (!locationHeader) {
        this.logger.error('Location header not found in response');
        throw new Error('Failed to get user ID from Keycloak response');
      }

      // Location: https://keycloak.../admin/realms/realm/users/12345-67890-abcdef
      const keycloakId = locationHeader.split('/').pop();
      
      if (!keycloakId) {
        this.logger.error('Failed to extract keycloakId from Location header', { locationHeader });
        throw new Error('Failed to extract user ID from Keycloak response');
      }

      this.logger.log('User created successfully in Keycloak', {
        email: userData.email,
        keycloakId,
      });

      return {
        keycloakId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: userData.enabled ?? true,
      };
    } catch (error) {
      this.logger.error('Error creating user in Keycloak', {
        error: error.message,
        email: userData.email,
      });
      throw error;
    }
  }

  /**
   * Получает список пользователей из Keycloak
   */
  async listUsers(params?: {
    search?: string;
    max?: number;
    first?: number;
  }): Promise<any[]> {
    this.logger.log('Listing users from Keycloak', params);

    try {
      const adminToken = await this.tokenService.getAdminToken();
      
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.max) queryParams.append('max', params.max.toString());
      if (params?.first) queryParams.append('first', params.first.toString());

      const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users?${queryParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Failed to list users', {
          status: response.status,
          error,
        });
        throw new Error(`Failed to list users: ${response.status}`);
      }

      const users = await response.json();
      this.logger.log(`Retrieved ${users.length} users from Keycloak`);
      return users;
    } catch (error) {
      this.logger.error('Error listing users', { error: error.message });
      throw error;
    }
  }

  /**
   * Получает пользователя по ID из Keycloak
   */
  async getUser(userId: string): Promise<any> {
    this.logger.log('Getting user from Keycloak', { userId });

    try {
      const adminToken = await this.tokenService.getAdminToken();
      const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Failed to get user', {
          status: response.status,
          error,
          userId,
        });
        throw new Error(`Failed to get user: ${response.status}`);
      }

      const user = await response.json();
      this.logger.log('User retrieved successfully', { userId });
      return user;
    } catch (error) {
      this.logger.error('Error getting user', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Обновляет пользователя в Keycloak
   */
  async updateUser(userId: string, userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    enabled?: boolean;
  }): Promise<void> {
    this.logger.log('Updating user in Keycloak', { userId, userData });

    try {
      const adminToken = await this.tokenService.getAdminToken();
      const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Failed to update user', {
          status: response.status,
          error,
          userId,
        });
        throw new Error(`Failed to update user: ${response.status}`);
      }

      this.logger.log('User updated successfully', { userId });
    } catch (error) {
      this.logger.error('Error updating user', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Удаляет пользователя из Keycloak
   */
  async deleteUser(userId: string): Promise<void> {
    this.logger.log('Deleting user from Keycloak', { userId });

    try {
      const adminToken = await this.tokenService.getAdminToken();
      const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Failed to delete user', {
          status: response.status,
          error,
          userId,
        });
        throw new Error(`Failed to delete user: ${response.status}`);
      }

      this.logger.log('User deleted successfully', { userId });
    } catch (error) {
      this.logger.error('Error deleting user', { error: error.message, userId });
      throw error;
    }
  }
}
