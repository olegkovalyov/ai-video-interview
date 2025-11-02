import { Injectable, Logger } from '@nestjs/common';
import { KeycloakTokenService } from './keycloak-token.service';

/**
 * Keycloak Email Service
 * Handles email verification operations in Keycloak
 */
@Injectable()
export class KeycloakEmailService {
  private readonly logger = new Logger(KeycloakEmailService.name);
  private readonly keycloakUrl: string;
  private readonly realm: string;

  constructor(private readonly tokenService: KeycloakTokenService) {
    const config = this.tokenService.getConfig();
    this.keycloakUrl = config.keycloakUrl;
    this.realm = config.realm;
  }

  /**
   * Верифицирует email пользователя в Keycloak
   */
  async verifyEmail(userId: string): Promise<void> {
    this.logger.log('Verifying email for user in Keycloak', { userId });

    try {
      const adminToken = await this.tokenService.getAdminToken();
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
