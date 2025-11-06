import { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedUser,
} from '../setup';
import { ActivateUserCommand } from '../../../src/application/commands/activate-user/activate-user.command';
import { UserEntity } from '../../../src/infrastructure/persistence/entities/user.entity';

describe('ActivateUserCommand Integration', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    commandBus = app.get(CommandBus);
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
    it('should activate suspended user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'suspended@example.com',
        firstName: 'Suspended',
        lastName: 'User',
        status: 'suspended',
      });

      const command = new ActivateUserCommand(userId);

      // Act
      const result = await commandBus.execute(command);

      // Assert
      expect(result.status.value).toBe('active');

      // Verify in database
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.status).toBe('active');
      expect(entity!.updatedAt).toBeDefined();
    });

    it('should not throw error when activating already active user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'active@example.com',
        firstName: 'Already',
        lastName: 'Active',
        status: 'active',
      });

      const command = new ActivateUserCommand(userId);

      // Act
      const result = await commandBus.execute(command);

      // Assert - Should succeed without error
      expect(result.status.value).toBe('active');

      // Verify in database
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.status).toBe('active');
    });

    it('should update updatedAt timestamp when activating', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'suspended',
      });

      const entityBefore = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });
      const updatedAtBefore = entityBefore!.updatedAt;

      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const command = new ActivateUserCommand(userId);

      // Act
      await commandBus.execute(command);

      // Assert
      const entityAfter = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entityAfter!.updatedAt.getTime()).toBeGreaterThan(
        updatedAtBefore.getTime(),
      );
    });

    it('should activate user with any role', async () => {
      // Arrange - Test with HR role
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
        status: 'suspended',
        role: 'hr',
      });

      // Arrange - Test with candidate role
      const candidateUserId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Candidate',
        lastName: 'User',
        status: 'suspended',
        role: 'candidate',
      });

      // Act
      await commandBus.execute(new ActivateUserCommand(hrUserId));
      await commandBus.execute(new ActivateUserCommand(candidateUserId));

      // Assert
      const hrEntity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: hrUserId } });
      const candidateEntity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: candidateUserId } });

      expect(hrEntity!.status).toBe('active');
      expect(hrEntity!.role).toBe('hr');
      expect(candidateEntity!.status).toBe('active');
      expect(candidateEntity!.role).toBe('candidate');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when user not found', async () => {
      // Arrange
      const nonExistentUserId = uuidv4();
      const command = new ActivateUserCommand(nonExistentUserId);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow(
        'not found',
      );
    });

    it('should throw error when activating deleted user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'deleted@example.com',
        firstName: 'Deleted',
        lastName: 'User',
        status: 'deleted',
      });

      const command = new ActivateUserCommand(userId);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow(
        'is deleted',
      );
    });
  });

  describe('Business Rules', () => {
    it('should preserve user data when activating', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'preserve@example.com',
        firstName: 'Preserve',
        lastName: 'Data',
        status: 'suspended',
        role: 'candidate',
      });

      const command = new ActivateUserCommand(userId);

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.email).toBe('preserve@example.com');
      expect(entity!.firstName).toBe('Preserve');
      expect(entity!.lastName).toBe('Data');
      expect(entity!.role).toBe('candidate');
      expect(entity!.status).toBe('active');
    });

    it('should allow reactivation after suspension', async () => {
      // Arrange - Create active user
      const userId = await seedUser(dataSource, {
        email: 'reactivate@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'active',
      });

      // Change to suspended in DB
      await dataSource
        .getRepository(UserEntity)
        .update({ id: userId }, { status: 'suspended' });

      const command = new ActivateUserCommand(userId);

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.status).toBe('active');
    });
  });

  describe('Multiple Operations', () => {
    it('should activate multiple suspended users', async () => {
      // Arrange
      const user1Id = await seedUser(dataSource, {
        email: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
        status: 'suspended',
      });

      const user2Id = await seedUser(dataSource, {
        email: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
        status: 'suspended',
      });

      const user3Id = await seedUser(dataSource, {
        email: 'user3@example.com',
        firstName: 'User',
        lastName: 'Three',
        status: 'suspended',
      });

      // Act
      await commandBus.execute(new ActivateUserCommand(user1Id));
      await commandBus.execute(new ActivateUserCommand(user2Id));
      await commandBus.execute(new ActivateUserCommand(user3Id));

      // Assert
      const users = await dataSource.getRepository(UserEntity).find();
      const activeUsers = users.filter((u) => u.status === 'active');

      expect(activeUsers).toHaveLength(3);
      expect(activeUsers.map((u) => u.id)).toContain(user1Id);
      expect(activeUsers.map((u) => u.id)).toContain(user2Id);
      expect(activeUsers.map((u) => u.id)).toContain(user3Id);
    });

    it('should handle activate idempotently', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'idempotent@example.com',
        firstName: 'Idempotent',
        lastName: 'User',
        status: 'suspended',
      });

      const command = new ActivateUserCommand(userId);

      // Act - Execute multiple times
      await commandBus.execute(command);
      await commandBus.execute(command);
      await commandBus.execute(command);

      // Assert - Should still be active
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.status).toBe('active');
    });
  });
});
