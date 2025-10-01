import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateUserHandler } from '../../../../src/application/commands/create-user/create-user.handler';
import { CreateUserCommand } from '../../../../src/application/commands/create-user/create-user.command';
import { IUserRepository } from '../../../../src/domain/repositories/user.repository.interface';
import { User } from '../../../../src/domain/aggregates/user.aggregate';
import { Email } from '../../../../src/domain/value-objects/email.vo';
import { FullName } from '../../../../src/domain/value-objects/full-name.vo';
import { UserAlreadyExistsException } from '../../../../src/domain/exceptions/user.exceptions';
import { UserCreatedEvent } from '../../../../src/domain/events/user-created.event';

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    // Create mocks
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByKeycloakId: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn(),
    };

    mockEventBus = {
      publish: jest.fn(),
    } as any;

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserHandler,
        {
          provide: 'IUserRepository',
          useValue: mockRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<CreateUserHandler>(CreateUserHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const command = new CreateUserCommand(
      'keycloak-123',
      'test@example.com',
      'John',
      'Doe',
    );

    it('should create user successfully', async () => {
      // Arrange
      mockRepository.findByKeycloakId.mockResolvedValue(null);
      mockRepository.findByEmail.mockResolvedValue(null);

      // Act
      const user = await handler.execute(command);

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.email.value).toBe('test@example.com');
      expect(user.fullName.firstName).toBe('John');
      expect(user.fullName.lastName).toBe('Doe');
      expect(user.keycloakId).toBe('keycloak-123');
      expect(user.isActive).toBe(true);

      // Verify repository was called
      expect(mockRepository.findByKeycloakId).toHaveBeenCalledWith('keycloak-123');
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockRepository.save).toHaveBeenCalledWith(user);

      // Verify event was published
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserCreatedEvent),
      );
    });

    it('should throw UserAlreadyExistsException if user with keycloakId exists', async () => {
      // Arrange
      const existingUser = User.create(
        'existing-id',
        'keycloak-123',
        Email.create('existing@example.com'),
        FullName.create('Existing', 'User'),
      );
      mockRepository.findByKeycloakId.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        UserAlreadyExistsException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'test@example.com',
      );

      // Verify repository was NOT called for save
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should throw UserAlreadyExistsException if user with email exists', async () => {
      // Arrange
      mockRepository.findByKeycloakId.mockResolvedValue(null);
      const existingUser = User.create(
        'existing-id',
        'other-keycloak-id',
        Email.create('test@example.com'),
        FullName.create('Existing', 'User'),
      );
      mockRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        UserAlreadyExistsException,
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should create user with normalized email', async () => {
      // Arrange
      const commandWithUpperCase = new CreateUserCommand(
        'keycloak-123',
        'TEST@EXAMPLE.COM',
        'John',
        'Doe',
      );
      mockRepository.findByKeycloakId.mockResolvedValue(null);
      mockRepository.findByEmail.mockResolvedValue(null);

      // Act
      const user = await handler.execute(commandWithUpperCase);

      // Assert
      expect(user.email.value).toBe('test@example.com'); // Normalized to lowercase
    });

    it('should create user with trimmed names', async () => {
      // Arrange
      const commandWithSpaces = new CreateUserCommand(
        'keycloak-123',
        'test@example.com',
        '  John  ',
        '  Doe  ',
      );
      mockRepository.findByKeycloakId.mockResolvedValue(null);
      mockRepository.findByEmail.mockResolvedValue(null);

      // Act
      const user = await handler.execute(commandWithSpaces);

      // Assert
      expect(user.fullName.firstName).toBe('John');
      expect(user.fullName.lastName).toBe('Doe');
    });
  });
});
