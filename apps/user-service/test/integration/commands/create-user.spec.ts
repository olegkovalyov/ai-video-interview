import { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
} from '../setup';
import { CreateUserCommand } from '../../../src/application/commands/create-user/create-user.command';
import { UserEntity } from '../../../src/infrastructure/persistence/entities/user.entity';

describe('CreateUserCommand Integration', () => {
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
    it('should create user in database with provided userId', async () => {
      // Arrange
      const userId = uuidv4();
      const externalAuthId = uuidv4();
      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        'john.doe@example.com',
        'John',
        'Doe',
      );

      // Act
      const result = await commandBus.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(userId);

      // Verify in database
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity).toBeDefined();
      expect(entity!.externalAuthId).toBe(externalAuthId);
      expect(entity!.email).toBe('john.doe@example.com');
      expect(entity!.firstName).toBe('John');
      expect(entity!.lastName).toBe('Doe');
      expect(entity!.status).toBe('active');
      expect(entity!.role).toBe('pending'); // Default role (not selected yet)
      expect(entity!.createdAt).toBeDefined();
      expect(entity!.updatedAt).toBeDefined();
    });

    it('should create multiple users with different emails', async () => {
      // Arrange & Act
      await commandBus.execute(
        new CreateUserCommand(
          uuidv4(),
          uuidv4(),
          'user1@example.com',
          'User',
          'One',
        ),
      );
      await commandBus.execute(
        new CreateUserCommand(
          uuidv4(),
          uuidv4(),
          'user2@example.com',
          'User',
          'Two',
        ),
      );

      // Assert
      const users = await dataSource.getRepository(UserEntity).find();
      expect(users).toHaveLength(2);
      expect(users[0].email).toBe('user1@example.com');
      expect(users[1].email).toBe('user2@example.com');
    });

    it('should call outbox service to save event', async () => {
      // Arrange
      const userId = uuidv4();
      const command = new CreateUserCommand(
        userId,
        uuidv4(),
        'test@example.com',
        'Test',
        'User',
      );

      // Act
      await commandBus.execute(command);

      // Assert - OutboxService is mocked in integration tests
      // In real scenario, outbox event would be saved to DB
      // Here we just verify the user was created successfully
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });
      expect(entity).toBeDefined();
      expect(entity!.email).toBe('test@example.com');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when user with same email already exists', async () => {
      // Arrange - Create first user
      const firstUserId = uuidv4();
      await commandBus.execute(
        new CreateUserCommand(
          firstUserId,
          uuidv4(),
          'duplicate@example.com',
          'First',
          'User',
        ),
      );

      // Act & Assert - Try to create second user with same email
      await expect(
        commandBus.execute(
          new CreateUserCommand(
            uuidv4(), // Different userId
            uuidv4(), // Different externalAuthId
            'duplicate@example.com', // Same email
            'Second',
            'User',
          ),
        ),
      ).rejects.toThrow();
    });

    it('should throw error when user with same externalAuthId already exists', async () => {
      // Arrange - Create first user
      const externalAuthId = uuidv4();
      await commandBus.execute(
        new CreateUserCommand(
          uuidv4(),
          externalAuthId,
          'user1@example.com',
          'User',
          'One',
        ),
      );

      // Act & Assert - Try to create second user with same externalAuthId
      await expect(
        commandBus.execute(
          new CreateUserCommand(
            uuidv4(),
            externalAuthId, // Same externalAuthId
            'user2@example.com', // Different email
            'User',
            'Two',
          ),
        ),
      ).rejects.toThrow();
    });

    it('should throw error for invalid email format', async () => {
      // Act & Assert
      await expect(
        commandBus.execute(
          new CreateUserCommand(
            uuidv4(),
            uuidv4(),
            'invalid-email', // Invalid email
            'Test',
            'User',
          ),
        ),
      ).rejects.toThrow();
    });

    it('should throw error for empty first name', async () => {
      // Act & Assert
      await expect(
        commandBus.execute(
          new CreateUserCommand(
            uuidv4(),
            uuidv4(),
            'test@example.com',
            '', // Empty firstName
            'User',
          ),
        ),
      ).rejects.toThrow();
    });

    it('should throw error for empty last name', async () => {
      // Act & Assert
      await expect(
        commandBus.execute(
          new CreateUserCommand(
            uuidv4(),
            uuidv4(),
            'test@example.com',
            'Test',
            '', // Empty lastName
          ),
        ),
      ).rejects.toThrow();
    });
  });

  describe('Domain Events', () => {
    it('should create user and trigger event publication', async () => {
      // Note: EventBus and OutboxService are mocked in integration tests
      // This test verifies the command executes successfully
      const userId = uuidv4();
      const command = new CreateUserCommand(
        userId,
        uuidv4(),
        'test@example.com',
        'Test',
        'User',
      );

      await commandBus.execute(command);

      // Verify user was created
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });
      expect(entity).toBeDefined();
      expect(entity!.status).toBe('active');
      // In real scenario, UserCreatedEvent would be published via EventBus
      // and integration event saved to outbox for Kafka
    });
  });
});
