import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ExpirationSchedulerService } from '../expiration-scheduler.service';
import { CompleteInvitationCommand } from '../../../application/commands/complete-invitation/complete-invitation.command';
import { LoggerService } from '../../logger/logger.service';

describe('ExpirationSchedulerService', () => {
  let service: ExpirationSchedulerService;
  let mockRepository: any;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockLogger: any;

  beforeEach(async () => {
    mockRepository = {
      findExpiredInvitations: jest.fn().mockResolvedValue([]),
      findTimedOutInvitations: jest.fn().mockResolvedValue([]),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpirationSchedulerService,
        { provide: 'IInvitationRepository', useValue: mockRepository },
        { provide: CommandBus, useValue: { execute: jest.fn() } },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get(ExpirationSchedulerService);
    mockCommandBus = module.get(CommandBus);
  });

  describe('handleExpiredInvitations', () => {
    it('should do nothing when no expired invitations found', async () => {
      await service.handleExpiredInvitations();

      expect(mockRepository.findExpiredInvitations).toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should complete each expired invitation with reason expired', async () => {
      mockRepository.findExpiredInvitations.mockResolvedValue([
        { id: 'inv-1', candidateId: 'c-1' },
        { id: 'inv-2', candidateId: 'c-2' },
      ]);

      await service.handleExpiredInvitations();

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(2);
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new CompleteInvitationCommand('inv-1', null, 'expired'),
      );
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new CompleteInvitationCommand('inv-2', null, 'expired'),
      );
    });

    it('should continue processing remaining invitations if one fails', async () => {
      mockRepository.findExpiredInvitations.mockResolvedValue([
        { id: 'inv-1', candidateId: 'c-1' },
        { id: 'inv-2', candidateId: 'c-2' },
        { id: 'inv-3', candidateId: 'c-3' },
      ]);
      mockCommandBus.execute
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce(undefined);

      await service.handleExpiredInvitations();

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(3);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('inv-2'),
        expect.anything(),
        expect.objectContaining({ action: 'expiration_error' }),
      );
    });

    it('should not run concurrently (isProcessing guard)', async () => {
      let resolveFirst: () => void;
      const firstCallBlocks = new Promise<void>((r) => {
        resolveFirst = r;
      });

      mockRepository.findExpiredInvitations.mockResolvedValue([
        { id: 'inv-1', candidateId: 'c-1' },
      ]);
      mockCommandBus.execute.mockImplementationOnce(() => firstCallBlocks);

      const first = service.handleExpiredInvitations();
      const second = service.handleExpiredInvitations();

      resolveFirst!();
      await first;
      await second;

      expect(mockRepository.findExpiredInvitations).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleTimedOutInvitations', () => {
    it('should do nothing when no timed-out invitations found', async () => {
      await service.handleTimedOutInvitations();

      expect(mockRepository.findTimedOutInvitations).toHaveBeenCalledWith(30);
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should complete each timed-out invitation with reason auto_timeout', async () => {
      mockRepository.findTimedOutInvitations.mockResolvedValue([
        { id: 'inv-1', candidateId: 'c-1' },
      ]);

      await service.handleTimedOutInvitations();

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new CompleteInvitationCommand('inv-1', null, 'auto_timeout'),
      );
    });

    it('should continue processing remaining invitations if one fails', async () => {
      mockRepository.findTimedOutInvitations.mockResolvedValue([
        { id: 'inv-1', candidateId: 'c-1' },
        { id: 'inv-2', candidateId: 'c-2' },
      ]);
      mockCommandBus.execute
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(undefined);

      await service.handleTimedOutInvitations();

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('inv-1'),
        expect.anything(),
        expect.objectContaining({ action: 'timeout_error' }),
      );
    });

    it('should log repository errors without crashing', async () => {
      mockRepository.findTimedOutInvitations.mockRejectedValue(
        new Error('DB down'),
      );

      await service.handleTimedOutInvitations();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Timeout scheduler failed'),
        expect.anything(),
      );
    });
  });
});
