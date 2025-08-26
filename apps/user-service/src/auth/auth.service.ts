import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { SignJWT, generateKeyPair, exportJWK, importJWK, JWK } from 'jose';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private publicJwk!: JWK;
  private privateKey!: CryptoKey;
  private keyId!: string;
  private accessTtlSec: number;
  private refreshTtlSec: number;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {
    // TTLs from env or defaults
    this.accessTtlSec = this.parseTtl(process.env.JWT_EXPIRES_IN || '15m');
    this.refreshTtlSec = this.parseTtl(process.env.JWT_REFRESH_EXPIRES_IN || '30d');
  }

  // Initialize RSA keypair once at startup
  async initKeys() {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    this.privateKey = privateKey;
    const jwk = await exportJWK(publicKey);
    // minimal kid: timestamp
    this.keyId = `user-svc-${Date.now()}`;
    jwk.kid = this.keyId;
    jwk.alg = 'RS256';
    jwk.use = 'sig';
    this.publicJwk = jwk as JWK;
  }

  getJwks() {
    if (!this.publicJwk) {
      throw new Error('JWKS not initialized');
    }
    return { keys: [this.publicJwk] };
  }

  async register(email: string, password: string, name?: string | null) {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('User already exists');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.users.create({ email, passwordHash, name: name ?? null, roles: [] });
    await this.users.save(user);
    return { id: user.id, email: user.email, name: user.name };
  }

  async login(email: string, password: string): Promise<Tokens> {
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const tokens = await this.issueTokens(user);
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.users.save(user);
    return tokens;
  }

  async refresh(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException('Invalid refresh');
    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok) throw new UnauthorizedException('Invalid refresh');
    const tokens = await this.issueTokens(user);
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.users.save(user);
    return tokens;
  }

  private async issueTokens(user: User): Promise<Tokens> {
    if (!this.privateKey) throw new Error('Signing key not initialized');
    const now = Math.floor(Date.now() / 1000);
    const issuer = 'user-service';
    const subject = user.id;

    const access = await new SignJWT({ sub: subject, email: user.email, roles: user.roles })
      .setProtectedHeader({ alg: 'RS256', kid: this.keyId })
      .setIssuedAt(now)
      .setIssuer(issuer)
      .setAudience('api-gateway')
      .setExpirationTime(now + this.accessTtlSec)
      .sign(this.privateKey);

    const refresh = await new SignJWT({ sub: subject, typ: 'refresh' })
      .setProtectedHeader({ alg: 'RS256', kid: this.keyId })
      .setIssuedAt(now)
      .setIssuer(issuer)
      .setAudience('api-gateway')
      .setExpirationTime(now + this.refreshTtlSec)
      .sign(this.privateKey);

    return { accessToken: access, refreshToken: refresh };
  }

  private parseTtl(ttl: string): number {
    // supports s, m, h, d; default seconds if number
    const m = ttl.match(/^(\d+)([smhd])?$/);
    if (!m) return 900;
    const n = parseInt(m[1], 10);
    const u = m[2] || 's';
    switch (u) {
      case 's': return n;
      case 'm': return n * 60;
      case 'h': return n * 3600;
      case 'd': return n * 86400;
      default: return n;
    }
  }
}
