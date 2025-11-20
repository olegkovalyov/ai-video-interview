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

describe('Users API (E2E)', () => {
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

    // Setup global filters and pipes like in main.ts
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

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
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

  describe('POST /users', () => {
    it('should create user', async () => {
      const userId = uuidv4();
      const externalAuthId = 'keycloak-' + uuidv4();

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('x-internal-token', 'test-token')
        .send({
          userId,
          externalAuthId,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.firstName).toBe('John');
      expect(response.body.data.lastName).toBe('Doe');
      expect(response.body.data.status).toBe('active');
    });

    it('should reject duplicate email', async () => {
      const userId1 = uuidv4();
      const userId2 = uuidv4();
      const email = 'duplicate@example.com';

      // Create first user
      await request(app.getHttpServer())
        .post('/users')
        .set('x-internal-token', 'test-token')
        .send({
          userId: userId1,
          externalAuthId: 'auth-1',
          email,
          firstName: 'User',
          lastName: 'One',
        });

      // Try to create second user with same email
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('x-internal-token', 'test-token')
        .send({
          userId: userId2,
          externalAuthId: 'auth-2',
          email,
          firstName: 'User',
          lastName: 'Two',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_ALREADY_EXISTS');
    });

    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('x-internal-token', 'test-token')
        .send({
          userId: uuidv4(),
          externalAuthId: 'auth-123',
          email: 'invalid-email',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      // ValidationPipe returns message as array or string
      const message = Array.isArray(response.body.message) 
        ? response.body.message.join(' ') 
        : response.body.message;
      expect(message.toLowerCase()).toContain('email');
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('x-internal-token', 'test-token')
        .send({
          userId: uuidv4(),
          // Missing required fields
        })
        .expect(400);
    });
  });

  describe('GET /users/:userId', () => {
    it('should get user by ID', async () => {
      // Create user first
      const userId = uuidv4();
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Get user
      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.firstName).toBe('John');
      expect(response.body.lastName).toBe('Doe');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuidv4();

      const response = await request(app.getHttpServer())
        .get(`/users/${nonExistentId}`)
        .set('x-internal-token', 'test-token')
        .expect(404);

      expect(response.body.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('GET /users/by-external-auth/:externalAuthId', () => {
    it('should get user by external auth ID', async () => {
      const userId = uuidv4();
      const externalAuthId = 'keycloak-123';

      // Create user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Get by external auth ID
      const response = await request(app.getHttpServer())
        .get(`/users/by-external-auth/${externalAuthId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.externalAuthId).toBe(externalAuthId);
    });

    it('should return 404 for non-existent external auth ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/by-external-auth/non-existent-auth-id')
        .set('x-internal-token', 'test-token')
        .expect(404);

      expect(response.body.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('GET /users', () => {
    beforeEach(async () => {
      // Create test users
      for (let i = 1; i <= 5; i++) {
        await request(app.getHttpServer())
          .post('/users')
          .set('x-internal-token', 'test-token')
          .send({
            userId: uuidv4(),
            externalAuthId: `auth-${i}`,
            email: `user${i}@example.com`,
            firstName: `User`,
            lastName: `${i}`,
          });
      }
    });

    it('should list users with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('x-internal-token', 'test-token')
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(3);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should filter users by search', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('x-internal-token', 'test-token')
        .query({ search: 'user1@example.com' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(
        response.body.data.some((u) => u.email === 'user1@example.com'),
      ).toBe(true);
    });

    it('should use default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10); // Default limit is 10, not 20
    });
  });

  describe('GET /users/stats', () => {
    it('should get user statistics', async () => {
      // Create users with different statuses
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId: uuidv4(),
        externalAuthId: 'auth-1',
        email: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
      });

      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId: uuidv4(),
        externalAuthId: 'auth-2',
        email: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
      });

      const response = await request(app.getHttpServer())
        .get('/users/stats')
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.totalUsers).toBeGreaterThanOrEqual(2);
      expect(response.body.activeUsers).toBeGreaterThanOrEqual(0);
      expect(response.body.usersByStatus).toBeDefined();
      expect(typeof response.body.usersByStatus).toBe('object');
    });
  });

  describe('PUT /users/:userId', () => {
    it('should update user', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Update user
      const response = await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .set('x-internal-token', 'test-token')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          bio: 'Updated bio',
        })
        .expect(200);

      expect(response.body.firstName).toBe('Jane');
      expect(response.body.lastName).toBe('Smith');
      expect(response.body.bio).toBe('Updated bio');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuidv4();

      await request(app.getHttpServer())
        .put(`/users/${nonExistentId}`)
        .set('x-internal-token', 'test-token')
        .send({
          firstName: 'Jane',
        })
        .expect(404);
    });

    it('should validate update data', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Try to update with invalid data
      await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .set('x-internal-token', 'test-token')
        .send({
          firstName: '', // Empty string
        })
        .expect(400);
    });
  });

  describe('DELETE /users/:userId', () => {
    it('should delete user', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Delete user
      const response = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user is deleted
      await request(app.getHttpServer()).get(`/users/${userId}`).set('x-internal-token', 'test-token').expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuidv4();

      await request(app.getHttpServer())
        .delete(`/users/${nonExistentId}`)
        .set('x-internal-token', 'test-token')
        .expect(404);
    });
  });

  describe('POST /users/:userId/avatar', () => {
    // TODO: Fix multipart/form-data handling in E2E tests
    // See test/e2e/SOLUTIONS.md for details
    it.skip('should upload avatar', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Mock file upload
      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/avatar`)
        .attach('file', Buffer.from('fake-image-data'), 'avatar.jpg')
        .expect(200);

      expect(response.body.avatarUrl).toBeDefined();
      expect(mockStorageService.uploadFile).toHaveBeenCalled();
    });

    it.skip('should return 404 for non-existent user', async () => {
      const nonExistentId = uuidv4();

      await request(app.getHttpServer())
        .post(`/users/${nonExistentId}/avatar`)
        .attach('file', Buffer.from('fake-image-data'), 'avatar.jpg')
        .expect(404);
    });
  });

  describe('POST /users/:userId/roles', () => {
    it('should assign role to user', async () => {
      const userId = uuidv4();

      // Create user first
      await request(app.getHttpServer())
        .post('/users')
        .set('x-internal-token', 'test-token')
        .send({
          userId,
          externalAuthId: 'auth-role-test',
          email: 'roletest@example.com',
          firstName: 'Role',
          lastName: 'Test',
        });

      // Assign role
      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set('x-internal-token', 'test-token')
        .send({ role: 'hr' })
        .expect(200);

      expect(response.body.message).toBeDefined();
      expect(response.body.role).toBe('hr');
    });

    it('should assign candidate role', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer())
        .post('/users')
        .set('x-internal-token', 'test-token')
        .send({
          userId,
          externalAuthId: 'auth-candidate-test',
          email: 'candidate@example.com',
          firstName: 'Candidate',
          lastName: 'Test',
        });

      // Assign candidate role
      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set('x-internal-token', 'test-token')
        .send({ role: 'candidate' })
        .expect(200);

      expect(response.body.role).toBe('candidate');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuidv4();

      await request(app.getHttpServer())
        .post(`/users/${nonExistentId}/roles`)
        .set('x-internal-token', 'test-token')
        .send({ role: 'hr' })
        .expect(404);
    });

    it('should validate role enum', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer())
        .post('/users')
        .set('x-internal-token', 'test-token')
        .send({
          userId,
          externalAuthId: 'auth-invalid-role',
          email: 'invalidrole@example.com',
          firstName: 'Invalid',
          lastName: 'Role',
        });

      // Try to assign invalid role
      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set('x-internal-token', 'test-token')
        .send({ role: 'invalid-role' })
        .expect(400);
    });

    it('should require role field', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer())
        .post('/users')
        .set('x-internal-token', 'test-token')
        .send({
          userId,
          externalAuthId: 'auth-no-role',
          email: 'norole@example.com',
          firstName: 'No',
          lastName: 'Role',
        });

      // Try to assign without role field
      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set('x-internal-token', 'test-token')
        .send({})
        .expect(400);
    });
  });

  describe('DELETE /users/:userId/avatar', () => {
    it('should delete avatar', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Delete avatar
      await request(app.getHttpServer())
        .delete(`/users/${userId}/avatar`)
        .set('x-internal-token', 'test-token')
        .expect(204);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuidv4();

      await request(app.getHttpServer())
        .delete(`/users/${nonExistentId}/avatar`)
        .set('x-internal-token', 'test-token')
        .expect(404);
    });
  });

  describe('GET /users/:userId/permissions', () => {
    it('should get user permissions for candidate', async () => {
      const userId = uuidv4();

      // Create candidate user
      const createResponse = await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-candidate',
        email: 'candidate@test.com',
        firstName: 'Jane',
        lastName: 'Candidate',
      }).expect(201);

      // Assign candidate role
      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set('x-internal-token', 'test-token')
        .send({ role: 'candidate' })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/permissions`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('userId', userId);
      expect(response.body.data).toHaveProperty('roles');
      expect(response.body.data.roles).toBeInstanceOf(Array);
      expect(response.body.data.roles.length).toBeGreaterThan(0);
      expect(response.body.data.roles[0]).toHaveProperty('name', 'candidate');
      expect(response.body.data).toHaveProperty('permissions');
      expect(response.body.data.permissions).toBeInstanceOf(Array);
      expect(response.body.data.permissions).toContain('read:own_profile');
    });

    it('should get user permissions for admin', async () => {
      const userId = uuidv4();

      // Create admin user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-admin',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
      }).expect(201);

      // Assign admin role
      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set('x-internal-token', 'test-token')
        .send({ role: 'admin' })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/permissions`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.data.roles[0]).toHaveProperty('name', 'admin');
      expect(response.body.data.permissions).toContain('read:users');
      expect(response.body.data.permissions).toContain('write:users');
      expect(response.body.data.permissions).toContain('manage:system');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuidv4();

      await request(app.getHttpServer())
        .get(`/users/${nonExistentId}/permissions`)
        .set('x-internal-token', 'test-token')
        .expect(404);
    });

    it('should return permissions for HR role', async () => {
      const userId = uuidv4();

      // Create HR user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-hr',
        email: 'hr@test.com',
        firstName: 'HR',
        lastName: 'Manager',
      }).expect(201);

      // Assign HR role
      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set('x-internal-token', 'test-token')
        .send({ role: 'hr' })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/permissions`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.data.roles[0]).toHaveProperty('name', 'hr');
      expect(response.body.data.permissions).toContain('read:candidates');
      expect(response.body.data.permissions).toContain('create:interviews');
    });
  });

  describe('GET /users/:userId/companies', () => {
    it('should get user companies for own profile', async () => {
      const userId = uuidv4();

      // Create HR user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-hr-companies',
        email: 'hr-companies@test.com',
        firstName: 'HR',
        lastName: 'WithCompanies',
      }).expect(201);

      // Assign HR role
      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set('x-internal-token', 'test-token')
        .send({ role: 'hr' })
        .expect(200);

      // Create a company for this user
      const companyId = uuidv4();
      await dataSource.query(`
        INSERT INTO companies (id, name, created_by, is_active)
        VALUES ($1, $2, $3, $4)
      `, [companyId, 'Test Company', userId, true]);
      
      // Link user to company via user_companies table
      await dataSource.query(`
        INSERT INTO user_companies (id, user_id, company_id)
        VALUES ($1, $2, $3)
      `, [uuidv4(), userId, companyId]);

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/companies?currentUserId=${userId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id', companyId);
      expect(response.body.data[0]).toHaveProperty('name', 'Test Company');
    });

    it('should allow admin to view any user companies', async () => {
      const hrUserId = uuidv4();
      const adminUserId = uuidv4();

      // Create HR user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId: hrUserId,
        externalAuthId: 'auth-hr-view',
        email: 'hr-view@test.com',
        firstName: 'HR',
        lastName: 'User',
      }).expect(201);

      // Create a company for HR user
      const companyId = uuidv4();
      await dataSource.query(`
        INSERT INTO companies (id, name, created_by, is_active)
        VALUES ($1, $2, $3, $4)
      `, [companyId, 'HR Company', hrUserId, true]);
      
      // Link user to company via user_companies table
      await dataSource.query(`
        INSERT INTO user_companies (id, user_id, company_id)
        VALUES ($1, $2, $3)
      `, [uuidv4(), hrUserId, companyId]);

      // Admin views HR user's companies
      const response = await request(app.getHttpServer())
        .get(`/users/${hrUserId}/companies?currentUserId=${adminUserId}&isAdmin=true`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 403 when non-admin tries to view other user companies', async () => {
      const hrUserId = uuidv4();
      const otherUserId = uuidv4();

      // Create HR user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId: hrUserId,
        externalAuthId: 'auth-hr-forbidden',
        email: 'hr-forbidden@test.com',
        firstName: 'HR',
        lastName: 'Forbidden',
      }).expect(201);

      // Try to view from another user (not admin)
      await request(app.getHttpServer())
        .get(`/users/${hrUserId}/companies?currentUserId=${otherUserId}&isAdmin=false`)
        .set('x-internal-token', 'test-token')
        .expect(403);
    });

    it('should return empty array for user with no companies', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-no-companies',
        email: 'no-companies@test.com',
        firstName: 'No',
        lastName: 'Companies',
      }).expect(201);

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/companies?currentUserId=${userId}`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });
});
