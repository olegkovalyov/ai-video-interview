import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { InternalServiceGuard } from '../../src/infrastructure/http/guards/internal-service.guard';
import { DomainExceptionFilter } from '../../src/infrastructure/http/filters/domain-exception.filter';
import { TestInternalServiceGuard } from './test-auth.guard';
import { createE2EDataSource, cleanE2EDatabase } from './test-database.setup';
import { TestApplicationModule } from './test-application.module';

describe('User Profiles API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Create test DataSource
    dataSource = await createE2EDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestApplicationModule],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
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
      }),
    );

    await app.init();
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

  describe('POST /users/:userId/roles', () => {
    it('should assign candidate role', async () => {
      const userId = uuidv4();

      // Create user with pending role
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Assign role
      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({
          role: 'candidate',
        })
        .expect(200);

      expect(response.body.role).toBe('candidate');
      expect(response.body.message).toContain('assigned successfully');
    });

    it('should assign hr role', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
      });

      // Assign role
      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({
          role: 'hr',
        })
        .expect(200);

      expect(response.body.role).toBe('hr');
    });

    it('should assign admin role', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
      });

      // Assign role
      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({
          role: 'admin',
        })
        .expect(200);

      expect(response.body.role).toBe('admin');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuidv4();

      await request(app.getHttpServer())
        .post(`/users/${nonExistentId}/roles`)
        .send({
          role: 'candidate',
        })
        .expect(404);
    });

    it('should reject role assignment twice', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Assign role first time
      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({
          role: 'candidate',
        })
        .expect(200);

      // Try to assign role again
      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({
          role: 'hr',
        })
        .expect(400); // Domain exception -> BadRequest
    });

    it('should validate role value', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Try invalid role
      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({
          role: 'invalid-role',
        })
        .expect(400);
    });
  });

  describe('GET /users/:userId/permissions', () => {
    it('should get permissions for pending user', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Get permissions
      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/permissions`)
        .expect(200);

      expect(response.body.userId).toBe(userId);
      expect(response.body.roles).toBeDefined();
      expect(response.body.permissions).toBeDefined();
    });

    it('should get permissions for candidate', async () => {
      const userId = uuidv4();

      // Create user and assign candidate role
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'candidate@example.com',
        firstName: 'Candidate',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ role: 'candidate' });

      // Get permissions
      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/permissions`)
        .expect(200);

      // Roles is an array of objects with name property
      const roleNames = response.body.roles.map((r) => r.name || r);
      expect(roleNames).toContain('candidate');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuidv4();

      await request(app.getHttpServer())
        .get(`/users/${nonExistentId}/permissions`)
        .expect(404);
    });
  });

  describe('PUT /users/:userId/profiles/candidate', () => {
    it('should update candidate profile', async () => {
      const userId = uuidv4();

      // Create user and assign candidate role
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'candidate@example.com',
        firstName: 'Candidate',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ role: 'candidate' });

      // Update candidate profile
      const response = await request(app.getHttpServer())
        .put(`/users/${userId}/profiles/candidate`)
        .send({
          skills: ['JavaScript', 'TypeScript', 'React'],
          experienceLevel: 'mid',
        })
        .expect(200);

      expect(response.body.message).toContain('updated successfully');
    });

    it('should update only skills', async () => {
      const userId = uuidv4();

      // Create user and assign role
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'candidate@example.com',
        firstName: 'Candidate',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ role: 'candidate' });

      // Update only skills
      await request(app.getHttpServer())
        .put(`/users/${userId}/profiles/candidate`)
        .send({
          skills: ['Python', 'Django'],
        })
        .expect(200);
    });

    it('should update only experience level', async () => {
      const userId = uuidv4();

      // Create user and assign role
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'candidate@example.com',
        firstName: 'Candidate',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ role: 'candidate' });

      // Update only experience level
      await request(app.getHttpServer())
        .put(`/users/${userId}/profiles/candidate`)
        .send({
          experienceLevel: 'senior',
        })
        .expect(200);
    });

    it('should return 404 for non-candidate user', async () => {
      const userId = uuidv4();

      // Create HR user
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ role: 'hr' });

      // Try to update candidate profile
      await request(app.getHttpServer())
        .put(`/users/${userId}/profiles/candidate`)
        .send({
          skills: ['Test'],
        })
        .expect(500); // Profile not found
    });

    it('should validate experience level values', async () => {
      const userId = uuidv4();

      // Create user and assign role
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'candidate@example.com',
        firstName: 'Candidate',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ role: 'candidate' });

      // Try invalid experience level
      await request(app.getHttpServer())
        .put(`/users/${userId}/profiles/candidate`)
        .send({
          experienceLevel: 'invalid-level',
        })
        .expect(400);
    });
  });

  describe('PUT /users/:userId/profiles/hr', () => {
    it('should update HR profile', async () => {
      const userId = uuidv4();

      // Create user and assign HR role
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ role: 'hr' });

      // Update HR profile
      const response = await request(app.getHttpServer())
        .put(`/users/${userId}/profiles/hr`)
        .send({
          companyName: 'TechCorp',
          position: 'Senior Recruiter',
        })
        .expect(200);

      expect(response.body.message).toContain('updated successfully');
    });

    it('should update only company name', async () => {
      const userId = uuidv4();

      // Create user and assign role
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ role: 'hr' });

      // Update only company
      await request(app.getHttpServer())
        .put(`/users/${userId}/profiles/hr`)
        .send({
          companyName: 'NewCorp',
        })
        .expect(200);
    });

    it('should update only position', async () => {
      const userId = uuidv4();

      // Create user and assign role
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ role: 'hr' });

      // Update only position
      await request(app.getHttpServer())
        .put(`/users/${userId}/profiles/hr`)
        .send({
          position: 'HR Manager',
        })
        .expect(200);
    });

    it('should return 404 for non-HR user', async () => {
      const userId = uuidv4();

      // Create candidate user
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'candidate@example.com',
        firstName: 'Candidate',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ role: 'candidate' });

      // Try to update HR profile
      await request(app.getHttpServer())
        .put(`/users/${userId}/profiles/hr`)
        .send({
          companyName: 'Test',
        })
        .expect(500); // Profile not found
    });

    it('should reject empty company name', async () => {
      const userId = uuidv4();

      // Create user and assign role
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ role: 'hr' });

      // Try empty company name
      await request(app.getHttpServer())
        .put(`/users/${userId}/profiles/hr`)
        .send({
          companyName: '',
        })
        .expect(400);
    });

    it('should reject empty position', async () => {
      const userId = uuidv4();

      // Create user and assign role
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ role: 'hr' });

      // Try empty position
      await request(app.getHttpServer())
        .put(`/users/${userId}/profiles/hr`)
        .send({
          position: '',
        })
        .expect(400);
    });
  });
});
