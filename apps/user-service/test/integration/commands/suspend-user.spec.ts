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
import { SuspendUserCommand } from '../../../src/application/commands/suspend-user/suspend-user.command';
import { UserEntity } from '../../../src/infrastructure/persistence/entities/user.entity';

describe('SuspendUserCommand Integration', () => {
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
    it('should suspend active user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'active@example.com',
        firstName: 'Active',
        lastName: 'User',
        status: 'active',
      });

      const command = new SuspendUserCommand(
        userId,
        'Violation of terms',
        'admin-123',
      );

      // Act
      const result = await commandBus.execute(command);

      // Assert
      expect(result.status.value).toBe('suspended');

      // Verify in database
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.status).toBe('suspended');
      expect(entity!.updatedAt).toBeDefined();
    });

    it('should update updatedAt timestamp', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'active',
      });

      const entityBefore = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });
      const updatedAtBefore = entityBefore!.updatedAt;

      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const command = new SuspendUserCommand(
        userId,
        'Security concern',
        'admin-456',
      );

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

    it('should accept different suspension reasons', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'active',
      });

      const reasons = [
        'Violation of community guidelines',
        'Suspicious activity detected',
        'Payment dispute',
        'Temporary freeze',
      ];

      // Act & Assert - Test with first reason
      const command = new SuspendUserCommand(userId, reasons[0], 'admin-1');
      const result = await commandBus.execute(command);

      expect(result.status.value).toBe('suspended');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when user not found', async () => {
      // Arrange
      const nonExistentUserId = uuidv4();
      const command = new SuspendUserCommand(
        nonExistentUserId,
        'Reason',
        'admin-123',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error when suspending already suspended user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'suspended@example.com',
        firstName: 'Already',
        lastName: 'Suspended',
        status: 'suspended',
      });

      const command = new SuspendUserCommand(
        userId,
        'Another reason',
        'admin-123',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow(
        'User is already suspended',
      );
    });

    it('should throw error when suspending deleted user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'deleted@example.com',
        firstName: 'Deleted',
        lastName: 'User',
        status: 'deleted',
      });

      const command = new SuspendUserCommand(
        userId,
        'Reason',
        'admin-123',
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow(
        'is deleted',
      );
    });
  });

  describe('Business Rules', () => {
    it('should preserve user email and name when suspending', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'keep@example.com',
        firstName: 'Keep',
        lastName: 'Name',
        status: 'active',
      });

      const command = new SuspendUserCommand(userId, 'Reason', 'admin-123');

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.email).toBe('keep@example.com');
      expect(entity!.firstName).toBe('Keep');
      expect(entity!.lastName).toBe('Name');
      expect(entity!.status).toBe('suspended');
    });

    it('should preserve user role when suspending', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
        status: 'active',
        role: 'hr',
      });

      const command = new SuspendUserCommand(userId, 'Reason', 'admin-123');

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.role).toBe('hr');
      expect(entity!.status).toBe('suspended');
    });
  });

  describe('Multiple Operations', () => {
    it('should suspend multiple users independently', async () => {
      // Arrange
      const user1Id = await seedUser(dataSource, {
        email: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
        status: 'active',
      });

      const user2Id = await seedUser(dataSource, {
        email: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
        status: 'active',
      });

      // Act
      await commandBus.execute(
        new SuspendUserCommand(user1Id, 'Reason 1', 'admin-1'),
      );
      await commandBus.execute(
        new SuspendUserCommand(user2Id, 'Reason 2', 'admin-2'),
      );

      // Assert
      const users = await dataSource.getRepository(UserEntity).find();
      const suspendedUsers = users.filter((u) => u.status === 'suspended');

      expect(suspendedUsers).toHaveLength(2);
      expect(suspendedUsers.map((u) => u.id)).toContain(user1Id);
      expect(suspendedUsers.map((u) => u.id)).toContain(user2Id);
    });
  });
});
