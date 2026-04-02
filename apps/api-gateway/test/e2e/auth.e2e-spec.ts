import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import {
  createTestApp,
  generateTestJwt,
  generateHrJwt,
  DEFAULT_USER_PAYLOAD,
} from './helpers/test-app';
import { mockUserServiceGetUser } from './helpers/downstream-mocks';

describe('Authentication & Authorization (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    const testApp = await createTestApp();
    app = testApp.app;
  });

  afterAll(async () => {
    await app.close();
    nock.enableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('JWT Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 when token is malformed', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', 'Bearer not-a-valid-token')
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });

    it('should return 200 when valid token is provided', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      // Mock user-service response for GET /users/:userId
      mockUserServiceGetUser(userId, { email: 'test@example.com' });

      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('email', 'test@example.com');
    });

    it('should accept token from access_token cookie', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      mockUserServiceGetUser(userId);

      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Cookie', `access_token=${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', userId);
    });
  });

  describe('Correlation ID propagation', () => {
    it('should generate and return x-correlation-id header', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      mockUserServiceGetUser(userId);

      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.headers).toHaveProperty('x-correlation-id');
      expect(res.headers['x-correlation-id']).toBeTruthy();
    });

    it('should preserve incoming x-correlation-id header', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;
      const correlationId = 'test-correlation-id-12345';

      mockUserServiceGetUser(userId);

      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .set('x-correlation-id', correlationId)
        .expect(200);

      expect(res.headers['x-correlation-id']).toBe(correlationId);
    });

    it('should forward x-correlation-id to downstream services', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;
      const correlationId = 'propagation-test-id';

      // Verify the header is forwarded by checking nock matched correctly
      nock('http://localhost:8002', {
        reqheaders: {
          'x-correlation-id': correlationId,
        },
      })
        .get(`/users/${userId}`)
        .reply(200, {
          id: userId,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        });

      await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .set('x-correlation-id', correlationId)
        .expect(200);
    });
  });

  describe('Header forwarding to downstream', () => {
    it('should forward x-internal-request header to downstream', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      nock('http://localhost:8002', {
        reqheaders: {
          'x-internal-request': 'true',
        },
      })
        .get(`/users/${userId}`)
        .reply(200, {
          id: userId,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        });

      await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
