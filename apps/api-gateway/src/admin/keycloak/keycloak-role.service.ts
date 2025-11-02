import { Injectable, Logger } from '@nestjs/common';
import { KeycloakTokenService } from './keycloak-token.service';

/**
 * Keycloak Role Service
 * Handles role management operations in Keycloak
 */
@Injectable()
export class KeycloakRoleService {
  private readonly logger = new Logger(KeycloakRoleService.name);
  private readonly keycloakUrl: string;
  private readonly realm: string;

  constructor(private readonly tokenService: KeycloakTokenService) {
    const config = this.tokenService.getConfig();
    this.keycloakUrl = config.keycloakUrl;
    this.realm = config.realm;
  }

  /**
   * Получает роли пользователя из Keycloak
   */
  async getUserRoles(userId: string): Promise<any[]> {
    this.logger.log('Getting user roles from Keycloak', { userId });

    try {
      const adminToken = await this.tokenService.getAdminToken();
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
      const adminToken = await this.tokenService.getAdminToken();
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
      const adminToken = await this.tokenService.getAdminToken();
      
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
      const adminToken = await this.tokenService.getAdminToken();
      
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
}
