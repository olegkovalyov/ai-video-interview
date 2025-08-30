import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

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

  constructor(private readonly config: ConfigService) {
    // Expect full issuer URL with trailing slash, e.g. http://localhost:9443/application/o/<provider-slug>/
    this.issuerUrl = this.config.get<string>('AUTHENTIK_ISSUER_URL', '').trim();
    this.clientId = this.config.get<string>('AUTHENTIK_CLIENT_ID', '').trim();
    this.clientSecret = this.config.get<string>('AUTHENTIK_CLIENT_SECRET', '').trim();
  }

  private get discoveryUrl(): string {
    let base = this.issuerUrl;
    if (!base) throw new Error('AUTHENTIK_ISSUER_URL is not configured');
    if (!base.endsWith('/')) base += '/';
    return base + '.well-known/openid-configuration';
  }

  async ensureDiscovery(): Promise<void> {
    if (this.discovery && this.jwks) return;

    const res = await fetch(this.discoveryUrl);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
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

    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.discovery.issuer,
      audience: this.clientId || undefined,
    });

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
