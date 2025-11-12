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

describe('User Admin API (E2E)', () => {
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

  describe('POST /users/:userId/suspend', () => {
    it('should suspend active user', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Suspend user
      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/suspend`)
        .set('x-internal-token', 'test-token')
        .send({
          reason: 'Violation of terms of service',
        })
        .expect(200);

      expect(response.body.status).toBe('suspended');
      expect(response.body.id).toBe(userId);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuidv4();

      await request(app.getHttpServer())
        .post(`/users/${nonExistentId}/suspend`)
        .set('x-internal-token', 'test-token')
        .send({
          reason: 'Test reason',
        })
        .expect(404);
    });

    it('should reject suspend without reason', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Try to suspend without reason
      await request(app.getHttpServer())
        .post(`/users/${userId}/suspend`)
        .set('x-internal-token', 'test-token')
        .send({})
        .expect(400);
    });

    it('should reject empty reason', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Try to suspend with empty reason
      await request(app.getHttpServer())
        .post(`/users/${userId}/suspend`)
        .set('x-internal-token', 'test-token')
        .send({
          reason: '',
        })
        .expect(400);
    });

    it('should reject suspending already suspended user', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Suspend user
      await request(app.getHttpServer())
        .post(`/users/${userId}/suspend`)
        .set('x-internal-token', 'test-token')
        .send({
          reason: 'First suspension',
        })
        .expect(200);

      // Try to suspend again
      await request(app.getHttpServer())
        .post(`/users/${userId}/suspend`)
        .set('x-internal-token', 'test-token')
        .send({
          reason: 'Second suspension',
        })
        .expect(400); // Domain exception -> BadRequest
    });
  });

  describe('POST /users/:userId/activate', () => {
    it('should activate suspended user', async () => {
      const userId = uuidv4();

      // Create and suspend user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      await request(app.getHttpServer())
        .post(`/users/${userId}/suspend`)
        .set('x-internal-token', 'test-token')
        .send({
          reason: 'Test suspension',
        });

      // Activate user
      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/activate`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.status).toBe('active');
      expect(response.body.id).toBe(userId);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuidv4();

      await request(app.getHttpServer())
        .post(`/users/${nonExistentId}/activate`)
        .set('x-internal-token', 'test-token')
        .expect(404);
    });

    it('should not fail when activating already active user', async () => {
      const userId = uuidv4();

      // Create active user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Try to activate already active user
      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/activate`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.status).toBe('active');
    });

    it('should handle suspend and activate cycle', async () => {
      const userId = uuidv4();

      // Create user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Suspend
      await request(app.getHttpServer())
        .post(`/users/${userId}/suspend`)
        .set('x-internal-token', 'test-token')
        .send({ reason: 'Test' })
        .expect(200);

      // Activate
      await request(app.getHttpServer())
        .post(`/users/${userId}/activate`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      // Suspend again
      await request(app.getHttpServer())
        .post(`/users/${userId}/suspend`)
        .set('x-internal-token', 'test-token')
        .send({ reason: 'Test again' })
        .expect(200);

      // Activate again
      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/activate`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      expect(response.body.status).toBe('active');
    });
  });

  describe('Admin operations data integrity', () => {
    it('should preserve user data after suspend and activate', async () => {
      const userId = uuidv4();
      const email = 'preserve@example.com';
      const firstName = 'Preserve';
      const lastName = 'Data';

      // Create user
      await request(app.getHttpServer()).post('/users').set('x-internal-token', 'test-token').send({
        userId,
        externalAuthId: 'auth-123',
        email,
        firstName,
        lastName,
      });

      // Suspend
      await request(app.getHttpServer())
        .post(`/users/${userId}/suspend`)
        .set('x-internal-token', 'test-token')
        .send({ reason: 'Test' });

      // Activate
      const response = await request(app.getHttpServer())
        .post(`/users/${userId}/activate`)
        .set('x-internal-token', 'test-token')
        .expect(200);

      // Verify data is preserved
      expect(response.body.email).toBe(email);
      expect(response.body.firstName).toBe(firstName);
      expect(response.body.lastName).toBe(lastName);
    });
  });
});
