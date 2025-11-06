import { INestApplication } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedUser,
} from '../setup';
import { GetUserQuery } from '../../../src/application/queries/get-user/get-user.query';

describe('GetUserQuery Integration', () => {
  let app: INestApplication;
  let queryBus: QueryBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    queryBus = app.get(QueryBus);
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Success Cases', () => {
    it('should get user by ID', async () => {
      // Arrange - Seed user
      const userId = await seedUser(dataSource, {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      const query = new GetUserQuery(userId);

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
      expect(result.email.value).toBe('john.doe@example.com');
      expect(result.fullName.firstName).toBe('John');
      expect(result.fullName.lastName).toBe('Doe');
      expect(result.status.value).toBe('active');
    });

    it('should get user with all fields populated', async () => {
      // Arrange - Seed user with all optional fields
      const userId = uuidv4();
      await dataSource.query(
        `
        INSERT INTO users (
          id, external_auth_id, email, first_name, last_name,
          bio, phone, timezone, language, role, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
        [
          userId,
          uuidv4(),
          'full.user@example.com',
          'Full',
          'User',
          'Software engineer',
          '+1234567890',
          'Europe/Kiev',
          'uk',
          'candidate',
          'active',
        ],
      );

      const query = new GetUserQuery(userId);

      // Act
      const result = await queryBus.execute(query);

      // Assert
      expect(result.bio).toBe('Software engineer');
      expect(result.phone).toBe('+1234567890');
      expect(result.timezone).toBe('Europe/Kiev');
      expect(result.language).toBe('uk');
    });

    it('should get multiple users sequentially', async () => {
      // Arrange
      const userId1 = await seedUser(dataSource, {
        email: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
      });
      const userId2 = await seedUser(dataSource, {
        email: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
      });

      // Act
      const result1 = await queryBus.execute(new GetUserQuery(userId1));
      const result2 = await queryBus.execute(new GetUserQuery(userId2));

      // Assert
      expect(result1.email.value).toBe('user1@example.com');
      expect(result2.email.value).toBe('user2@example.com');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when user not found', async () => {
      // Arrange
      const nonExistentUserId = uuidv4();
      const query = new GetUserQuery(nonExistentUserId);

      // Act & Assert
      await expect(queryBus.execute(query)).rejects.toThrow();
    });

    it('should throw error for invalid UUID format', async () => {
      // Arrange
      const invalidUserId = 'not-a-uuid';
      const query = new GetUserQuery(invalidUserId);

      // Act & Assert
      await expect(queryBus.execute(query)).rejects.toThrow();
    });
  });

  describe('Different User Statuses', () => {
    it('should get user with suspended status', async () => {
      // Arrange
      const userId = uuidv4();
      await dataSource.query(
        `
        INSERT INTO users (
          id, external_auth_id, email, first_name, last_name, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [userId, uuidv4(), 'suspended@example.com', 'Sus', 'User', 'suspended'],
      );

      // Act
      const result = await queryBus.execute(new GetUserQuery(userId));

      // Assert
      expect(result.status.value).toBe('suspended');
    });
  });

  describe('Different User Roles', () => {
    it('should get user with HR role', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
        role: 'hr',
      });

      // Act
      const result = await queryBus.execute(new GetUserQuery(userId));

      // Assert
      expect(result.role.toString()).toBe('hr');
    });

    it('should get user with admin role', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      });

      // Act
      const result = await queryBus.execute(new GetUserQuery(userId));

      // Assert
      expect(result.role.toString()).toBe('admin');
    });
  });
});
