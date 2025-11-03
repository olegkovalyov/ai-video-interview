import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Keycloak Token Service
 * Manages admin access tokens for Keycloak Admin API
 */
@Injectable()
export class KeycloakTokenService {
  private readonly logger = new Logger(KeycloakTokenService.name);
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
  async getAdminToken(): Promise<string> {
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
   * Get Keycloak configuration for child services
   */
  getConfig() {
    return {
      keycloakUrl: this.keycloakUrl,
      realm: this.realm,
    };
  }
}
