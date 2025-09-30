import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { LoggerService } from '../logger/logger.service';

interface OIDCDiscoveryDoc {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  userinfo_endpoint?: string;
  revocation_endpoint?: string;
  end_session_endpoint?: string;
}

@Injectable()
export class OidcService {
  private issuerUrl: string;
  private clientId: string;
  private clientSecret: string;
  private discovery?: OIDCDiscoveryDoc;
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {
    // Keycloak OIDC configuration
    const keycloakUrl = this.config.get<string>('KEYCLOAK_URL', 'http://localhost:8090');
    const realm = this.config.get<string>('KEYCLOAK_REALM', 'ai-video-interview');
    this.issuerUrl = `${keycloakUrl}/realms/${realm}`;
    this.clientId = this.config.get<string>('KEYCLOAK_CLIENT_ID', 'ai-video-interview-app');
    this.clientSecret = this.config.get<string>('KEYCLOAK_CLIENT_SECRET', '');
  }

  private get discoveryUrl(): string {
    let base = this.issuerUrl;
    if (!base) throw new Error('KEYCLOAK_URL and KEYCLOAK_REALM are not configured');
    if (!base.endsWith('/')) base += '/';
    return base + '.well-known/openid-configuration';
  }

  async ensureDiscovery(): Promise<void> {
    if (this.discovery && this.jwks) return;

    this.logger.debugObject('OIDC Discovery: Fetching configuration', {
      issuerUrl: this.issuerUrl,
      discoveryUrl: this.discoveryUrl,
      clientId: this.clientId,
      clientSecretPresent: !!this.clientSecret
    });

    const res = await fetch(this.discoveryUrl);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error('OIDC Discovery failed', undefined, {
        url: this.discoveryUrl,
        status: res.status,
        statusText: res.statusText,
        response: text
      });
      throw new Error(`Failed to load OIDC discovery: ${res.status} ${res.statusText} ${text}`);
    }
    const doc = (await res.json()) as OIDCDiscoveryDoc;
    if (!doc.jwks_uri || !doc.issuer) {
      throw new Error('Invalid OIDC discovery document: missing jwks_uri or issuer');
    }

    this.discovery = doc;
    this.jwks = createRemoteJWKSet(new URL(doc.jwks_uri));
  }

  async getDiscovery(): Promise<OIDCDiscoveryDoc> {
    await this.ensureDiscovery();
    if (!this.discovery) throw new Error('OIDC discovery not initialized');
    return this.discovery;
  }

  async verifyAccessToken(token: string): Promise<{ payload: JWTPayload }>
  {
    await this.ensureDiscovery();
    if (!this.discovery || !this.jwks) throw new Error('OIDC discovery not initialized');

    // Проверяем audience - должен быть настроен через mapper в Keycloak
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.discovery.issuer,
      audience: this.clientId || undefined, // Включено после настройки audience mapper
    });
    
    // Token verified successfully with proper audience validation

    return { payload };
  }

  async revokeToken(token: string, tokenTypeHint?: 'access_token' | 'refresh_token'): Promise<void> {
    await this.ensureDiscovery();
    if (!this.discovery?.revocation_endpoint) {
      throw new Error('revocation_endpoint not available from discovery');
    }
    const body = new URLSearchParams({
      token,
      client_id: this.clientId,
    });
    if (this.clientSecret) body.set('client_secret', this.clientSecret);
    if (tokenTypeHint) body.set('token_type_hint', tokenTypeHint);

    const res = await fetch(this.discovery.revocation_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    // Per RFC 7009, server should respond 200 even if token is invalid/expired.
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Token revocation failed: ${res.status} ${res.statusText} ${text}`);
    }
  }
}
