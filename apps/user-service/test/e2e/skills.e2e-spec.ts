import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { InternalServiceGuard } from '../../src/infrastructure/http/guards/internal-service.guard';
import { OutboxService } from '../../src/infrastructure/messaging/outbox/outbox.service';
import { DomainExceptionFilter } from '../../src/infrastructure/http/filters/domain-exception.filter';
import { TestInternalServiceGuard } from './test-auth.guard';
import { createE2EDataSource, cleanE2EDatabase } from './test-database.setup';
import {
  TestApplicationModule,
  mockOutboxService,
  mockStorageService,
} from './test-application.module';

describe('Skills API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdSkillId: string;
  let categoryId: string;

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
      .overrideProvider(OutboxService)
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

    // Ensure skill categories exist
    const categories = await dataSource.query('SELECT id FROM skill_categories LIMIT 1');
    if (categories.length === 0) {
      const testCategoryId = uuidv4(); // Use valid UUID v4
      await dataSource.query(`
        INSERT INTO skill_categories (id, name, slug, sort_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
      `, [testCategoryId, 'Programming', 'programming', 1]);
      categoryId = testCategoryId;
    } else {
      categoryId = categories[0].id;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean only skills, keep skill_categories
    await dataSource.query(`
      TRUNCATE TABLE skills RESTART IDENTITY CASCADE
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

  describe('GET /skills/categories', () => {
    it('should list all skill categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/skills/categories')
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('slug');
    });

    it('should reject without internal token', async () => {
      await request(app.getHttpServer())
        .get('/skills/categories')
        .expect(401);
    });
  });

  describe('POST /skills', () => {
    it('should create a new skill', async () => {
      const skillData = {
        name: 'E2E Test Skill',
        slug: 'e2e-test-skill',
        categoryId: categoryId,
        description: 'Skill created in E2E test',
        adminId: uuidv4(),
      };

      const response = await request(app.getHttpServer())
        .post('/skills')
        .set('x-internal-token', 'test-token')
        .send(skillData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('skillId');

      createdSkillId = response.body.data.skillId;
    });

    it('should reject skill without name', async () => {
      const invalidData = {
        slug: 'test-slug',
      };

      await request(app.getHttpServer())
        .post('/skills')
        .set('x-internal-token', 'test-token')
        .send(invalidData)
        .expect(400);
    });

    it('should reject duplicate skill', async () => {
      const skillData = {
        name: 'Duplicate Skill Test',
        slug: 'duplicate-skill-test',
        categoryId: categoryId,
        description: 'First time',
      };

      // Create skill first time
      await request(app.getHttpServer())
        .post('/skills')
        .set('x-internal-token', 'test-token')
        .send(skillData)
        .expect(201);

      // Try to create again - should get 409
      await request(app.getHttpServer())
        .post('/skills')
        .set('x-internal-token', 'test-token')
        .send(skillData)
        .expect(409);
    });
  });

  describe('GET /skills', () => {
    beforeEach(async () => {
      // Create test skill
      const skillData = {
        name: 'Listable Skill',
        slug: 'listable-skill',
        categoryId: categoryId,
        description: 'Test skill for listing',
      };

      const response = await request(app.getHttpServer())
        .post('/skills')
        .set('x-internal-token', 'test-token')
        .send(skillData)
        .expect(201);

      createdSkillId = response.body.data.skillId;
    });

    it('should list skills with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/skills?page=1&limit=10')
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });

    it('should filter skills by category', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skills?categoryId=${categoryId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should search skills by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/skills?search=Listable')
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /skills/:id', () => {
    beforeEach(async () => {
      const skillData = {
        name: 'Gettable Skill',
        slug: 'gettable-skill',
        categoryId: categoryId,
      };

      const response = await request(app.getHttpServer())
        .post('/skills')
        .set('x-internal-token', 'test-token')
        .send(skillData)
        .expect(201);

      createdSkillId = response.body.data.skillId;
    });

    it('should get skill by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skills/${createdSkillId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', createdSkillId);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data.name).toBe('Gettable Skill');
    });

    it('should return 404 for non-existent skill', async () => {
      const fakeId = uuidv4();
      await request(app.getHttpServer())
        .get(`/skills/${fakeId}`)
        .set('x-internal-token', 'test-token')
        .expect(404);
    });
  });

  describe('PUT /skills/:id', () => {
    beforeEach(async () => {
      const skillData = {
        name: 'Updatable Skill',
        slug: 'updatable-skill',
        categoryId: categoryId,
      };

      const response = await request(app.getHttpServer())
        .post('/skills')
        .set('x-internal-token', 'test-token')
        .send(skillData)
        .expect(201);

      createdSkillId = response.body.data.skillId;
    });

    it('should update skill', async () => {
      const updateData = {
        name: 'Updated Skill Name',
        description: 'Updated description',
      };

      await request(app.getHttpServer())
        .put(`/skills/${createdSkillId}`)
        .set('x-internal-token', 'test-token')
        .send(updateData)
        .expect(200);

      // Verify update by fetching
      const getResponse = await request(app.getHttpServer())
        .get(`/skills/${createdSkillId}`)
        .set('x-internal-token', 'test-token');

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.name).toBe(updateData.name);
    });

    it('should return 404 for non-existent skill', async () => {
      const fakeId = uuidv4();
      const updateData = {
        name: 'Updated Name',
      };

      await request(app.getHttpServer())
        .put(`/skills/${fakeId}`)
        .set('x-internal-token', 'test-token')
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /skills/:id', () => {
    beforeEach(async () => {
      const skillData = {
        name: 'Deletable Skill',
        slug: 'deletable-skill',
        categoryId: categoryId,
      };

      const response = await request(app.getHttpServer())
        .post('/skills')
        .set('x-internal-token', 'test-token')
        .send(skillData)
        .expect(201);

      createdSkillId = response.body.data.skillId;
    });

    it('should delete skill', async () => {
      await request(app.getHttpServer())
        .delete(`/skills/${createdSkillId}`)
        .set('x-internal-token', 'test-token')
        .expect(204);

      // Verify skill is deleted
      await request(app.getHttpServer())
        .get(`/skills/${createdSkillId}`)
        .set('x-internal-token', 'test-token')
        .expect(404);
    });

    it('should return 404 for non-existent skill', async () => {
      const fakeId = uuidv4();
      await request(app.getHttpServer())
        .delete(`/skills/${fakeId}`)
        .set('x-internal-token', 'test-token')
        .expect(404);
    });
  });

  describe('Authentication', () => {
    it('should reject all endpoints without internal token', async () => {
      await request(app.getHttpServer()).get('/skills').expect(401);
      await request(app.getHttpServer()).get('/skills/categories').expect(401);
      await request(app.getHttpServer()).post('/skills').expect(401);
      await request(app.getHttpServer()).put(`/skills/${uuidv4()}`).expect(401);
      await request(app.getHttpServer()).delete(`/skills/${uuidv4()}`).expect(401);
    });
  });
});
