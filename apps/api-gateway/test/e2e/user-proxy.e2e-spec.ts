import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import {
  createTestApp,
  generateHrJwt,
  DEFAULT_USER_PAYLOAD,
} from './helpers/test-app';
import { CircuitBreakerRegistry } from '../../src/core/circuit-breaker/circuit-breaker-registry.service';
import {
  mockUserServiceGet,
  mockUserServicePut,
  mockUserServiceGetUser,
} from './helpers/downstream-mocks';

describe('User Service Proxy (E2E)', () => {
  let app: INestApplication;
  let circuitBreakerRegistry: CircuitBreakerRegistry;

  beforeAll(async () => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    const testApp = await createTestApp();
    app = testApp.app;
    circuitBreakerRegistry = testApp.circuitBreakerRegistry;
  });

  afterAll(async () => {
    await app.close();
    nock.enableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    circuitBreakerRegistry.resetAll();
  });

  describe('GET /api/users/me', () => {
    it('should proxy to user-service and return user profile', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      mockUserServiceGetUser(userId, {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('email', 'test@example.com');
      expect(res.body).toHaveProperty('firstName', 'Test');
      expect(res.body).toHaveProperty('lastName', 'User');
    });

    it('should return 404 when user not found in user-service (mapUserError)', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      mockUserServiceGet(
        `/users/${userId}`,
        { message: 'User not found' },
        404,
      );

      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // mapUserError wraps 404 into HttpException, AuthErrorInterceptor preserves status
      expect(res.body).toHaveProperty('success', false);
      // AuthErrorInterceptor sets code to 'INTERNAL_ERROR' for HttpException branch
      expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
    });

    it('should return 502 when user-service returns 500 (ServiceProxyError pass-through)', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      mockUserServiceGet(
        `/users/${userId}`,
        { message: 'Internal server error' },
        500,
      );

      // ServiceProxyError with statusCode=500 (>= 500) -> 502 Bad Gateway
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(502);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('code', 'SERVICE_ERROR');
    });
  });

  describe('PUT /api/users/me', () => {
    it('should return 400 due to ValidationPipe rejecting UpdateProfileDto (no class-validator decorators)', async () => {
      const token = generateHrJwt();

      // UpdateProfileDto has no class-validator decorators on its properties.
      // ValidationPipe with forbidNonWhitelisted rejects any body properties
      // that are not decorated with class-validator decorators.
      const res = await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Test', lastName: 'User' })
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/users/me/permissions', () => {
    it('should proxy permissions request to user-service', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      // getUserPermissions expects response like { data: ... } from downstream
      mockUserServiceGet(`/users/${userId}/permissions`, {
        data: {
          role: 'hr',
          permissions: ['create:template', 'create:invitation'],
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/users/me/permissions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('role', 'hr');
      expect(res.body).toHaveProperty('permissions');
    });
  });

  describe('GET /api/users/me/companies', () => {
    it('should proxy companies request to user-service', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      // getUserCompanies expects response like { data: [...] } from downstream
      // and adds query params (currentUserId, isAdmin)
      nock('http://localhost:8002')
        .get(`/users/${userId}/companies`)
        .query(true) // Accept any query params
        .reply(200, {
          data: [{ id: 'company-1', name: 'Test Company' }],
        });

      const res = await request(app.getHttpServer())
        .get('/api/users/me/companies')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('name', 'Test Company');
    });
  });

  describe('Downstream error passthrough', () => {
    it('should return 400 for ServiceProxyError from downstream 400', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      mockUserServicePut(`/users/${userId}`, { message: 'Invalid input' }, 400);

      const res = await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 400 when user-service is unreachable (statusCode=0, default auth error)', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      nock('http://localhost:8002').get(`/users/${userId}`).replyWithError({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('code', 'AUTH_ERROR');
    });
  });
});
