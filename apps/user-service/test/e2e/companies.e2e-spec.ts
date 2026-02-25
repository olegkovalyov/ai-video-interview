import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { InternalServiceGuard } from '../../src/infrastructure/http/guards/internal-service.guard';
import { DomainExceptionFilter } from '../../src/infrastructure/http/filters/domain-exception.filter';
import { TestInternalServiceGuard } from './test-auth.guard';
import { createE2EDataSource, cleanE2EDatabase } from './test-database.setup';
import {
  TestApplicationModule,
  mockOutboxService,
  mockStorageService,
} from './test-application.module';

describe('Companies API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdCompanyId: string;
  let hrUserId: string;

  beforeAll(async () => {
    dataSource = await createE2EDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestApplicationModule],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .overrideProvider('KAFKA_SERVICE')
      .useValue({
        connect: jest.fn(),
        disconnect: jest.fn(),
        publishEvent: jest.fn(),
      })
      .overrideProvider('IOutboxService')
      .useValue(mockOutboxService)
      .overrideProvider('IStorageService')
      .useValue(mockStorageService)
      .overrideGuard(InternalServiceGuard)
      .useClass(TestInternalServiceGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    // Create HR user for tests
    hrUserId = uuidv4();
    const hrEmail = `hr-${Date.now()}@test.com`;
    await dataSource.query(`
      INSERT INTO users (id, external_auth_id, email, first_name, last_name, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [hrUserId, uuidv4(), hrEmail, 'HR', 'User', 'hr', 'active']);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean only companies and user_companies, keep users
    await dataSource.query(`
      TRUNCATE TABLE user_companies, companies RESTART IDENTITY CASCADE
    `);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('POST /companies', () => {
    it('should create a new company', async () => {
      const companyData = {
        name: 'E2E Test Company',
        industry: 'Software Development',
        size: '51-200',
        website: 'https://e2etest.com',
        description: 'Company created in E2E test',
        location: 'San Francisco, CA',
        createdBy: hrUserId,
      };

      const response = await request(app.getHttpServer())
        .post('/companies')
        .set('x-internal-token', 'test-token')
        .send(companyData)
        .expect(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('companyId');

      createdCompanyId = response.body.data.companyId;
    });

    it('should reject company without required fields', async () => {
      const invalidData = {
        name: 'Incomplete Company',
        createdBy: hrUserId,
        // missing industry and size - required fields
      };

      await request(app.getHttpServer())
        .post('/companies')
        .set('x-internal-token', 'test-token')
        .send(invalidData)
        .expect(400);
    });

    it('should validate website URL format', async () => {
      const invalidData = {
        name: 'Invalid URL Company',
        industry: 'Tech',
        size: '1-10',
        website: 'not-a-valid-url',
        createdBy: hrUserId,
      };

      await request(app.getHttpServer())
        .post('/companies')
        .set('x-internal-token', 'test-token')
        .send(invalidData)
        .expect(400);
    });

    it('should reject duplicate company', async () => {
      const companyData = {
        name: 'Duplicate Company Test',
        industry: 'Software',
        size: '51-200',
        createdBy: hrUserId,
      };

      // Create company first time
      await request(app.getHttpServer())
        .post('/companies')
        .set('x-internal-token', 'test-token')
        .send(companyData)
        .expect(201);

      // Try to create again - should get 409
      await request(app.getHttpServer())
        .post('/companies')
        .set('x-internal-token', 'test-token')
        .send(companyData)
        .expect(409);
    });
  });

  describe('GET /companies', () => {
    beforeEach(async () => {
      // Create test company
      const companyData = {
        name: 'Listable Company',
        industry: 'Technology',
        size: '11-50',
        createdBy: hrUserId,
      };

      const response = await request(app.getHttpServer())
        .post('/companies')
        .set('x-internal-token', 'test-token')
        .send(companyData)
        .expect(201);

      createdCompanyId = response.body.data.companyId;
    });

    it('should list companies with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/companies?page=1&limit=10')
        .set('x-internal-token', 'test-token')
        .expect(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should filter companies by industry', async () => {
      const response = await request(app.getHttpServer())
        .get('/companies?industry=Technology')
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should search companies by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/companies?search=Listable')
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by HR user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/companies?createdBy=${hrUserId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /companies/:id', () => {
    beforeEach(async () => {
      const companyData = {
        name: 'Gettable Company',
        industry: 'Software',
        size: '200+',
        createdBy: hrUserId,
      };

      const response = await request(app.getHttpServer())
        .post('/companies')
        .set('x-internal-token', 'test-token')
        .send(companyData)
        .expect(201);

      createdCompanyId = response.body.data.companyId;
    });

    it('should get company by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/companies/${createdCompanyId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', createdCompanyId);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data.name).toBe('Gettable Company');
    });

    it('should return 404 for non-existent company', async () => {
      const fakeId = uuidv4();
      await request(app.getHttpServer())
        .get(`/companies/${fakeId}`)
        .set('x-internal-token', 'test-token')
        .expect(404);
    });
  });

  describe('PUT /companies/:id', () => {
    beforeEach(async () => {
      const companyData = {
        name: 'Updatable Company',
        industry: 'Tech',
        size: '11-50',
        createdBy: hrUserId,
      };

      const response = await request(app.getHttpServer())
        .post('/companies')
        .set('x-internal-token', 'test-token')
        .send(companyData)
        .expect(201);

      createdCompanyId = response.body.data.companyId;
    });

    it('should update company', async () => {
      const updateData = {
        name: 'Updated Company Name',
        industry: 'Updated Industry',
        description: 'Updated description',
        updatedBy: hrUserId,
      };

      await request(app.getHttpServer())
        .put(`/companies/${createdCompanyId}`)
        .set('x-internal-token', 'test-token')
        .send(updateData)
        .expect(200);

      // Verify by fetching
      const getResponse = await request(app.getHttpServer())
        .get(`/companies/${createdCompanyId}`)
        .set('x-internal-token', 'test-token');

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.name).toBe(updateData.name);
    });

    it('should return 404 for non-existent company', async () => {
      const fakeId = uuidv4();
      const updateData = {
        name: 'Updated Name',
        updatedBy: hrUserId,
      };

      await request(app.getHttpServer())
        .put(`/companies/${fakeId}`)
        .set('x-internal-token', 'test-token')
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /companies/:id', () => {
    beforeEach(async () => {
      const companyData = {
        name: 'Deletable Company',
        industry: 'Tech',
        size: '1-10',
        createdBy: hrUserId,
      };

      const response = await request(app.getHttpServer())
        .post('/companies')
        .set('x-internal-token', 'test-token')
        .send(companyData)
        .expect(201);

      createdCompanyId = response.body.data.companyId;
    });

    it('should delete company', async () => {
      await request(app.getHttpServer())
        .delete(`/companies/${createdCompanyId}?userId=${hrUserId}`)
        .set('x-internal-token', 'test-token')
        .expect(204);

      // Verify company is deleted
      await request(app.getHttpServer())
        .get(`/companies/${createdCompanyId}`)
        .set('x-internal-token', 'test-token')
        .expect(404);
    });

    it('should return 404 for non-existent company', async () => {
      const fakeId = uuidv4();
      await request(app.getHttpServer())
        .delete(`/companies/${fakeId}?userId=${hrUserId}`)
        .set('x-internal-token', 'test-token')
        .expect(404);
    });
  });

  describe('Authentication', () => {
    it('should reject all endpoints without internal token', async () => {
      await request(app.getHttpServer()).get('/companies').expect(401);
      await request(app.getHttpServer()).post('/companies').expect(401);
      await request(app.getHttpServer()).get(`/companies/${uuidv4()}`).expect(401);
      await request(app.getHttpServer()).put(`/companies/${uuidv4()}`).expect(401);
      await request(app.getHttpServer()).delete(`/companies/${uuidv4()}`).expect(401);
    });
  });
});
