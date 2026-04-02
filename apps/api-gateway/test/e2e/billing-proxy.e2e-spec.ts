import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import {
  createTestApp,
  generateHrJwt,
  generateAdminJwt,
  DEFAULT_USER_PAYLOAD,
  DEFAULT_ADMIN_PAYLOAD,
} from './helpers/test-app';
import {
  mockBillingServiceGet,
  mockBillingServicePost,
} from './helpers/downstream-mocks';

describe('Billing Service Proxy (E2E)', () => {
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

  describe('GET /api/billing/plans', () => {
    it('should return billing plans (public endpoint, no auth required)', async () => {
      mockBillingServiceGet(
        '/api/billing/plans',
        {
          plans: [
            { id: 'free', name: 'Free', price: 0 },
            { id: 'pro', name: 'Pro', price: 49 },
          ],
        },
        200,
      );

      const res = await request(app.getHttpServer())
        .get('/api/billing/plans')
        .expect(200);

      expect(res.body).toHaveProperty('plans');
      expect(res.body.plans).toHaveLength(2);
    });
  });

  describe('GET /api/billing/subscription', () => {
    it('should proxy subscription request with company context', async () => {
      const token = generateHrJwt({ companyId: 'company-001' });

      mockBillingServiceGet(
        '/api/billing/subscription',
        {
          planType: 'pro',
          status: 'active',
          companyId: 'company-001',
        },
        200,
      );

      const res = await request(app.getHttpServer())
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${token}`)
        .set('x-company-id', 'company-001')
        .expect(200);

      expect(res.body).toHaveProperty('planType', 'pro');
      expect(res.body).toHaveProperty('status', 'active');
    });
  });

  describe('POST /api/billing/checkout', () => {
    it('should proxy checkout session creation', async () => {
      const token = generateHrJwt({ companyId: 'company-001' });

      mockBillingServicePost(
        '/api/billing/checkout',
        {
          sessionUrl: 'https://checkout.stripe.com/session/xxx',
        },
        200,
      );

      // NestJS returns 201 for POST by default (no @HttpCode on this endpoint)
      const res = await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${token}`)
        .set('x-company-id', 'company-001')
        .send({ planType: 'pro' })
        .expect(201);

      expect(res.body).toHaveProperty('sessionUrl');
    });
  });

  describe('POST /api/billing/cancel', () => {
    it('should proxy subscription cancellation', async () => {
      const token = generateHrJwt({ companyId: 'company-001' });

      mockBillingServicePost(
        '/api/billing/cancel',
        {
          success: true,
          message: 'Subscription cancelled',
        },
        200,
      );

      // NestJS returns 201 for POST by default (no @HttpCode on this endpoint)
      const res = await request(app.getHttpServer())
        .post('/api/billing/cancel')
        .set('Authorization', `Bearer ${token}`)
        .set('x-company-id', 'company-001')
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('Error handling', () => {
    it('should return 400 when billing-service is down (AuthErrorInterceptor remaps)', async () => {
      const token = generateHrJwt({ companyId: 'company-001' });

      nock('http://localhost:8007')
        .get('/api/billing/subscription')
        .replyWithError({
          code: 'ECONNREFUSED',
          message: 'Connection refused',
        });

      // ServiceProxyError -> AuthErrorInterceptor -> 400 AUTH_ERROR
      const res = await request(app.getHttpServer())
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${token}`)
        .set('x-company-id', 'company-001')
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('code', 'AUTH_ERROR');
    });
  });
});
