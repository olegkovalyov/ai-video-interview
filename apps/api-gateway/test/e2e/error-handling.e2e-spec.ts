import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import {
  createTestApp,
  generateHrJwt,
  DEFAULT_USER_PAYLOAD,
} from './helpers/test-app';
import { CircuitBreakerRegistry } from '../../src/core/circuit-breaker/circuit-breaker-registry.service';

/**
 * Error Handling E2E Tests
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * The AuthErrorInterceptor (APP_INTERCEPTOR) catches ALL errors from controllers,
 * including ServiceProxyError, BEFORE the ServiceProxyExceptionFilter (APP_FILTER)
 * gets a chance to handle them. This means:
 *
 * - HttpException errors: AuthErrorInterceptor preserves the original status code
 * - ServiceProxyError with statusCode > 0: pass-through (>= 500 mapped to 502, others keep original status)
 * - ServiceProxyError with statusCode 0 (network errors): falls to default auth error handler -> 400
 *
 * Some service clients (e.g., UserServiceClient.mapUserError) explicitly wrap
 * certain ServiceProxyErrors into HttpException (404, 409), preserving those status codes.
 *
 * These tests verify the ACTUAL behavior of the error handling pipeline.
 */
describe('Error Handling (E2E)', () => {
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

  describe('Downstream HTTP error codes mapped through UserServiceClient.mapUserError', () => {
    it('should return 404 when user-service returns 404 (mapped by mapUserError)', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      nock('http://localhost:8002')
        .get(`/users/${userId}`)
        .reply(404, { message: 'User not found' });

      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
    });
  });

  describe('Downstream HTTP error codes — ServiceProxyError pass-through', () => {
    it('should return 502 for ServiceProxyError with 500 status', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      nock('http://localhost:8002')
        .get(`/users/${userId}`)
        .reply(500, { message: 'Internal server error' });

      // ServiceProxyError with statusCode=500 (>= 500) -> 502 Bad Gateway
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(502);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('code', 'SERVICE_ERROR');
    });

    it('should return 403 for interview-service 403 (ServiceProxyError pass-through)', async () => {
      const token = generateHrJwt();

      nock('http://localhost:8003')
        .get(/\/api\/templates\/forbidden-id/)
        .reply(403, { message: 'Access denied: not the owner' });

      // ServiceProxyError with statusCode=403 (< 500) -> pass-through 403
      const res = await request(app.getHttpServer())
        .get('/api/templates/forbidden-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('Network errors', () => {
    it('should return 400 when downstream returns ECONNREFUSED (statusCode=0, default auth error)', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      nock('http://localhost:8002').get(`/users/${userId}`).replyWithError({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED 127.0.0.1:8002',
      });

      // ServiceProxyError with statusCode=0 -> AuthErrorInterceptor -> 400
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('code', 'AUTH_ERROR');
    });

    it('should return 400 when downstream connection is reset (statusCode=0, default auth error)', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      nock('http://localhost:8002').get(`/users/${userId}`).replyWithError({
        code: 'ECONNRESET',
        message: 'socket hang up',
      });

      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('Error response format', () => {
    it('should return standardized error response with timestamp and path', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      // Use 404 which goes through mapUserError -> HttpException(404)
      nock('http://localhost:8002')
        .get(`/users/${userId}`)
        .reply(404, { message: 'User not found' });

      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // HttpException from mapUserError passes through AuthErrorInterceptor
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
    });

    it('should include error code in response', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      nock('http://localhost:8002')
        .get(`/users/${userId}`)
        .reply(422, { message: 'Unprocessable entity' });

      // ServiceProxyError with statusCode=422 (< 500) -> pass-through 422
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(422);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('code', 'SERVICE_ERROR');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path', '/api/users/me');
    });
  });

  describe('Direct ServiceProxyError through interview-service (no mapUserError)', () => {
    it('should return 502 for interview-service 500 (ServiceProxyError pass-through)', async () => {
      const token = generateHrJwt();

      nock('http://localhost:8003')
        .get(/\/api\/templates/)
        .reply(500, { message: 'Interview service internal error' });

      // ServiceProxyError with statusCode=500 (>= 500) -> 502 Bad Gateway
      const res = await request(app.getHttpServer())
        .get('/api/templates')
        .set('Authorization', `Bearer ${token}`)
        .expect(502);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 400 for interview-service ECONNREFUSED (statusCode=0, default auth error)', async () => {
      const token = generateHrJwt();

      nock('http://localhost:8003')
        .get(/\/api\/templates/)
        .replyWithError({
          code: 'ECONNREFUSED',
          message: 'Connection refused',
        });

      const res = await request(app.getHttpServer())
        .get('/api/templates')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('code', 'AUTH_ERROR');
    });
  });
});
