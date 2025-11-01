import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CreateKeycloakUserDto {
  email: string;
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
 * Keycloak Admin Service
 * Управление пользователями в Keycloak через Admin REST API
 */
@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly adminClientId: string;
  private readonly adminClientSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.keycloakUrl = this.configService.get('KEYCLOAK_URL', 'http://localhost:8090');
    this.realm = this.configService.get('KEYCLOAK_REALM', 'ai-video-interview');
    this.adminClientId = this.configService.get('KEYCLOAK_ADMIN_CLIENT_ID', 'user-service-admin');
    this.adminClientSecret = this.configService.get('KEYCLOAK_ADMIN_CLIENT_SECRET', '');
  }

  /**
   * Получает admin access token через client credentials
   */
  private async getAdminToken(): Promise<string> {
    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.adminClientId,
      client_secret: this.adminClientSecret,
    });

    this.logger.debug('Requesting admin token from Keycloak', {
      url: tokenUrl,
      clientId: this.adminClientId,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error('Failed to get admin token', {
        status: response.status,
        error,
      });
      throw new Error(`Failed to get admin token: ${response.status}`);
    }

    const data = await response.json();
    this.logger.debug('Admin token obtained successfully');
    return data.access_token;
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
      const adminToken = await this.getAdminToken();

      // 2. Создаём пользователя
      const createUrl = `${this.keycloakUrl}/admin/realms/${this.realm}/users`;

      const keycloakUser = {
        username: userData.email, // username = email
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
      const adminToken = await this.getAdminToken();
      
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
      const adminToken = await this.getAdminToken();
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
      const adminToken = await this.getAdminToken();
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
      const adminToken = await this.getAdminToken();
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

  /**
   * Получает роли пользователя из Keycloak
   */
  async getUserRoles(userId: string): Promise<any[]> {
    this.logger.log('Getting user roles from Keycloak', { userId });

    try {
      const adminToken = await this.getAdminToken();
      const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Failed to get user roles', {
          status: response.status,
          error,
          userId,
        });
        throw new Error(`Failed to get user roles: ${response.status}`);
      }

      const roles = await response.json();
      this.logger.log('User roles retrieved successfully', { userId, rolesCount: roles.length });
      return roles;
    } catch (error) {
      this.logger.error('Error getting user roles', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Получает доступные роли realm
   */
  async getAvailableRoles(): Promise<any[]> {
    this.logger.log('Getting available roles from Keycloak');

    try {
      const adminToken = await this.getAdminToken();
      const url = `${this.keycloakUrl}/admin/realms/${this.realm}/roles`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Failed to get available roles', {
          status: response.status,
          error,
        });
        throw new Error(`Failed to get available roles: ${response.status}`);
      }

      const roles = await response.json();
      this.logger.log('Available roles retrieved successfully', { rolesCount: roles.length });
      return roles;
    } catch (error) {
      this.logger.error('Error getting available roles', { error: error.message });
      throw error;
    }
  }

  /**
   * Назначает роль пользователю в Keycloak
   */
  async assignRole(userId: string, roleName: string): Promise<void> {
    this.logger.log('Assigning role to user in Keycloak', { userId, roleName });

    try {
      const adminToken = await this.getAdminToken();
      
      // 1. Получаем информацию о роли
      const rolesUrl = `${this.keycloakUrl}/admin/realms/${this.realm}/roles/${roleName}`;
      const roleResponse = await fetch(rolesUrl, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!roleResponse.ok) {
        throw new Error(`Role ${roleName} not found`);
      }

      const role = await roleResponse.json();

      // 2. Назначаем роль пользователю
      const assignUrl = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`;
      const response = await fetch(assignUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify([role]),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Failed to assign role', {
          status: response.status,
          error,
          userId,
          roleName,
        });
        throw new Error(`Failed to assign role: ${response.status}`);
      }

      this.logger.log('Role assigned successfully', { userId, roleName });
    } catch (error) {
      this.logger.error('Error assigning role', { error: error.message, userId, roleName });
      throw error;
    }
  }

  /**
   * Удаляет роль у пользователя в Keycloak
   */
  async removeRole(userId: string, roleName: string): Promise<void> {
    this.logger.log('Removing role from user in Keycloak', { userId, roleName });

    try {
      const adminToken = await this.getAdminToken();
      
      // 1. Получаем информацию о роли
      const rolesUrl = `${this.keycloakUrl}/admin/realms/${this.realm}/roles/${roleName}`;
      const roleResponse = await fetch(rolesUrl, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!roleResponse.ok) {
        throw new Error(`Role ${roleName} not found`);
      }

      const role = await roleResponse.json();

      // 2. Удаляем роль у пользователя
      const removeUrl = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`;
      const response = await fetch(removeUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify([role]),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Failed to remove role', {
          status: response.status,
          error,
          userId,
          roleName,
        });
        throw new Error(`Failed to remove role: ${response.status}`);
      }

      this.logger.log('Role removed successfully', { userId, roleName });
    } catch (error) {
      this.logger.error('Error removing role', { error: error.message, userId, roleName });
      throw error;
    }
  }

  /**
   * Верифицирует email пользователя в Keycloak
   */
  async verifyEmail(userId: string): Promise<void> {
    this.logger.log('Verifying email for user in Keycloak', { userId });

    try {
      const adminToken = await this.getAdminToken();
      const updateUrl = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`;

      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          emailVerified: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Failed to verify email in Keycloak', {
          status: response.status,
          error,
          userId,
        });
        throw new Error(`Failed to verify email in Keycloak: ${response.status}`);
      }

      this.logger.log('Email verified successfully', { userId });
    } catch (error) {
      this.logger.error('Error verifying email', { error: error.message, userId });
      throw error;
    }
  }
}
