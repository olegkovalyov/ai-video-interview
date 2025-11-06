import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { InternalServiceGuard } from '../../src/infrastructure/http/guards/internal-service.guard';
import { TestInternalServiceGuard } from './test-auth.guard';
import { createE2EDataSource, cleanE2EDatabase } from './test-database.setup';

describe('Templates API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let hrUserId: string;
  let hr2UserId: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Create test DataSource manually (like integration tests)
    dataSource = await createE2EDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource) // Override with our test DataSource
      .overrideGuard(InternalServiceGuard)
      .useClass(TestInternalServiceGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Setup validation pipe like in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Generate user IDs
    hrUserId = uuidv4();
    hr2UserId = uuidv4();
    adminUserId = uuidv4();
  });

  afterEach(async () => {
    // Clean database after each test
    await cleanE2EDatabase(dataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('POST /api/templates', () => {
    it('should create template (HR)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Frontend Developer Interview',
          description: 'Questions about React and TypeScript',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(typeof response.body.id).toBe('string');
    });

    it('should create template with custom settings (HR)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Backend Developer Interview',
          description: 'Node.js and databases',
          settings: {
            totalTimeLimit: 120,
            allowRetakes: true,
            showTimer: false,
            randomizeQuestions: true,
          },
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should work without headers (TestGuard provides defaults)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/templates')
        .send({
          title: 'Test',
          description: 'Test',
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
    });

    it('should reject with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: '', // Empty title
          description: 'Test',
        })
        .expect(400);
    });
  });

  describe('GET /api/templates', () => {
    let template1Id: string;
    let template2Id: string;
    let template3Id: string;

    beforeEach(async () => {
      // Create templates for HR1
      const res1 = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Template 1',
          description: 'Description 1',
        });
      template1Id = res1.body.id;

      const res2 = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Template 2',
          description: 'Description 2',
        });
      template2Id = res2.body.id;

      // Create template for HR2
      const res3 = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hr2UserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Template 3',
          description: 'Description 3',
        });
      template3Id = res3.body.id;
    });

    it('should return HR own templates only', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.items.every((t: any) => t.createdBy === hrUserId)).toBe(true);
    });

    it('should return all templates for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/templates')
        .set('x-user-id', adminUserId)
        .set('x-user-role', 'admin')
        .expect(200);

      expect(response.body.items).toHaveLength(3);
      expect(response.body.total).toBe(3);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/templates')
        .query({ page: 1, limit: 1 })
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.total).toBe(2);
      expect(response.body.totalPages).toBe(2);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/templates')
        .query({ status: 'draft' })
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(response.body.items.every((t: any) => t.status === 'draft')).toBe(true);
    });
  });

  describe('GET /api/templates/:id', () => {
    let templateId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Test Template',
          description: 'Test Description',
        });
      templateId = res.body.id;
    });

    it('should return template with questions', async () => {
      // Add question first
      await request(app.getHttpServer())
        .post(`/api/templates/${templateId}/questions`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          text: 'What is your experience?',
          type: 'video',
          order: 1,
          timeLimit: 120,
          required: true,
        });

      const response = await request(app.getHttpServer())
        .get(`/api/templates/${templateId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(response.body.id).toBe(templateId);
      expect(response.body.title).toBe('Test Template');
      expect(response.body.questions).toHaveLength(1);
      expect(response.body.questionsCount).toBe(1);
    });

    it('should reject access to other HR template', async () => {
      await request(app.getHttpServer())
        .get(`/api/templates/${templateId}`)
        .set('x-user-id', hr2UserId)
        .set('x-user-role', 'hr')
        .expect(403);
    });

    it('should allow admin to access any template', async () => {
      await request(app.getHttpServer())
        .get(`/api/templates/${templateId}`)
        .set('x-user-id', adminUserId)
        .set('x-user-role', 'admin')
        .expect(200);
    });

    it('should return 404 for non-existent template', async () => {
      const fakeId = uuidv4();
      await request(app.getHttpServer())
        .get(`/api/templates/${fakeId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(404);
    });
  });

  describe('POST /api/templates/:id/questions', () => {
    let templateId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Test Template',
          description: 'Test Description',
        });
      templateId = res.body.id;
    });

    it('should add question to template', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/templates/${templateId}/questions`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          text: 'Describe your experience with React',
          type: 'video',
          order: 1,
          timeLimit: 120,
          required: true,
          hints: 'Focus on hooks and state management',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should reject question with invalid type', async () => {
      await request(app.getHttpServer())
        .post(`/api/templates/${templateId}/questions`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          text: 'Test question?',
          type: 'invalid-type',
          order: 1,
          timeLimit: 120,
        })
        .expect(400); // ValidationPipe rejects invalid type
    });

    it('should reject question with short text', async () => {
      await request(app.getHttpServer())
        .post(`/api/templates/${templateId}/questions`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          text: 'Short', // Less than 10 chars
          type: 'video',
          order: 1,
          timeLimit: 120,
        })
        .expect(400); // ValidationPipe or domain validation error
    });

    it('should reject adding question to other HR template', async () => {
      await request(app.getHttpServer())
        .post(`/api/templates/${templateId}/questions`)
        .set('x-user-id', hr2UserId)
        .set('x-user-role', 'hr')
        .send({
          text: 'What is your experience?',
          type: 'video',
          order: 1,
          timeLimit: 120,
          required: true,
        })
        .expect(403);
    });
  });

  describe('DELETE /api/templates/:id/questions/:questionId', () => {
    let templateId: string;
    let questionId: string;

    beforeEach(async () => {
      const templateRes = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Test Template',
          description: 'Test Description',
        });
      templateId = templateRes.body.id;

      const questionRes = await request(app.getHttpServer())
        .post(`/api/templates/${templateId}/questions`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          text: 'What is your experience?',
          type: 'video',
          order: 1,
          timeLimit: 120,
          required: true,
        });
      questionId = questionRes.body.id;
    });

    it('should remove question from template', async () => {
      await request(app.getHttpServer())
        .delete(`/api/templates/${templateId}/questions/${questionId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(204);

      // Verify question removed
      const response = await request(app.getHttpServer())
        .get(`/api/templates/${templateId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(response.body.questions).toHaveLength(0);
    });

    it('should reject removing question from other HR template', async () => {
      await request(app.getHttpServer())
        .delete(`/api/templates/${templateId}/questions/${questionId}`)
        .set('x-user-id', hr2UserId)
        .set('x-user-role', 'hr')
        .expect(403);
    });
  });

  describe('PUT /api/templates/:id/publish', () => {
    let templateId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Test Template',
          description: 'Test Description',
        });
      templateId = res.body.id;
    });

    it('should publish template with questions', async () => {
      // Add question first
      await request(app.getHttpServer())
        .post(`/api/templates/${templateId}/questions`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          text: 'What is your experience?',
          type: 'video',
          order: 1,
          timeLimit: 120,
          required: true,
        });

      const response = await request(app.getHttpServer())
        .put(`/api/templates/${templateId}/publish`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(response.body.status).toBe('active');

      // Verify status changed
      const getResponse = await request(app.getHttpServer())
        .get(`/api/templates/${templateId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(getResponse.body.status).toBe('active');
    });

    it('should reject publishing template without questions', async () => {
      await request(app.getHttpServer())
        .put(`/api/templates/${templateId}/publish`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(500); // Domain error
    });

    it('should reject publishing other HR template', async () => {
      await request(app.getHttpServer())
        .put(`/api/templates/${templateId}/publish`)
        .set('x-user-id', hr2UserId)
        .set('x-user-role', 'hr')
        .expect(403);
    });
  });

  describe('PUT /api/templates/:id', () => {
    let templateId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Original Title',
          description: 'Original Description',
        });
      templateId = res.body.id;
    });

    it('should update template metadata', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/templates/${templateId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBe('Updated Description');
    });

    it('should update template settings', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/templates/${templateId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          settings: {
            totalTimeLimit: 180,
            allowRetakes: true,
            showTimer: false,
            randomizeQuestions: true,
          },
        })
        .expect(200);

      expect(response.body.settings.totalTimeLimit).toBe(180);
      expect(response.body.settings.allowRetakes).toBe(true);
    });

    it('should reject updating other HR template', async () => {
      await request(app.getHttpServer())
        .put(`/api/templates/${templateId}`)
        .set('x-user-id', hr2UserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Hacked Title',
        })
        .expect(403);
    });
  });

  describe('DELETE /api/templates/:id', () => {
    let templateId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Test Template',
          description: 'Test Description',
        });
      templateId = res.body.id;
    });

    it('should archive template (soft delete)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/templates/${templateId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(204);

      // Verify status changed to archived
      const response = await request(app.getHttpServer())
        .get(`/api/templates/${templateId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(response.body.status).toBe('archived');
    });

    it('should reject deleting other HR template', async () => {
      await request(app.getHttpServer())
        .delete(`/api/templates/${templateId}`)
        .set('x-user-id', hr2UserId)
        .set('x-user-role', 'hr')
        .expect(403);
    });
  });

  describe('GET /api/templates/:id/questions', () => {
    let templateId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Test Template',
          description: 'Test Description',
        });
      templateId = res.body.id;

      // Add 3 questions
      for (let i = 1; i <= 3; i++) {
        await request(app.getHttpServer())
          .post(`/api/templates/${templateId}/questions`)
          .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
          .send({
            text: `What is your experience with skill ${i}?`,
            type: 'video',
            order: i,
            timeLimit: 120,
            required: true,
          });
      }
    });

    it('should return all questions sorted by order', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/templates/${templateId}/questions`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(response.body.questions).toHaveLength(3);
      expect(response.body.questions[0].order).toBe(1);
      expect(response.body.questions[1].order).toBe(2);
      expect(response.body.questions[2].order).toBe(3);
    });
  });

  describe('Full Lifecycle E2E', () => {
    it('should complete full template lifecycle: create → add questions → publish → update → archive', async () => {
      // 1. Create template
      const createRes = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Full Lifecycle Test',
          description: 'Testing complete workflow',
        })
        .expect(201);

      const templateId = createRes.body.id;

      // 2. Add 3 questions
      await request(app.getHttpServer())
        .post(`/api/templates/${templateId}/questions`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          text: 'Tell me about your React experience',
          type: 'video',
          order: 1,
          timeLimit: 120,
          required: true,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/templates/${templateId}/questions`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          text: 'Describe your TypeScript skills',
          type: 'text',
          order: 2,
          timeLimit: 60,
          required: true,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/templates/${templateId}/questions`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          text: 'What is your biggest achievement?',
          type: 'video',
          order: 3,
          timeLimit: 180,
          required: true,
        })
        .expect(201);

      // 3. Verify draft status with 3 questions
      let template = await request(app.getHttpServer())
        .get(`/api/templates/${templateId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(template.body.status).toBe('draft');
      expect(template.body.questions).toHaveLength(3);

      // 4. Publish template
      await request(app.getHttpServer())
        .put(`/api/templates/${templateId}/publish`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      // 5. Verify active status
      template = await request(app.getHttpServer())
        .get(`/api/templates/${templateId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(template.body.status).toBe('active');

      // 6. Update template
      await request(app.getHttpServer())
        .put(`/api/templates/${templateId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Updated Lifecycle Test',
          settings: {
            totalTimeLimit: 180,
            allowRetakes: true,
            showTimer: true,
            randomizeQuestions: false,
          },
        })
        .expect(200);

      // 7. Archive template
      await request(app.getHttpServer())
        .delete(`/api/templates/${templateId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(204);

      // 8. Verify archived status and questions preserved
      template = await request(app.getHttpServer())
        .get(`/api/templates/${templateId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(template.body.status).toBe('archived');
      expect(template.body.questions).toHaveLength(3);
      expect(template.body.title).toBe('Updated Lifecycle Test');
    });
  });
});
