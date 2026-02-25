import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateUserHandler } from '../create-user.handler';
import { CreateUserCommand } from '../create-user.command';
import { User } from '../../../../domain/aggregates/user.aggregate';
import { Email } from '../../../../domain/value-objects/email.vo';
import { FullName } from '../../../../domain/value-objects/full-name.vo';
import { UserAlreadyExistsException } from '../../../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../../../domain/constants';
import type { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import type { IRoleRepository } from '../../../../domain/repositories/role.repository.interface';
import type { IOutboxService } from '../../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockRoleRepository: jest.Mocked<IRoleRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockOutboxService: jest.Mocked<IOutboxService>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;
  let mockLogger: Partial<LoggerService>;

  const userId = 'user-123';
  const externalAuthId = 'auth-456';
  const emailValue = 'test@example.com';
  const firstName = 'John';
  const lastName = 'Doe';

  beforeEach(async () => {
    mockUserRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(null),
      findByExternalAuthId: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockRoleRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findByName: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([]),
      findByUserId: jest.fn().mockResolvedValue([]),
      assignToUser: jest.fn().mockResolvedValue(undefined),
      removeFromUser: jest.fn().mockResolvedValue(undefined),
      userHasRole: jest.fn().mockResolvedValue(false),
    };

    mockEventBus = {
      publish: jest.fn(),
    } as any;

    mockOutboxService = {
      saveEvent: jest.fn().mockResolvedValue('mock-event-id'),
      saveEvents: jest.fn().mockResolvedValue(['mock-event-id']),
      schedulePublishing: jest.fn().mockResolvedValue(undefined),
    };

    mockUnitOfWork = {
      execute: jest.fn().mockImplementation(async (work) => work({})),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserHandler,
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: 'IRoleRepository', useValue: mockRoleRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: 'IOutboxService', useValue: mockOutboxService },
        { provide: 'IUnitOfWork', useValue: mockUnitOfWork },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    handler = module.get<CreateUserHandler>(CreateUserHandler);
  });

  describe('execute', () => {
    it('should create a new user successfully', async () => {
      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      const result = await handler.execute(command);

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(userId);
      expect(result.externalAuthId).toBe(externalAuthId);
      expect(result.email.value).toBe(emailValue);
      expect(result.fullName.firstName).toBe(firstName);
      expect(result.fullName.lastName).toBe(lastName);
      expect(result.status.isActive()).toBe(true);
      expect(result.role.isPending()).toBe(true);
    });

    it('should check for existing user by externalAuthId', async () => {
      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      await handler.execute(command);

      expect(mockUserRepository.findByExternalAuthId).toHaveBeenCalledWith(
        externalAuthId,
      );
    });

    it('should check for existing user by email', async () => {
      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      await handler.execute(command);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(emailValue);
    });

    it('should throw UserAlreadyExistsException when user exists by externalAuthId', async () => {
      const existingUser = User.create(
        'existing-id',
        externalAuthId,
        Email.create(emailValue),
        FullName.create(firstName, lastName),
      );
      mockUserRepository.findByExternalAuthId.mockResolvedValue(existingUser);

      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      await expect(handler.execute(command)).rejects.toThrow(
        UserAlreadyExistsException,
      );
    });

    it('should throw UserAlreadyExistsException when user exists by email', async () => {
      const existingUser = User.create(
        'existing-id',
        'other-auth-id',
        Email.create(emailValue),
        FullName.create(firstName, lastName),
      );
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      await expect(handler.execute(command)).rejects.toThrow(
        UserAlreadyExistsException,
      );
    });

    it('should execute save and outbox within UnitOfWork transaction', async () => {
      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      await handler.execute(command);

      expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);
      expect(mockUnitOfWork.execute).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should save user via repository with transaction context', async () => {
      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      await handler.execute(command);

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.any(User),
        {}, // tx context from mockUnitOfWork
      );
    });

    it('should save outbox event with correct type and payload within transaction', async () => {
      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      await handler.execute(command);

      expect(mockOutboxService.saveEvent).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        USER_EVENT_TYPES.CREATED,
        expect.objectContaining({
          userId,
          externalAuthId,
          email: emailValue,
          firstName,
          lastName,
          status: 'active',
          role: 'pending',
        }),
        userId,
        {}, // tx context from mockUnitOfWork
      );
    });

    it('should publish domain events via EventBus after UnitOfWork commit', async () => {
      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      await handler.execute(command);

      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should schedule outbox publishing after UnitOfWork commit', async () => {
      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      await handler.execute(command);

      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
        'mock-event-id',
      ]);
    });

    it('should log user creation start and success', async () => {
      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      await handler.execute(command);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating new user',
        expect.objectContaining({
          email: emailValue,
          externalAuthId,
          userId,
        }),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User created successfully',
        expect.objectContaining({
          userId,
          email: emailValue,
        }),
      );
    });

    it('should not save to repository or outbox when user already exists', async () => {
      const existingUser = User.create(
        'existing-id',
        externalAuthId,
        Email.create(emailValue),
        FullName.create(firstName, lastName),
      );
      mockUserRepository.findByExternalAuthId.mockResolvedValue(existingUser);

      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      await expect(handler.execute(command)).rejects.toThrow();

      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockOutboxService.saveEvent).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });

    it('should return the created user aggregate', async () => {
      const command = new CreateUserCommand(
        userId,
        externalAuthId,
        emailValue,
        firstName,
        lastName,
      );

      const result = await handler.execute(command);

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(userId);
    });
  });
});
