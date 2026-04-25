import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { UserUpdateService } from '../user-update.service';
import type { UpdateUserInput } from '../user-update.service';
import { User } from '../../../domain/aggregates/user.aggregate';
import { Email } from '../../../domain/value-objects/email.vo';
import { FullName } from '../../../domain/value-objects/full-name.vo';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../../domain/constants';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

describe('UserUpdateService', () => {
  let service: UserUpdateService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockOutboxService: jest.Mocked<IOutboxService>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;
  let mockLogger: Partial<LoggerService>;

  const userId = 'user-123';
  const externalAuthId = 'auth-456';
  const emailValue = 'test@example.com';

  const createExistingUser = (): User => {
    return User.reconstitute({
      id: userId,
      externalAuthId,
      email: Email.create(emailValue),
      fullName: FullName.create('John', 'Doe'),
      status: {
        value: 'active',
        isActive: () => true,
        isSuspended: () => false,
        isDeleted: () => false,
      } as any,
      role: {
        value: 'candidate',
        isPending: () => false,
        isCandidate: () => true,
        isHR: () => false,
        isAdmin: () => false,
        toString: () => 'candidate',
      } as any,
      bio: 'Original bio',
      phone: '+1234567890',
      timezone: 'UTC',
      language: 'en',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const baseInput: UpdateUserInput = { userId };

  beforeEach(async () => {
    mockUserRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(null),
      findByExternalAuthId: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockEventBus = { publish: jest.fn() } as any;

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
        UserUpdateService,
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: 'IOutboxService', useValue: mockOutboxService },
        { provide: 'IUnitOfWork', useValue: mockUnitOfWork },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UserUpdateService>(UserUpdateService);
  });

  describe('update', () => {
    it('should update user profile with new name', async () => {
      mockUserRepository.findById.mockResolvedValue(createExistingUser());

      const result = await service.update({
        ...baseInput,
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(result).toBeInstanceOf(User);
      expect(result.fullName.firstName).toBe('Jane');
      expect(result.fullName.lastName).toBe('Smith');
    });

    it('should update bio, phone, timezone, language without name change', async () => {
      mockUserRepository.findById.mockResolvedValue(createExistingUser());

      const result = await service.update({
        ...baseInput,
        bio: 'New bio',
        phone: '+9876543210',
        timezone: 'Europe/Moscow',
        language: 'ru',
      });

      expect(result).toBeInstanceOf(User);
      expect(result.bio).toBe('New bio');
      expect(result.phone).toBe('+9876543210');
      expect(result.timezone).toBe('Europe/Moscow');
      expect(result.language).toBe('ru');
    });

    it('should throw UserNotFoundException when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        service.update({ ...baseInput, firstName: 'Jane', lastName: 'Smith' }),
      ).rejects.toThrow(UserNotFoundException);
    });

    it('should find user by ID', async () => {
      mockUserRepository.findById.mockResolvedValue(createExistingUser());

      await service.update({
        ...baseInput,
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should execute save and outbox within UnitOfWork transaction', async () => {
      mockUserRepository.findById.mockResolvedValue(createExistingUser());

      await service.update({
        ...baseInput,
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);
      expect(mockUnitOfWork.execute).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should save user via repository with transaction context', async () => {
      mockUserRepository.findById.mockResolvedValue(createExistingUser());

      await service.update({
        ...baseInput,
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.any(User),
        {},
      );
    });

    it('should save outbox event with correct type and payload within transaction', async () => {
      mockUserRepository.findById.mockResolvedValue(createExistingUser());

      await service.update({
        ...baseInput,
        firstName: 'Jane',
        lastName: 'Smith',
      });

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
        {},
      );
    });

    it('should publish domain events via EventBus after UnitOfWork commit', async () => {
      mockUserRepository.findById.mockResolvedValue(createExistingUser());

      await service.update({
        ...baseInput,
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should schedule outbox publishing after UnitOfWork commit', async () => {
      mockUserRepository.findById.mockResolvedValue(createExistingUser());

      await service.update({
        ...baseInput,
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
        'mock-event-id',
      ]);
    });

    it('should not save to repository or outbox when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        service.update({ ...baseInput, firstName: 'Jane', lastName: 'Smith' }),
      ).rejects.toThrow();

      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockOutboxService.saveEvent).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });

    it('should return the updated user aggregate', async () => {
      mockUserRepository.findById.mockResolvedValue(createExistingUser());

      const result = await service.update({
        ...baseInput,
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(userId);
    });
  });
});
