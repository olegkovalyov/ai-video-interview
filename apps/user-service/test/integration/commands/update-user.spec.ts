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
import { UpdateUserCommand } from '../../../src/application/commands/update-user/update-user.command';
import { UserEntity } from '../../../src/infrastructure/persistence/entities/user.entity';

describe('UpdateUserCommand Integration', () => {
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
    it('should update user first and last name', async () => {
      // Arrange - Seed user
      const userId = await seedUser(dataSource, {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      const command = new UpdateUserCommand(
        userId,
        'Jane', // New firstName
        'Smith', // New lastName
      );

      // Act
      const result = await commandBus.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.fullName.firstName).toBe('Jane');
      expect(result.fullName.lastName).toBe('Smith');

      // Verify in database
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.firstName).toBe('Jane');
      expect(entity!.lastName).toBe('Smith');
    });

    it('should update user bio', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'developer@example.com',
        firstName: 'Dev',
        lastName: 'User',
      });

      const command = new UpdateUserCommand(
        userId,
        undefined,
        undefined,
        'Experienced software engineer with 10+ years', // bio
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.bio).toBe('Experienced software engineer with 10+ years');
    });

    it('should update user phone and timezone', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      const command = new UpdateUserCommand(
        userId,
        undefined,
        undefined,
        undefined,
        '+1234567890', // phone
        'Europe/Kiev', // timezone
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.phone).toBe('+1234567890');
      expect(entity!.timezone).toBe('Europe/Kiev');
    });

    it('should update user language', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      const command = new UpdateUserCommand(
        userId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'uk', // language
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.language).toBe('uk');
    });

    it('should update only provided fields', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Original',
        lastName: 'Name',
      });

      // Set initial bio
      await commandBus.execute(
        new UpdateUserCommand(userId, undefined, undefined, 'Original bio'),
      );

      // Act - Update only firstName, keep lastName and bio
      await commandBus.execute(
        new UpdateUserCommand(userId, 'Updated', undefined),
      );

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.firstName).toBe('Updated');
      expect(entity!.lastName).toBe('Name'); // Unchanged
      expect(entity!.bio).toBe('Original bio'); // Unchanged
    });

    it('should update updatedAt timestamp', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      const entityBefore = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });
      const updatedAtBefore = entityBefore!.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act
      await commandBus.execute(
        new UpdateUserCommand(userId, 'Updated', undefined),
      );

      // Assert
      const entityAfter = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entityAfter!.updatedAt.getTime()).toBeGreaterThanOrEqual(
        updatedAtBefore.getTime(),
      );
    });
  });

  describe('Error Cases', () => {
    it('should throw error when user not found', async () => {
      // Arrange
      const nonExistentUserId = uuidv4();

      // Act & Assert
      await expect(
        commandBus.execute(
          new UpdateUserCommand(nonExistentUserId, 'New', 'Name'),
        ),
      ).rejects.toThrow();
    });

    it('should throw error for empty first name', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      // Act & Assert
      await expect(
        commandBus.execute(new UpdateUserCommand(userId, '', undefined)),
      ).rejects.toThrow();
    });

    it('should throw error for empty last name', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      // Act & Assert
      await expect(
        commandBus.execute(new UpdateUserCommand(userId, undefined, '')),
      ).rejects.toThrow();
    });
  });
});
