import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { UpdateUserHandler } from '../update-user.handler';
import { UpdateUserCommand } from '../update-user.command';
import { User } from '../../../../domain/aggregates/user.aggregate';
import { Email } from '../../../../domain/value-objects/email.vo';
import { FullName } from '../../../../domain/value-objects/full-name.vo';
import { UserNotFoundException } from '../../../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../../../domain/constants';
import type { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import type { IOutboxService } from '../../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../../interfaces/unit-of-work.interface';

describe('UpdateUserHandler', () => {
  let handler: UpdateUserHandler;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockOutboxService: jest.Mocked<IOutboxService>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;

  const userId = 'user-123';
  const externalAuthId = 'auth-456';
  const emailValue = 'test@example.com';

  const createExistingUser = (): User => {
    return User.reconstitute(
      userId,
      externalAuthId,
      Email.create(emailValue),
      FullName.create('John', 'Doe'),
      { value: 'active', isActive: () => true, isSuspended: () => false, isDeleted: () => false } as any,
      { value: 'candidate', isPending: () => false, isCandidate: () => true, isHR: () => false, isAdmin: () => false, toString: () => 'candidate' } as any,
      undefined, // avatarUrl
      'Original bio', // bio
      '+1234567890', // phone
      'UTC', // timezone
      'en', // language
      false, // emailVerified
      new Date(), // createdAt
      new Date(), // updatedAt
    );
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserHandler,
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: 'IOutboxService', useValue: mockOutboxService },
        { provide: 'IUnitOfWork', useValue: mockUnitOfWork },
      ],
    }).compile();

    handler = module.get<UpdateUserHandler>(UpdateUserHandler);
  });

  describe('execute', () => {
    it('should update user profile with new name', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new UpdateUserCommand(
        userId,
        'Jane',
        'Smith',
      );

      const result = await handler.execute(command);

      expect(result).toBeInstanceOf(User);
      expect(result.fullName.firstName).toBe('Jane');
      expect(result.fullName.lastName).toBe('Smith');
    });

    it('should update user profile with bio, phone, timezone, language', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new UpdateUserCommand(
        userId,
        undefined,
        undefined,
        'New bio',
        '+9876543210',
        'Europe/Moscow',
        'ru',
      );

      const result = await handler.execute(command);

      expect(result).toBeInstanceOf(User);
      expect(result.bio).toBe('New bio');
      expect(result.phone).toBe('+9876543210');
      expect(result.timezone).toBe('Europe/Moscow');
      expect(result.language).toBe('ru');
    });

    it('should throw UserNotFoundException when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      await expect(handler.execute(command)).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should find user by ID', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      await handler.execute(command);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should execute save and outbox within UnitOfWork transaction', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      await handler.execute(command);

      expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);
      expect(mockUnitOfWork.execute).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should save user via repository with transaction context', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      await handler.execute(command);

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.any(User),
        {}, // tx context from mockUnitOfWork
      );
    });

    it('should save outbox event with correct type and payload within transaction', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      await handler.execute(command);

      expect(mockOutboxService.saveEvent).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        USER_EVENT_TYPES.UPDATED,
        expect.objectContaining({
          userId,
          externalAuthId,
          email: emailValue,
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'candidate',
        }),
        userId,
        {}, // tx context from mockUnitOfWork
      );
    });

    it('should publish domain events via EventBus after UnitOfWork commit', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      await handler.execute(command);

      // updateProfile emits UserUpdatedEvent
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should schedule outbox publishing after UnitOfWork commit', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      await handler.execute(command);

      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
        'mock-event-id',
      ]);
    });

    it('should not save to repository or outbox when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      await expect(handler.execute(command)).rejects.toThrow();

      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockOutboxService.saveEvent).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });

    it('should return the updated user aggregate', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      const result = await handler.execute(command);

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(userId);
    });
  });
});
