import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import {
  createTestApp,
  generateHrJwt,
  generateCandidateJwt,
  DEFAULT_USER_PAYLOAD,
  DEFAULT_CANDIDATE_PAYLOAD,
} from './helpers/test-app';
import {
  mockInterviewServiceGet,
  mockInterviewServicePost,
  mockInterviewServiceDown,
} from './helpers/downstream-mocks';

describe('Interview Service Proxy (E2E)', () => {
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

  describe('Templates', () => {
    describe('GET /api/templates', () => {
      it('should proxy list templates request to interview-service', async () => {
        const token = generateHrJwt();

        mockInterviewServiceGet(/\/api\/templates/, {
          items: [
            { id: 'tmpl-1', title: 'Backend Interview', status: 'active' },
            { id: 'tmpl-2', title: 'Frontend Interview', status: 'draft' },
          ],
          total: 2,
          page: 1,
          limit: 10,
        });

        const res = await request(app.getHttpServer())
          .get('/api/templates')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(res.body).toHaveProperty('items');
        expect(res.body.items).toHaveLength(2);
        expect(res.body.items[0]).toHaveProperty('title', 'Backend Interview');
      });
    });

    describe('POST /api/templates', () => {
      it('should return 400 due to ValidationPipe rejecting CreateTemplateDto properties (no class-validator decorators)', async () => {
        const token = generateHrJwt();

        // CreateTemplateDto has no class-validator decorators on its properties.
        // ValidationPipe with forbidNonWhitelisted rejects any body properties.
        const res = await request(app.getHttpServer())
          .post('/api/templates')
          .set('Authorization', `Bearer ${token}`)
          .send({ title: 'Test', description: 'Test' })
          .expect(400);

        expect(res.body).toHaveProperty('success', false);
      });
    });

    describe('GET /api/templates/:id', () => {
      it('should proxy get template by ID', async () => {
        const token = generateHrJwt();
        const templateId = 'tmpl-uuid-123';

        mockInterviewServiceGet(`/api/templates/${templateId}`, {
          id: templateId,
          title: 'Backend Developer Interview',
          status: 'active',
          questions: [],
        });

        const res = await request(app.getHttpServer())
          .get(`/api/templates/${templateId}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(res.body).toHaveProperty('id', templateId);
        expect(res.body).toHaveProperty('title', 'Backend Developer Interview');
      });
    });
  });

  describe('Invitations', () => {
    describe('POST /api/invitations', () => {
      it('should proxy create invitation request with valid DTO', async () => {
        const token = generateHrJwt();

        mockInterviewServicePost('/api/invitations', { id: 'inv-uuid-001' });

        // CreateInvitationDto requires: templateId (UUID), candidateId (UUID),
        // companyName (string), expiresAt (ISO date)
        const res = await request(app.getHttpServer())
          .post('/api/invitations')
          .set('Authorization', `Bearer ${token}`)
          .send({
            templateId: '550e8400-e29b-41d4-a716-446655440000',
            candidateId: '550e8400-e29b-41d4-a716-446655440001',
            companyName: 'TechCorp Inc.',
            expiresAt: '2026-12-31T23:59:59Z',
          })
          .expect(201);

        expect(res.body).toHaveProperty('id', 'inv-uuid-001');
      });
    });

    describe('GET /api/invitations/:id', () => {
      it('should proxy get invitation by ID', async () => {
        const token = generateCandidateJwt();
        const invitationId = 'inv-uuid-001';

        mockInterviewServiceGet(`/api/invitations/${invitationId}`, {
          id: invitationId,
          templateId: 'tmpl-uuid-123',
          candidateId: `user-${DEFAULT_CANDIDATE_PAYLOAD.sub}`,
          status: 'pending',
        });

        const res = await request(app.getHttpServer())
          .get(`/api/invitations/${invitationId}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(res.body).toHaveProperty('id', invitationId);
        expect(res.body).toHaveProperty('status', 'pending');
      });
    });
  });

  describe('Header forwarding', () => {
    it('should forward x-user-id and x-user-role headers to interview-service', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      nock('http://localhost:8003', {
        reqheaders: {
          'x-user-id': userId,
          'x-user-role': 'hr',
          'x-internal-request': 'true',
        },
      })
        .get(/\/api\/templates/)
        .reply(200, { items: [], total: 0, page: 1, limit: 10 });

      await request(app.getHttpServer())
        .get('/api/templates')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('Error handling', () => {
    it('should return 400 when interview-service is down (statusCode=0, default auth error)', async () => {
      const token = generateHrJwt();

      mockInterviewServiceDown(/\/api\/templates/);

      // ServiceProxyError with statusCode=0 (network error) -> default auth error -> 400
      const res = await request(app.getHttpServer())
        .get('/api/templates')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('code', 'AUTH_ERROR');
    });

    it('should return 404 for 404 from interview-service (ServiceProxyError pass-through)', async () => {
      const token = generateHrJwt();
      const templateId = 'non-existent-id';

      mockInterviewServiceGet(
        `/api/templates/${templateId}`,
        { message: 'Template not found' },
        404,
      );

      // ServiceProxyError with statusCode=404 (< 500) -> pass-through 404
      const res = await request(app.getHttpServer())
        .get(`/api/templates/${templateId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
    });
  });
});
