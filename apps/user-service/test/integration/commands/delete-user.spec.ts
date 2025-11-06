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
import { DeleteUserCommand } from '../../../src/application/commands/delete-user/delete-user.command';
import { UserEntity } from '../../../src/infrastructure/persistence/entities/user.entity';

describe('DeleteUserCommand Integration', () => {
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
    it('should delete active user from database', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'active@example.com',
        firstName: 'Active',
        lastName: 'User',
        status: 'active',
      });

      const command = new DeleteUserCommand(userId, 'admin-123');

      // Act
      await commandBus.execute(command);

      // Assert - User should not exist in database
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity).toBeNull();
    });

    it('should delete suspended user from database', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'suspended@example.com',
        firstName: 'Suspended',
        lastName: 'User',
        status: 'suspended',
      });

      const command = new DeleteUserCommand(userId, 'admin-456');

      // Act
      await commandBus.execute(command);

      // Assert - User should not exist in database
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity).toBeNull();
    });

    it('should delete user with any role', async () => {
      // Arrange - HR user
      const hrUserId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
        status: 'active',
        role: 'hr',
      });

      // Arrange - Candidate user
      const candidateUserId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Candidate',
        lastName: 'User',
        status: 'active',
        role: 'candidate',
      });

      // Act
      await commandBus.execute(new DeleteUserCommand(hrUserId, 'admin-1'));
      await commandBus.execute(
        new DeleteUserCommand(candidateUserId, 'admin-2'),
      );

      // Assert - Both users should not exist
      const hrEntity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: hrUserId } });
      const candidateEntity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: candidateUserId } });

      expect(hrEntity).toBeNull();
      expect(candidateEntity).toBeNull();
    });

    it('should accept different deletedBy values', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'active',
      });

      const command = new DeleteUserCommand(
        userId,
        'system-automated-cleanup',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity).toBeNull();
    });
  });

  describe('Error Cases', () => {
    it('should throw error when user not found', async () => {
      // Arrange
      const nonExistentUserId = uuidv4();
      const command = new DeleteUserCommand(nonExistentUserId, 'admin-123');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow('not found');
    });

    it('should throw error on second deletion attempt', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'once@example.com',
        firstName: 'Delete',
        lastName: 'Once',
        status: 'active',
      });

      const command = new DeleteUserCommand(userId, 'admin-123');

      // Act - First deletion
      await commandBus.execute(command);

      // Assert - Second deletion should fail
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow('not found');
    });
  });

  describe('Business Rules', () => {
    it('should hard delete user from database', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'harddelete@example.com',
        firstName: 'Hard',
        lastName: 'Delete',
        status: 'active',
      });

      const command = new DeleteUserCommand(userId, 'admin-123');

      // Act
      await commandBus.execute(command);

      // Assert - User record should not exist (not soft-deleted)
      const entityWithDeleted = await dataSource
        .getRepository(UserEntity)
        .createQueryBuilder('user')
        .where('user.id = :id', { id: userId })
        .withDeleted()
        .getOne();

      // Even with withDeleted(), user should not exist (hard delete)
      expect(entityWithDeleted).toBeNull();
    });

    it('should not affect other users when deleting', async () => {
      // Arrange
      const user1Id = await seedUser(dataSource, {
        email: 'keep1@example.com',
        firstName: 'Keep',
        lastName: 'One',
        status: 'active',
      });

      const user2Id = await seedUser(dataSource, {
        email: 'delete@example.com',
        firstName: 'Delete',
        lastName: 'User',
        status: 'active',
      });

      const user3Id = await seedUser(dataSource, {
        email: 'keep2@example.com',
        firstName: 'Keep',
        lastName: 'Two',
        status: 'active',
      });

      // Act - Delete only user2
      await commandBus.execute(new DeleteUserCommand(user2Id, 'admin-123'));

      // Assert - Other users should still exist
      const user1 = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: user1Id } });
      const user2 = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: user2Id } });
      const user3 = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: user3Id } });

      expect(user1).not.toBeNull();
      expect(user2).toBeNull(); // Deleted
      expect(user3).not.toBeNull();
    });
  });

  describe('Multiple Operations', () => {
    it('should delete multiple users independently', async () => {
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

      const user3Id = await seedUser(dataSource, {
        email: 'user3@example.com',
        firstName: 'User',
        lastName: 'Three',
        status: 'active',
      });

      // Act
      await commandBus.execute(new DeleteUserCommand(user1Id, 'admin-1'));
      await commandBus.execute(new DeleteUserCommand(user2Id, 'admin-2'));
      await commandBus.execute(new DeleteUserCommand(user3Id, 'admin-3'));

      // Assert - All users should be deleted
      const users = await dataSource.getRepository(UserEntity).find();
      expect(users).toHaveLength(0);
    });

    it('should handle deletion in any status', async () => {
      // Arrange
      const activeUserId = await seedUser(dataSource, {
        email: 'active@example.com',
        firstName: 'Active',
        lastName: 'User',
        status: 'active',
      });

      const suspendedUserId = await seedUser(dataSource, {
        email: 'suspended@example.com',
        firstName: 'Suspended',
        lastName: 'User',
        status: 'suspended',
      });

      // Act
      await commandBus.execute(
        new DeleteUserCommand(activeUserId, 'admin-1'),
      );
      await commandBus.execute(
        new DeleteUserCommand(suspendedUserId, 'admin-2'),
      );

      // Assert
      const activeUser = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: activeUserId } });
      const suspendedUser = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: suspendedUserId } });

      expect(activeUser).toBeNull();
      expect(suspendedUser).toBeNull();
    });
  });

  describe('Data Integrity', () => {
    it('should reduce total user count after deletion', async () => {
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

      const countBefore = await dataSource
        .getRepository(UserEntity)
        .count();
      expect(countBefore).toBe(2);

      // Act
      await commandBus.execute(new DeleteUserCommand(user1Id, 'admin-123'));

      // Assert
      const countAfter = await dataSource.getRepository(UserEntity).count();
      expect(countAfter).toBe(1);
    });
  });
});
