import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { UserCreationService } from '../user-creation.service';
import type { CreateUserInput } from '../user-creation.service';
import { User } from '../../../domain/aggregates/user.aggregate';
import { Email } from '../../../domain/value-objects/email.vo';
import { FullName } from '../../../domain/value-objects/full-name.vo';
import { UserAlreadyExistsException } from '../../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../../domain/constants';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

describe('UserCreationService', () => {
  let service: UserCreationService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockOutboxService: jest.Mocked<IOutboxService>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;
  let mockLogger: Partial<LoggerService>;

  const userId = 'user-123';
  const externalAuthId = 'auth-456';
  const emailValue = 'test@example.com';
  const firstName = 'John';
  const lastName = 'Doe';

  const validInput: CreateUserInput = {
    userId,
    externalAuthId,
    email: emailValue,
    firstName,
    lastName,
  };

  beforeEach(async () => {
    mockUserRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(null),
      findByExternalAuthId: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined),
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
        UserCreationService,
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: 'IOutboxService', useValue: mockOutboxService },
        { provide: 'IUnitOfWork', useValue: mockUnitOfWork },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UserCreationService>(UserCreationService);
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const result = await service.create(validInput);

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
      await service.create(validInput);

      expect(mockUserRepository.findByExternalAuthId).toHaveBeenCalledWith(
        externalAuthId,
      );
    });

    it('should check for existing user by email', async () => {
      await service.create(validInput);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(emailValue);
    });

    it('should throw UserAlreadyExistsException when user exists by externalAuthId', async () => {
      const existingUser = User.create({
        id: 'existing-id',
        externalAuthId,
        email: Email.create(emailValue),
        fullName: FullName.create(firstName, lastName),
      });
      mockUserRepository.findByExternalAuthId.mockResolvedValue(existingUser);

      await expect(service.create(validInput)).rejects.toThrow(
        UserAlreadyExistsException,
      );
    });

    it('should throw UserAlreadyExistsException when user exists by email', async () => {
      const existingUser = User.create({
        id: 'existing-id',
        externalAuthId: 'other-auth-id',
        email: Email.create(emailValue),
        fullName: FullName.create(firstName, lastName),
      });
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.create(validInput)).rejects.toThrow(
        UserAlreadyExistsException,
      );
    });

    it('should execute save and outbox within UnitOfWork transaction', async () => {
      await service.create(validInput);

      expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);
      expect(mockUnitOfWork.execute).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should save user via repository with transaction context', async () => {
      await service.create(validInput);

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.any(User),
        {}, // tx context from mockUnitOfWork
      );
    });

    it('should save outbox event with correct type and payload within transaction', async () => {
      await service.create(validInput);

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
      await service.create(validInput);

      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should schedule outbox publishing after UnitOfWork commit', async () => {
      await service.create(validInput);

      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
        'mock-event-id',
      ]);
    });

    it('should log user creation start and success', async () => {
      await service.create(validInput);

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
      const existingUser = User.create({
        id: 'existing-id',
        externalAuthId,
        email: Email.create(emailValue),
        fullName: FullName.create(firstName, lastName),
      });
      mockUserRepository.findByExternalAuthId.mockResolvedValue(existingUser);

      await expect(service.create(validInput)).rejects.toThrow();

      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockOutboxService.saveEvent).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });

    it('should return the created user aggregate', async () => {
      const result = await service.create(validInput);

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(userId);
    });
  });
});
