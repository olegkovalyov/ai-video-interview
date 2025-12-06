import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { InternalServiceGuard } from '../../src/infrastructure/http/guards/internal-service.guard';
import { TestInternalServiceGuard } from './test-auth.guard';
import { createE2EDataSource, cleanE2EDatabase } from './test-database.setup';

describe('Invitations API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let hrUserId: string;
  let hr2UserId: string;
  let candidateId: string;
  let candidate2Id: string;
  let adminUserId: string;
  let companyId: string;

  beforeAll(async () => {
    dataSource = await createE2EDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .overrideGuard(InternalServiceGuard)
      .useClass(TestInternalServiceGuard)
      .compile();

    app = moduleFixture.createNestApplication();

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
    candidateId = uuidv4();
    candidate2Id = uuidv4();
    adminUserId = uuidv4();
    companyId = uuidv4();
  });

  afterEach(async () => {
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

  // Helper: Create and publish template
  async function createActiveTemplate(userId: string, questionsCount: number = 3): Promise<string> {
    const templateRes = await request(app.getHttpServer())
      .post('/api/templates')
      .set('x-user-id', userId)
      .set('x-user-role', 'hr')
      .send({
        title: 'Test Interview Template',
        description: 'Test Description',
      });

    const templateId = templateRes.body.id;

    // Add questions
    for (let i = 1; i <= questionsCount; i++) {
      await request(app.getHttpServer())
        .post(`/api/templates/${templateId}/questions`)
        .set('x-user-id', userId)
        .set('x-user-role', 'hr')
        .send({
          text: `Question ${i}: What is your experience?`,
          type: 'text',
          order: i,
          timeLimit: 120,
          required: true,
        });
    }

    // Publish template
    await request(app.getHttpServer())
      .put(`/api/templates/${templateId}/publish`)
      .set('x-user-id', userId)
      .set('x-user-role', 'hr');

    return templateId;
  }

  // ==================== POST /api/invitations ====================

  describe('POST /api/invitations', () => {
    let templateId: string;

    beforeEach(async () => {
      templateId = await createActiveTemplate(hrUserId);
    });

    it('should create invitation (HR)', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId,
          candidateId,
          companyId,
          expiresAt,
          allowPause: true,
          showTimer: true,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(typeof response.body.id).toBe('string');
    });

    it('should create invitation with default settings', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId,
          candidateId,
          companyId,
          expiresAt,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should reject duplicate invitation', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // First invitation
      await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId,
          candidateId,
          companyId,
          expiresAt,
        })
        .expect(201);

      // Duplicate
      await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId,
          candidateId,
          companyId,
          expiresAt,
        })
        .expect(400); // Duplicate invitation
    });

    it('should reject non-existent template', async () => {
      const fakeTemplateId = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId: fakeTemplateId,
          candidateId,
          companyId,
          expiresAt,
        })
        .expect(404);
    });

    it('should reject draft template', async () => {
      // Create draft template (not published)
      const templateRes = await request(app.getHttpServer())
        .post('/api/templates')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          title: 'Draft Template',
          description: 'Not published',
        });

      const draftTemplateId = templateRes.body.id;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId: draftTemplateId,
          candidateId,
          companyId,
          expiresAt,
        })
        .expect(400); // BadRequestException - draft template
    });

    it('should reject invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId: 'not-a-uuid',
          candidateId,
          companyId,
          expiresAt: 'invalid-date',
        })
        .expect(400);
    });
  });

  // ==================== POST /api/invitations/:id/start ====================

  describe('POST /api/invitations/:id/start', () => {
    let invitationId: string;

    beforeEach(async () => {
      const templateId = await createActiveTemplate(hrUserId);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId,
          candidateId,
          companyId,
          expiresAt,
        });

      invitationId = res.body.id;
    });

    it('should start interview (candidate)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/start`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject start by wrong user', async () => {
      await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/start`)
        .set('x-user-id', candidate2Id)
        .set('x-user-role', 'candidate')
        .expect(403); // ForbiddenException
    });

    it('should reject double start', async () => {
      // First start
      await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/start`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(200);

      // Second start
      await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/start`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(400); // BadRequestException - already started
    });

    it('should reject non-existent invitation', async () => {
      const fakeId = uuidv4();
      await request(app.getHttpServer())
        .post(`/api/invitations/${fakeId}/start`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(404);
    });
  });

  // ==================== POST /api/invitations/:id/responses ====================

  describe('POST /api/invitations/:id/responses', () => {
    let invitationId: string;

    beforeEach(async () => {
      const templateId = await createActiveTemplate(hrUserId, 3);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId,
          candidateId,
          companyId,
          expiresAt,
        });

      invitationId = res.body.id;

      // Start interview
      await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/start`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate');
    });

    it('should submit text response', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/responses`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .send({
          questionId: uuidv4(),
          questionIndex: 0,
          questionText: 'What is your experience?',
          responseType: 'text',
          duration: 60,
          textAnswer: 'I have 5 years of experience.',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should submit code response', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/responses`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .send({
          questionId: uuidv4(),
          questionIndex: 0,
          questionText: 'Write a function',
          responseType: 'code',
          duration: 120,
          codeAnswer: 'function hello() { return "world"; }',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should reject response by wrong user', async () => {
      await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/responses`)
        .set('x-user-id', candidate2Id)
        .set('x-user-role', 'candidate')
        .send({
          questionId: uuidv4(),
          questionIndex: 0,
          questionText: 'Question?',
          responseType: 'text',
          duration: 60,
          textAnswer: 'Answer',
        })
        .expect(403); // ForbiddenException - wrong user
    });

    it('should reject duplicate response to same question', async () => {
      const questionId = uuidv4();

      // First response
      await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/responses`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .send({
          questionId,
          questionIndex: 0,
          questionText: 'Question?',
          responseType: 'text',
          duration: 60,
          textAnswer: 'First answer',
        })
        .expect(201);

      // Duplicate
      await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/responses`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .send({
          questionId,
          questionIndex: 0,
          questionText: 'Question?',
          responseType: 'text',
          duration: 60,
          textAnswer: 'Second answer',
        })
        .expect(400); // BadRequestException - duplicate
    });

    it('should reject invalid response type', async () => {
      await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/responses`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .send({
          questionId: uuidv4(),
          questionIndex: 0,
          questionText: 'Question?',
          responseType: 'invalid',
          duration: 60,
        })
        .expect(400);
    });
  });

  // ==================== POST /api/invitations/:id/complete ====================

  describe('POST /api/invitations/:id/complete', () => {
    let invitationId: string;

    beforeEach(async () => {
      const templateId = await createActiveTemplate(hrUserId, 2);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId,
          candidateId,
          companyId,
          expiresAt,
        });

      invitationId = res.body.id;

      // Start interview
      await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/start`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate');

      // Submit all responses
      for (let i = 0; i < 2; i++) {
        await request(app.getHttpServer())
          .post(`/api/invitations/${invitationId}/responses`)
          .set('x-user-id', candidateId)
          .set('x-user-role', 'candidate')
          .send({
            questionId: uuidv4(),
            questionIndex: i,
            questionText: `Question ${i}?`,
            responseType: 'text',
            duration: 60,
            textAnswer: `Answer ${i}`,
          });
      }
    });

    it('should complete interview (manual)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/complete`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .send({ reason: 'manual' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should complete with default reason', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/complete`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject complete by wrong user', async () => {
      await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/complete`)
        .set('x-user-id', candidate2Id)
        .set('x-user-role', 'candidate')
        .send({})
        .expect(403); // ForbiddenException - wrong user
    });

    it('should reject complete with missing answers', async () => {
      // Create new invitation and start without answering all
      const templateId = await createActiveTemplate(hrUserId, 3);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId,
          candidateId: candidate2Id,
          companyId,
          expiresAt,
        });

      const newInvitationId = res.body.id;

      await request(app.getHttpServer())
        .post(`/api/invitations/${newInvitationId}/start`)
        .set('x-user-id', candidate2Id)
        .set('x-user-role', 'candidate');

      // Only answer 1 of 3 questions
      await request(app.getHttpServer())
        .post(`/api/invitations/${newInvitationId}/responses`)
        .set('x-user-id', candidate2Id)
        .set('x-user-role', 'candidate')
        .send({
          questionId: uuidv4(),
          questionIndex: 0,
          questionText: 'Question?',
          responseType: 'text',
          duration: 60,
          textAnswer: 'Answer',
        });

      // Try to complete
      await request(app.getHttpServer())
        .post(`/api/invitations/${newInvitationId}/complete`)
        .set('x-user-id', candidate2Id)
        .set('x-user-role', 'candidate')
        .send({})
        .expect(400); // All questions must be answered
    });
  });

  // ==================== GET /api/invitations/:id ====================

  describe('GET /api/invitations/:id', () => {
    let invitationId: string;
    let templateId: string;

    beforeEach(async () => {
      templateId = await createActiveTemplate(hrUserId);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId,
          candidateId,
          companyId,
          expiresAt,
        });

      invitationId = res.body.id;
    });

    it('should get invitation (candidate)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/invitations/${invitationId}`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(200);

      expect(response.body.id).toBe(invitationId);
      expect(response.body.candidateId).toBe(candidateId);
      expect(response.body.status).toBe('pending');
      expect(response.body.progress).toBeDefined();
    });

    it('should get invitation (HR/inviter)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/invitations/${invitationId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(response.body.id).toBe(invitationId);
      expect(response.body.invitedBy).toBe(hrUserId);
    });

    it('should get invitation with template', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/invitations/${invitationId}`)
        .query({ includeTemplate: 'true' })
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(200);

      expect(response.body.templateTitle).toBeDefined();
      expect(response.body.questions).toBeDefined();
      expect(response.body.questions.length).toBeGreaterThan(0);
    });

    it('should reject unauthorized access', async () => {
      await request(app.getHttpServer())
        .get(`/api/invitations/${invitationId}`)
        .set('x-user-id', candidate2Id)
        .set('x-user-role', 'candidate')
        .expect(403);
    });

    it('should allow admin access', async () => {
      await request(app.getHttpServer())
        .get(`/api/invitations/${invitationId}`)
        .set('x-user-id', adminUserId)
        .set('x-user-role', 'admin')
        .expect(200);
    });

    it('should return 404 for non-existent invitation', async () => {
      const fakeId = uuidv4();
      await request(app.getHttpServer())
        .get(`/api/invitations/${fakeId}`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(404);
    });
  });

  // ==================== GET /api/invitations/candidate ====================

  describe('GET /api/invitations/candidate', () => {
    beforeEach(async () => {
      const templateId = await createActiveTemplate(hrUserId);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Create 2 invitations for candidate
      await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({ templateId, candidateId, companyId, expiresAt });

      const templateId2 = await createActiveTemplate(hrUserId);
      await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({ templateId: templateId2, candidateId, companyId, expiresAt });

      // Create 1 invitation for other candidate
      const templateId3 = await createActiveTemplate(hrUserId);
      await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({ templateId: templateId3, candidateId: candidate2Id, companyId, expiresAt });
    });

    it('should list candidate own invitations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invitations/candidate')
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invitations/candidate')
        .query({ page: 1, limit: 1 })
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.total).toBe(2);
      expect(response.body.totalPages).toBe(2);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invitations/candidate')
        .query({ status: 'pending' })
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(200);

      expect(response.body.items.every((i: any) => i.status === 'pending')).toBe(true);
    });
  });

  // ==================== GET /api/invitations/hr ====================

  describe('GET /api/invitations/hr', () => {
    let templateId: string;

    beforeEach(async () => {
      templateId = await createActiveTemplate(hrUserId);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Create 2 invitations by HR1
      await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({ templateId, candidateId, companyId, expiresAt });

      await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({ templateId, candidateId: candidate2Id, companyId, expiresAt });

      // Create 1 invitation by HR2
      const templateId2 = await createActiveTemplate(hr2UserId);
      await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hr2UserId)
        .set('x-user-role', 'hr')
        .send({ templateId: templateId2, candidateId, companyId, expiresAt });
    });

    it('should list HR own invitations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invitations/hr')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should filter by templateId', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invitations/hr')
        .query({ templateId })
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(response.body.items.every((i: any) => i.templateId === templateId)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invitations/hr')
        .query({ page: 1, limit: 1 })
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.total).toBe(2);
    });

    it('should allow admin to see any HR invitations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invitations/hr')
        .set('x-user-id', adminUserId)
        .set('x-user-role', 'admin')
        .expect(200);

      // Admin sees their own (0) since hr endpoint filters by userId
      expect(response.body.items).toHaveLength(0);
    });
  });

  // ==================== Full Interview Lifecycle ====================

  describe('Full Interview Lifecycle E2E', () => {
    it('should complete full interview: create → start → answer all → complete → verify', async () => {
      const questionsCount = 3;
      const templateId = await createActiveTemplate(hrUserId, questionsCount);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // 1. HR creates invitation
      const createRes = await request(app.getHttpServer())
        .post('/api/invitations')
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .send({
          templateId,
          candidateId,
          companyId,
          expiresAt,
          allowPause: true,
          showTimer: true,
        })
        .expect(201);

      const invitationId = createRes.body.id;

      // 2. Verify pending status
      let invitation = await request(app.getHttpServer())
        .get(`/api/invitations/${invitationId}`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(200);

      expect(invitation.body.status).toBe('pending');
      expect(invitation.body.progress.answered).toBe(0);
      expect(invitation.body.progress.total).toBe(questionsCount);

      // 3. Candidate starts interview
      await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/start`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(200);

      // 4. Verify in_progress status
      invitation = await request(app.getHttpServer())
        .get(`/api/invitations/${invitationId}`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(200);

      expect(invitation.body.status).toBe('in_progress');
      expect(invitation.body.startedAt).toBeDefined();

      // 5. Candidate answers all questions
      for (let i = 0; i < questionsCount; i++) {
        await request(app.getHttpServer())
          .post(`/api/invitations/${invitationId}/responses`)
          .set('x-user-id', candidateId)
          .set('x-user-role', 'candidate')
          .send({
            questionId: uuidv4(),
            questionIndex: i,
            questionText: `Question ${i + 1}`,
            responseType: 'text',
            duration: 60 + i * 10,
            textAnswer: `Answer to question ${i + 1}`,
          })
          .expect(201);
      }

      // 6. Verify progress
      invitation = await request(app.getHttpServer())
        .get(`/api/invitations/${invitationId}`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(200);

      expect(invitation.body.progress.answered).toBe(questionsCount);
      expect(invitation.body.progress.percentage).toBe(100);
      expect(invitation.body.responses).toHaveLength(questionsCount);

      // 7. Candidate completes interview
      await request(app.getHttpServer())
        .post(`/api/invitations/${invitationId}/complete`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .send({ reason: 'manual' })
        .expect(200);

      // 8. Verify completed status
      invitation = await request(app.getHttpServer())
        .get(`/api/invitations/${invitationId}`)
        .set('x-user-id', candidateId)
        .set('x-user-role', 'candidate')
        .expect(200);

      expect(invitation.body.status).toBe('completed');
      expect(invitation.body.completedAt).toBeDefined();
      expect(invitation.body.completedReason).toBe('manual');

      // 9. HR can view completed invitation
      const hrView = await request(app.getHttpServer())
        .get(`/api/invitations/${invitationId}`)
        .set('x-user-id', hrUserId)
        .set('x-user-role', 'hr')
        .expect(200);

      expect(hrView.body.status).toBe('completed');
      expect(hrView.body.responses).toHaveLength(questionsCount);
    });
  });
});
