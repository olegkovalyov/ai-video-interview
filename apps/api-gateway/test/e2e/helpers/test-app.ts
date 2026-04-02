import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { OidcService } from '../../../src/core/auth/services/oidc.service';
import { RegistrationSaga } from '../../../src/core/auth/sagas/registration.saga';
import { CircuitBreakerRegistry } from '../../../src/core/circuit-breaker/circuit-breaker-registry.service';

// ============================================================================
// Fake JWT helpers
// ============================================================================

interface FakeJwtPayload {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  realm_access?: { roles: string[] };
  roles?: string[];
  preferred_username?: string;
  companyId?: string;
}

const DEFAULT_USER_PAYLOAD: FakeJwtPayload = {
  sub: 'keycloak-user-id-001',
  email: 'test@example.com',
  given_name: 'Test',
  family_name: 'User',
  realm_access: { roles: ['hr'] },
  preferred_username: 'testuser',
};

const DEFAULT_ADMIN_PAYLOAD: FakeJwtPayload = {
  sub: 'keycloak-admin-id-001',
  email: 'admin@example.com',
  given_name: 'Admin',
  family_name: 'User',
  realm_access: { roles: ['admin'] },
  preferred_username: 'adminuser',
};

const DEFAULT_CANDIDATE_PAYLOAD: FakeJwtPayload = {
  sub: 'keycloak-candidate-id-001',
  email: 'candidate@example.com',
  given_name: 'Candidate',
  family_name: 'Person',
  realm_access: { roles: ['candidate'] },
  preferred_username: 'candidateuser',
};

/**
 * Generates a fake JWT token string (base64-encoded, not cryptographically valid).
 * The mock OidcService accepts any token and returns the associated payload.
 */
export function generateTestJwt(payload?: Partial<FakeJwtPayload>): string {
  const merged = { ...DEFAULT_USER_PAYLOAD, ...payload };
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(merged)).toString('base64url');
  const signature = Buffer.from('fake-signature').toString('base64url');
  return `${header}.${body}.${signature}`;
}

export function generateAdminJwt(payload?: Partial<FakeJwtPayload>): string {
  return generateTestJwt({ ...DEFAULT_ADMIN_PAYLOAD, ...payload });
}

export function generateCandidateJwt(
  payload?: Partial<FakeJwtPayload>,
): string {
  return generateTestJwt({ ...DEFAULT_CANDIDATE_PAYLOAD, ...payload });
}

export function generateHrJwt(payload?: Partial<FakeJwtPayload>): string {
  return generateTestJwt({ ...DEFAULT_USER_PAYLOAD, ...payload });
}

/**
 * Decodes the fake JWT to extract the payload.
 */
function decodeFakeJwt(token: string): FakeJwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
}

// ============================================================================
// Mock OidcService
// ============================================================================

class MockOidcService {
  async ensureDiscovery(): Promise<void> {
    // No-op
  }

  async getDiscovery() {
    return {
      issuer: 'http://localhost:8090/realms/ai-video-interview',
      authorization_endpoint:
        'http://localhost:8090/realms/ai-video-interview/protocol/openid-connect/auth',
      token_endpoint:
        'http://localhost:8090/realms/ai-video-interview/protocol/openid-connect/token',
      jwks_uri:
        'http://localhost:8090/realms/ai-video-interview/protocol/openid-connect/certs',
    };
  }

  async verifyAccessToken(token: string): Promise<{ payload: any }> {
    try {
      const payload = decodeFakeJwt(token);
      return { payload };
    } catch {
      throw new Error('Invalid token');
    }
  }

  async revokeToken(): Promise<void> {
    // No-op
  }
}

// ============================================================================
// Mock RegistrationSaga
// ============================================================================

class MockRegistrationSaga {
  async ensureUserExists(dto: {
    keycloakId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }) {
    return {
      userId: `user-${dto.keycloakId}`,
      email: dto.email,
      firstName: dto.firstName || 'Test',
      lastName: dto.lastName || 'User',
      isNew: false,
    };
  }

  onModuleDestroy() {
    // No-op
  }
}

// ============================================================================
// createTestApp
// ============================================================================

export async function createTestApp(): Promise<{
  app: INestApplication;
  circuitBreakerRegistry: CircuitBreakerRegistry;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(OidcService)
    .useClass(MockOidcService)
    .overrideProvider(RegistrationSaga)
    .useClass(MockRegistrationSaga)
    .overrideProvider('KAFKA_SERVICE')
    .useValue({
      connect: jest.fn(),
      disconnect: jest.fn(),
      publish: jest.fn(),
      subscribe: jest.fn(),
      isConnected: jest.fn().mockReturnValue(false),
    })
    .compile();

  const app = moduleFixture.createNestApplication();

  // Note: Do NOT add useGlobalPipes here — AppModule already registers
  // a ValidationPipe via APP_PIPE with whitelist + forbidNonWhitelisted.
  // Adding another pipe would cause double validation.

  await app.init();

  const circuitBreakerRegistry = app.get(CircuitBreakerRegistry);

  return { app, circuitBreakerRegistry };
}

// ============================================================================
// Re-exports for convenience
// ============================================================================
export {
  DEFAULT_USER_PAYLOAD,
  DEFAULT_ADMIN_PAYLOAD,
  DEFAULT_CANDIDATE_PAYLOAD,
};
export type { FakeJwtPayload };
