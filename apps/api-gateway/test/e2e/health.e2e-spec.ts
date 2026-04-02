import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import { createTestApp } from './helpers/test-app';
import {
  mockAllServicesHealthy,
  mockUserServiceHealth,
  mockInterviewServiceHealth,
  mockAnalysisServiceHealth,
} from './helpers/downstream-mocks';

describe('Health & Infrastructure (E2E)', () => {
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

  describe('GET /health', () => {
    it('should return 200 with healthy status when all services are up', async () => {
      mockAllServicesHealthy();

      const res = await request(app.getHttpServer()).get('/health').expect(200);

      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('services');
      expect(res.body.status).toBe('healthy');
      expect(res.body.services['user-service']).toHaveProperty('status', 'up');
      expect(res.body.services['interview-service']).toHaveProperty(
        'status',
        'up',
      );
      expect(res.body.services['analysis-service']).toHaveProperty(
        'status',
        'up',
      );
    });

    it('should return degraded status when a service is down', async () => {
      // user-service is down (nock not set, will get ECONNREFUSED or no interceptor)
      mockInterviewServiceHealth('up');
      mockAnalysisServiceHealth('up');
      // user-service probe will fail because no nock interceptor is set

      // Mock user-service to fail
      nock('http://localhost:8002')
        .get('/health')
        .replyWithError({
          code: 'ECONNREFUSED',
          message: 'Connection refused',
        });

      const res = await request(app.getHttpServer()).get('/health').expect(200);

      expect(res.body.status).toBe('degraded');
      expect(res.body.services['user-service'].status).toBe('down');
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 with alive status', async () => {
      const res = await request(app.getHttpServer())
        .get('/health/live')
        .expect(200);

      expect(res.body).toHaveProperty('alive', true);
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 with ready status', async () => {
      const res = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(200);

      expect(res.body).toHaveProperty('ready', true);
    });
  });
});
