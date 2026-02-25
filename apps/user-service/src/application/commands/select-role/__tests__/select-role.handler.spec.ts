import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { SelectRoleHandler } from '../select-role.handler';
import { SelectRoleCommand } from '../select-role.command';
import { User } from '../../../../domain/aggregates/user.aggregate';
import { Email } from '../../../../domain/value-objects/email.vo';
import { FullName } from '../../../../domain/value-objects/full-name.vo';
import { UserRole } from '../../../../domain/value-objects/user-role.vo';
import { UserNotFoundException } from '../../../../domain/exceptions/user.exceptions';
import { USER_EVENT_TYPES } from '../../../../domain/constants';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

describe('SelectRoleHandler', () => {
  let handler: SelectRoleHandler;

  const mockUserRepository = {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    findByExternalAuthId: jest.fn(),
    findByEmail: jest.fn(),
    delete: jest.fn(),
  };

  const mockCandidateProfileRepository = {
    save: jest.fn().mockResolvedValue(undefined),
    findByUserId: jest.fn(),
    delete: jest.fn(),
    hasSkill: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn(),
    publishAll: jest.fn(),
  };

  const mockOutboxService = {
    saveEvent: jest.fn().mockResolvedValue('mock-event-id'),
    saveEvents: jest.fn().mockResolvedValue([]),
    schedulePublishing: jest.fn().mockResolvedValue(undefined),
  };

  const mockUnitOfWork = {
    execute: jest.fn().mockImplementation(async (work) => work({})),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SelectRoleHandler,
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: 'ICandidateProfileRepository', useValue: mockCandidateProfileRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: 'IOutboxService', useValue: mockOutboxService },
        { provide: 'IUnitOfWork', useValue: mockUnitOfWork },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    handler = module.get<SelectRoleHandler>(SelectRoleHandler);
  });

  const createPendingUser = (id: string = 'user-id-1'): User => {
    return User.reconstitute(
      id,
      'ext-auth-id-1',
      Email.create('test@example.com'),
      FullName.create('John', 'Doe'),
      { value: 'active', isActive: () => true, isSuspended: () => false, isDeleted: () => false } as any,
      UserRole.pending(),
      undefined,
      undefined,
      undefined,
      'UTC',
      'en',
      false,
      new Date(),
      new Date(),
    );
  };

  describe('Success Cases', () => {
    it('should select candidate role and create candidate profile', async () => {
      // Arrange
      const user = createPendingUser();
      mockUserRepository.findById.mockResolvedValue(user);

      const command = new SelectRoleCommand('user-id-1', 'candidate');

      // Act
      await handler.execute(command);

      // Assert - UnitOfWork was called
      expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);

      // Assert - CandidateProfile saved within transaction
      expect(mockCandidateProfileRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCandidateProfileRepository.save).toHaveBeenCalledWith(
        expect.anything(), // CandidateProfile instance
        {}, // tx context from UoW
      );

      // Assert - User saved within transaction
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-id-1' }),
        {}, // tx context from UoW
      );

      // Assert - Outbox event saved within transaction with 4 args
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        USER_EVENT_TYPES.ROLE_SELECTED,
        expect.objectContaining({
          userId: 'user-id-1',
          role: 'candidate',
        }),
        'user-id-1',
        {}, // tx context from UoW
      );

      // Assert - schedulePublishing called after UoW commit
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith(['mock-event-id']);

      // Assert - Domain events published via EventBus
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should select hr role without creating candidate profile', async () => {
      // Arrange
      const user = createPendingUser();
      mockUserRepository.findById.mockResolvedValue(user);

      const command = new SelectRoleCommand('user-id-1', 'hr');

      // Act
      await handler.execute(command);

      // Assert - No CandidateProfile created
      expect(mockCandidateProfileRepository.save).not.toHaveBeenCalled();

      // Assert - User saved within transaction
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-id-1' }),
        {}, // tx context
      );

      // Assert - Outbox event saved within transaction
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        USER_EVENT_TYPES.ROLE_SELECTED,
        expect.objectContaining({
          userId: 'user-id-1',
          role: 'hr',
        }),
        'user-id-1',
        {}, // tx context
      );

      // Assert - schedulePublishing called
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith(['mock-event-id']);
    });

    it('should select admin role without creating candidate profile', async () => {
      // Arrange
      const user = createPendingUser();
      mockUserRepository.findById.mockResolvedValue(user);

      const command = new SelectRoleCommand('user-id-1', 'admin');

      // Act
      await handler.execute(command);

      // Assert - No CandidateProfile created
      expect(mockCandidateProfileRepository.save).not.toHaveBeenCalled();

      // Assert - Outbox event saved within transaction
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        USER_EVENT_TYPES.ROLE_SELECTED,
        expect.objectContaining({
          userId: 'user-id-1',
          role: 'admin',
        }),
        'user-id-1',
        {}, // tx context
      );

      // Assert - schedulePublishing called
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith(['mock-event-id']);
    });

    it('should include correct fields in outbox event payload', async () => {
      // Arrange
      const user = createPendingUser();
      mockUserRepository.findById.mockResolvedValue(user);

      const command = new SelectRoleCommand('user-id-1', 'candidate');

      // Act
      await handler.execute(command);

      // Assert - Outbox payload includes all required fields
      const saveEventCall = mockOutboxService.saveEvent.mock.calls[0];
      const payload = saveEventCall[1];

      expect(payload.userId).toBe('user-id-1');
      expect(payload.externalAuthId).toBe('ext-auth-id-1');
      expect(payload.email).toBe('test@example.com');
      expect(payload.role).toBe('candidate');
      expect(payload.selectedAt).toBeDefined();
    });
  });

  describe('Error Cases', () => {
    it('should throw UserNotFoundException when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      const command = new SelectRoleCommand('non-existent-id', 'candidate');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(UserNotFoundException);

      // Assert - No saves attempted
      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockOutboxService.saveEvent).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });

    it('should throw error for invalid role', async () => {
      // Arrange
      const user = createPendingUser();
      mockUserRepository.findById.mockResolvedValue(user);

      const command = new SelectRoleCommand('user-id-1', 'invalid' as any);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Invalid role: invalid');
    });

    it('should throw when role already selected (not pending)', async () => {
      // Arrange - user with non-pending role
      const user = User.reconstitute(
        'user-id-1',
        'ext-auth-id-1',
        Email.create('test@example.com'),
        FullName.create('John', 'Doe'),
        { value: 'active', isActive: () => true, isSuspended: () => false, isDeleted: () => false } as any,
        UserRole.candidate(), // Already candidate
        undefined,
        undefined,
        undefined,
        'UTC',
        'en',
        false,
        new Date(),
        new Date(),
      );
      mockUserRepository.findById.mockResolvedValue(user);

      const command = new SelectRoleCommand('user-id-1', 'hr');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Role has already been selected',
      );

      // Assert - No saves attempted
      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
    });
  });

  describe('Transaction Behavior', () => {
    it('should execute all saves inside UnitOfWork transaction', async () => {
      // Arrange
      const user = createPendingUser();
      mockUserRepository.findById.mockResolvedValue(user);

      const executionOrder: string[] = [];
      mockCandidateProfileRepository.save.mockImplementation(async () => {
        executionOrder.push('candidateProfile.save');
      });
      mockUserRepository.save.mockImplementation(async () => {
        executionOrder.push('user.save');
      });
      mockOutboxService.saveEvent.mockImplementation(async () => {
        executionOrder.push('outbox.saveEvent');
        return 'mock-event-id';
      });

      const command = new SelectRoleCommand('user-id-1', 'candidate');

      // Act
      await handler.execute(command);

      // Assert - All operations happened inside UoW (before schedulePublishing)
      expect(executionOrder).toEqual([
        'candidateProfile.save',
        'user.save',
        'outbox.saveEvent',
      ]);

      // Assert - schedulePublishing called after UoW commit
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith(['mock-event-id']);
    });

    it('should not call schedulePublishing if UoW fails', async () => {
      // Arrange
      const user = createPendingUser();
      mockUserRepository.findById.mockResolvedValue(user);
      mockUnitOfWork.execute.mockRejectedValue(new Error('Transaction failed'));

      const command = new SelectRoleCommand('user-id-1', 'candidate');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Transaction failed');
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });
  });
});
