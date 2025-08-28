import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

interface OIDCDiscoveryDoc {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  userinfo_endpoint?: string;
}

@Injectable()
export class OidcService {
  private issuerUrl: string;
  private clientId: string;
  private discovery?: OIDCDiscoveryDoc;
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: ConfigService) {
    // Expect full issuer URL with trailing slash, e.g. http://localhost:9443/application/o/<provider-slug>/
    this.issuerUrl = this.config.get<string>('AUTHENTIK_ISSUER_URL', '').trim();
    this.clientId = this.config.get<string>('AUTHENTIK_CLIENT_ID', '').trim();
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
}
