import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { DeleteUserHandler } from '../delete-user.handler';
import { DeleteUserCommand } from '../delete-user.command';
import { User } from '../../../../domain/aggregates/user.aggregate';
import { Email } from '../../../../domain/value-objects/email.vo';
import { FullName } from '../../../../domain/value-objects/full-name.vo';
import { UserNotFoundException } from '../../../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../../../domain/constants';
import type { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import type { IOutboxService } from '../../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../../interfaces/unit-of-work.interface';

describe('DeleteUserHandler', () => {
  let handler: DeleteUserHandler;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockOutboxService: jest.Mocked<IOutboxService>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;

  const userId = 'user-123';
  const externalAuthId = 'auth-456';
  const emailValue = 'test@example.com';
  const deletedBy = 'admin-789';

  const createExistingUser = (): User => {
    return User.reconstitute(
      userId,
      externalAuthId,
      Email.create(emailValue),
      FullName.create('John', 'Doe'),
      { value: 'active', isActive: () => true, isSuspended: () => false, isDeleted: () => false } as any,
      { value: 'candidate', isPending: () => false, isCandidate: () => true, isHR: () => false, isAdmin: () => false, toString: () => 'candidate' } as any,
      undefined, // avatarUrl
      undefined, // bio
      undefined, // phone
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
        DeleteUserHandler,
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: 'IOutboxService', useValue: mockOutboxService },
        { provide: 'IUnitOfWork', useValue: mockUnitOfWork },
      ],
    }).compile();

    handler = module.get<DeleteUserHandler>(DeleteUserHandler);
  });

  describe('execute', () => {
    it('should delete a user successfully', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new DeleteUserCommand(userId, deletedBy);

      await expect(handler.execute(command)).resolves.toBeUndefined();
    });

    it('should throw UserNotFoundException when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const command = new DeleteUserCommand(userId, deletedBy);

      await expect(handler.execute(command)).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should find user by ID', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new DeleteUserCommand(userId, deletedBy);

      await handler.execute(command);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should call user.delete() with deletedBy', async () => {
      const existingUser = createExistingUser();
      const deleteSpy = jest.spyOn(existingUser, 'delete');
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new DeleteUserCommand(userId, deletedBy);

      await handler.execute(command);

      expect(deleteSpy).toHaveBeenCalledWith(deletedBy);
    });

    it('should execute outbox save and repository delete within UnitOfWork transaction', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new DeleteUserCommand(userId, deletedBy);

      await handler.execute(command);

      expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);
      expect(mockUnitOfWork.execute).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should save outbox event before deleting from repository within transaction', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const callOrder: string[] = [];
      mockOutboxService.saveEvent.mockImplementation(async () => {
        callOrder.push('saveEvent');
        return 'mock-event-id';
      });
      mockUserRepository.delete.mockImplementation(async () => {
        callOrder.push('delete');
      });

      const command = new DeleteUserCommand(userId, deletedBy);

      await handler.execute(command);

      expect(callOrder).toEqual(['saveEvent', 'delete']);
    });

    it('should save outbox event with correct type and payload within transaction', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new DeleteUserCommand(userId, deletedBy);

      await handler.execute(command);

      expect(mockOutboxService.saveEvent).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        USER_EVENT_TYPES.DELETED,
        expect.objectContaining({
          userId,
          externalAuthId,
          email: emailValue,
        }),
        userId,
        {}, // tx context from mockUnitOfWork
      );
    });

    it('should delete user from repository with transaction context', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new DeleteUserCommand(userId, deletedBy);

      await handler.execute(command);

      expect(mockUserRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(
        userId,
        {}, // tx context from mockUnitOfWork
      );
    });

    it('should publish domain events via EventBus after UnitOfWork commit', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new DeleteUserCommand(userId, deletedBy);

      await handler.execute(command);

      // user.delete() emits UserDeletedEvent
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should schedule outbox publishing after UnitOfWork commit', async () => {
      const existingUser = createExistingUser();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      const command = new DeleteUserCommand(userId, deletedBy);

      await handler.execute(command);

      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
        'mock-event-id',
      ]);
    });

    it('should not save to outbox or delete when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const command = new DeleteUserCommand(userId, deletedBy);

      await expect(handler.execute(command)).rejects.toThrow();

      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
      expect(mockOutboxService.saveEvent).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });
  });
});
