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

describe('Candidates API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let candidateUserId: string;
  let skillId: string;
  let secondSkillId: string;

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

    // Create candidate user
    candidateUserId = uuidv4();
    await dataSource.query(`
      INSERT INTO users (id, external_auth_id, email, first_name, last_name, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [candidateUserId, uuidv4(), 'candidate@test.com', 'John', 'Doe', 'candidate', 'active']);

    // Create candidate profile
    await dataSource.query(`
      INSERT INTO candidate_profiles (user_id, experience_level)
      VALUES ($1, $2)
    `, [candidateUserId, 'mid']);

    // Get or create test skills
    const skillResult = await dataSource.query(`
      SELECT id FROM skills WHERE name = 'TypeScript' LIMIT 1
    `);
    
    if (skillResult.length > 0) {
      skillId = skillResult[0].id;
    } else {
      const newSkillId = uuidv4();
      await dataSource.query(`
        INSERT INTO skills (id, name, slug) VALUES ($1, $2, $3)
      `, [newSkillId, 'TypeScript', 'typescript']);
      skillId = newSkillId;
    }

    const secondSkillResult = await dataSource.query(`
      SELECT id FROM skills WHERE name = 'React' LIMIT 1
    `);
    
    if (secondSkillResult.length > 0) {
      secondSkillId = secondSkillResult[0].id;
    } else {
      const newSkillId = uuidv4();
      await dataSource.query(`
        INSERT INTO skills (id, name, slug) VALUES ($1, $2, $3)
      `, [newSkillId, 'React', 'react']);
      secondSkillId = newSkillId;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean only candidate_skills, keep users and skills
    await dataSource.query(`DELETE FROM candidate_skills WHERE candidate_id = $1`, [candidateUserId]);
  });

  afterAll(async () => {
    await cleanE2EDatabase(dataSource);
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('GET /candidates/:userId/profile', () => {
    it('should get candidate profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/candidates/${candidateUserId}/profile?currentUserId=${candidateUserId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('userId', candidateUserId);
      expect(response.body.data).toHaveProperty('email', 'candidate@test.com');
      expect(response.body.data).toHaveProperty('fullName', 'John Doe');
      expect(response.body.data).toHaveProperty('experienceLevel', 'mid');
    });

    it('should return 404 for non-existent candidate', async () => {
      const fakeId = uuidv4();
      await request(app.getHttpServer())
        .get(`/candidates/${fakeId}/profile?currentUserId=${fakeId}`)
        .set('x-internal-token', 'test-token')
        .expect(404);
    });
  });

  describe('POST /candidates/:userId/skills', () => {
    it('should add skill to candidate', async () => {
      const skillData = {
        skillId: skillId,
        description: 'Used in production projects',
        proficiencyLevel: 'intermediate',
        yearsOfExperience: 2,
      };

      const response = await request(app.getHttpServer())
        .post(`/candidates/${candidateUserId}/skills`)
        .set('x-internal-token', 'test-token')
        .send(skillData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('candidateSkillId');
    });

    it('should add skill with minimal data', async () => {
      const skillData = {
        skillId: skillId,
      };

      const response = await request(app.getHttpServer())
        .post(`/candidates/${candidateUserId}/skills`)
        .set('x-internal-token', 'test-token')
        .send(skillData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should reject without skillId', async () => {
      const invalidData = {
        description: 'Test',
      };

      await request(app.getHttpServer())
        .post(`/candidates/${candidateUserId}/skills`)
        .set('x-internal-token', 'test-token')
        .send(invalidData)
        .expect(400);
    });

    it('should reject duplicate skill', async () => {
      const skillData = {
        skillId: skillId,
        proficiencyLevel: 'beginner',
        yearsOfExperience: 1,
      };

      // Add first time
      await request(app.getHttpServer())
        .post(`/candidates/${candidateUserId}/skills`)
        .set('x-internal-token', 'test-token')
        .send(skillData)
        .expect(201);

      // Try to add again
      await request(app.getHttpServer())
        .post(`/candidates/${candidateUserId}/skills`)
        .set('x-internal-token', 'test-token')
        .send(skillData)
        .expect(409);
    });
  });

  describe('GET /candidates/:userId/skills', () => {
    beforeEach(async () => {
      // Add skills for testing
      await request(app.getHttpServer())
        .post(`/candidates/${candidateUserId}/skills`)
        .set('x-internal-token', 'test-token')
        .send({
          skillId: skillId,
          proficiencyLevel: 'intermediate',
          yearsOfExperience: 2,
        })
        .expect(201);
    });

    it('should get candidate skills grouped by category', async () => {
      const response = await request(app.getHttpServer())
        .get(`/candidates/${candidateUserId}/skills?currentUserId=${candidateUserId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('categoryId');
      expect(response.body.data[0]).toHaveProperty('skills');
    });

    it('should return empty array for candidate without skills', async () => {
      const newCandidateId = uuidv4();
      
      // Create new candidate
      await dataSource.query(`
        INSERT INTO users (id, external_auth_id, email, first_name, last_name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [newCandidateId, uuidv4(), 'newcandidate@test.com', 'Jane', 'Smith', 'candidate', 'active']);

      await dataSource.query(`
        INSERT INTO candidate_profiles (user_id)
        VALUES ($1)
      `, [newCandidateId]);

      const response = await request(app.getHttpServer())
        .get(`/candidates/${newCandidateId}/skills?currentUserId=${newCandidateId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('PUT /candidates/:userId/skills/:skillId', () => {
    beforeEach(async () => {
      // Add skill first
      await request(app.getHttpServer())
        .post(`/candidates/${candidateUserId}/skills`)
        .set('x-internal-token', 'test-token')
        .send({
          skillId: skillId,
          proficiencyLevel: 'beginner',
          yearsOfExperience: 1,
        })
        .expect(201);
    });

    it('should update candidate skill', async () => {
      const updateData = {
        proficiencyLevel: 'advanced',
        yearsOfExperience: 3,
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .put(`/candidates/${candidateUserId}/skills/${skillId}`)
        .set('x-internal-token', 'test-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Skill updated successfully');
    });

    it('should update only description', async () => {
      const updateData = {
        description: 'New description only',
      };

      const response = await request(app.getHttpServer())
        .put(`/candidates/${candidateUserId}/skills/${skillId}`)
        .set('x-internal-token', 'test-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject empty update', async () => {
      await request(app.getHttpServer())
        .put(`/candidates/${candidateUserId}/skills/${skillId}`)
        .set('x-internal-token', 'test-token')
        .send({})
        .expect(400);
    });

    it('should return 404 for non-existent skill', async () => {
      const fakeSkillId = uuidv4();
      const updateData = {
        proficiencyLevel: 'expert',
      };

      await request(app.getHttpServer())
        .put(`/candidates/${candidateUserId}/skills/${fakeSkillId}`)
        .set('x-internal-token', 'test-token')
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /candidates/:userId/skills/:skillId', () => {
    beforeEach(async () => {
      // Add skill first
      await request(app.getHttpServer())
        .post(`/candidates/${candidateUserId}/skills`)
        .set('x-internal-token', 'test-token')
        .send({
          skillId: skillId,
          proficiencyLevel: 'intermediate',
          yearsOfExperience: 2,
        })
        .expect(201);
    });

    it('should remove skill from candidate', async () => {
      await request(app.getHttpServer())
        .delete(`/candidates/${candidateUserId}/skills/${skillId}`)
        .set('x-internal-token', 'test-token')
        .expect(204);

      // Verify skill is removed
      const response = await request(app.getHttpServer())
        .get(`/candidates/${candidateUserId}/skills?currentUserId=${candidateUserId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should return 404 for non-existent skill', async () => {
      const fakeSkillId = uuidv4();
      await request(app.getHttpServer())
        .delete(`/candidates/${candidateUserId}/skills/${fakeSkillId}`)
        .set('x-internal-token', 'test-token')
        .expect(404);
    });
  });

  describe('GET /candidates/search', () => {
    beforeEach(async () => {
      // Add skills to candidate for search
      await request(app.getHttpServer())
        .post(`/candidates/${candidateUserId}/skills`)
        .set('x-internal-token', 'test-token')
        .send({
          skillId: skillId,
          proficiencyLevel: 'advanced',
          yearsOfExperience: 3,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/candidates/${candidateUserId}/skills`)
        .set('x-internal-token', 'test-token')
        .send({
          skillId: secondSkillId,
          proficiencyLevel: 'intermediate',
          yearsOfExperience: 2,
        })
        .expect(201);
    });

    it('should search candidates by skills', async () => {
      const response = await request(app.getHttpServer())
        .get(`/candidates/search`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should search candidates by single skillId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/candidates/search?skillIds=${skillId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].userId).toBe(candidateUserId);
    });

    it('should search candidates by multiple skillIds', async () => {
      const response = await request(app.getHttpServer())
        .get(`/candidates/search?skillIds=${skillId}&skillIds=${secondSkillId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should search candidates with skillIds and pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/candidates/search?skillIds=${skillId}&page=1&limit=5`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should filter by minProficiency - include higher levels', async () => {
      // Candidate has skillId at 'advanced' level
      // minProficiency=intermediate should include advanced and expert
      const response = await request(app.getHttpServer())
        .get(`/candidates/search?skillIds=${skillId}&minProficiency=intermediate`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // advanced >= intermediate
    });

    it('should filter by minProficiency - exclude lower levels', async () => {
      // Candidate has secondSkillId at 'intermediate' level
      // minProficiency=expert should NOT include intermediate
      const response = await request(app.getHttpServer())
        .get(`/candidates/search?skillIds=${secondSkillId}&minProficiency=expert`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0); // intermediate < expert
    });

    it('should filter by minimum years', async () => {
      const response = await request(app.getHttpServer())
        .get(`/candidates/search?skillIds=${skillId}&minYears=2`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // 3 years >= 2
    });

    it('should filter by experienceLevel - exact match', async () => {
      // Candidate profile has experience_level = 'mid' (set in beforeAll)
      const response = await request(app.getHttpServer())
        .get(`/candidates/search?skillIds=${skillId}&experienceLevel=mid`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].experienceLevel).toBe('mid');
    });

    it('should filter by experienceLevel - no match for different level', async () => {
      // Candidate profile has experience_level = 'mid'
      // Search for 'senior' should return empty
      const response = await request(app.getHttpServer())
        .get(`/candidates/search?skillIds=${skillId}&experienceLevel=senior`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0); // mid != senior
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/candidates/search?page=1&limit=10`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
    });

    it('should return empty results for no matches', async () => {
      const response = await request(app.getHttpServer())
        .get(`/candidates/search?experienceLevel=lead`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe('PUT /candidates/:userId/experience-level', () => {
    it('should update candidate experience level', async () => {
      const response = await request(app.getHttpServer())
        .put(`/candidates/${candidateUserId}/experience-level`)
        .set('x-internal-token', 'test-token')
        .send({ experienceLevel: 'senior' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('experienceLevel', 'senior');
    });

    it('should reject invalid experience level', async () => {
      await request(app.getHttpServer())
        .put(`/candidates/${candidateUserId}/experience-level`)
        .set('x-internal-token', 'test-token')
        .send({ experienceLevel: 'invalid' })
        .expect(400);
    });

    it('should return 404 for non-existent candidate', async () => {
      const fakeUserId = uuidv4();
      await request(app.getHttpServer())
        .put(`/candidates/${fakeUserId}/experience-level`)
        .set('x-internal-token', 'test-token')
        .send({ experienceLevel: 'mid' })
        .expect(404);
    });

    it('should update from junior to lead', async () => {
      // First set to junior
      await request(app.getHttpServer())
        .put(`/candidates/${candidateUserId}/experience-level`)
        .set('x-internal-token', 'test-token')
        .send({ experienceLevel: 'junior' })
        .expect(200);

      // Then update to lead
      const response = await request(app.getHttpServer())
        .put(`/candidates/${candidateUserId}/experience-level`)
        .set('x-internal-token', 'test-token')
        .send({ experienceLevel: 'lead' })
        .expect(200);

      expect(response.body.data.experienceLevel).toBe('lead');
    });
  });

  describe('Authentication', () => {
    it('should reject all endpoints without internal token', async () => {
      await request(app.getHttpServer())
        .get(`/candidates/${candidateUserId}/profile`)
        .expect(401);
      
      await request(app.getHttpServer())
        .get(`/candidates/${candidateUserId}/skills`)
        .expect(401);
      
      await request(app.getHttpServer())
        .post(`/candidates/${candidateUserId}/skills`)
        .expect(401);
      
      await request(app.getHttpServer())
        .put(`/candidates/${candidateUserId}/skills/${skillId}`)
        .expect(401);
      
      await request(app.getHttpServer())
        .delete(`/candidates/${candidateUserId}/skills/${skillId}`)
        .expect(401);
      
      await request(app.getHttpServer())
        .get('/candidates/search')
        .expect(401);
      
      await request(app.getHttpServer())
        .put(`/candidates/${candidateUserId}/experience-level`)
        .expect(401);
    });
  });
});
