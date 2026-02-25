import { OutboxSchedulerService } from '../outbox-scheduler.service';
import { OUTBOX_STATUS, OUTBOX_CONFIG } from '../../../constants';

describe('OutboxSchedulerService', () => {
  let service: OutboxSchedulerService;

  const mockQueryBuilder = {
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 0 }),
  };

  const mockOutboxRepository = {
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockOutboxQueue = {
    add: jest.fn().mockResolvedValue(undefined),
  };

  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OutboxSchedulerService(
      mockOutboxRepository as any,
      mockOutboxQueue as any,
      mockLogger as any,
    );
  });

  describe('pollPendingEvents', () => {
    it('should find pending events and add them to queue', async () => {
      const pendingEvents = [
        { eventId: 'evt-1', eventType: 'user.created' },
        { eventId: 'evt-2', eventType: 'user.updated' },
      ];
      mockOutboxRepository.find.mockResolvedValue(pendingEvents);

      await service.pollPendingEvents();

      expect(mockOutboxRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OUTBOX_STATUS.PENDING,
          }),
          take: OUTBOX_CONFIG.PENDING_BATCH_SIZE,
          order: { createdAt: 'ASC' },
        }),
      );

      expect(mockOutboxQueue.add).toHaveBeenCalledTimes(2);
      expect(mockOutboxQueue.add).toHaveBeenCalledWith(
        'publish-outbox-event',
        { eventId: 'evt-1' },
        expect.objectContaining({
          jobId: 'evt-1',
          removeOnComplete: true,
          removeOnFail: false,
        }),
      );
      expect(mockOutboxQueue.add).toHaveBeenCalledWith(
        'publish-outbox-event',
        { eventId: 'evt-2' },
        expect.objectContaining({
          jobId: 'evt-2',
        }),
      );
    });

    it('should skip if already polling (isPolling flag)', async () => {
      const pendingEvents = [{ eventId: 'evt-1', eventType: 'user.created' }];
      mockOutboxRepository.find.mockResolvedValue(pendingEvents);

      // Simulate concurrent call: make the first call hold via a delayed find
      let resolveFirst: () => void;
      const firstCallPromise = new Promise<void>((r) => {
        resolveFirst = r;
      });
      mockOutboxRepository.find.mockImplementationOnce(async () => {
        await firstCallPromise;
        return pendingEvents;
      });

      // Start first poll (will block on find)
      const poll1 = service.pollPendingEvents();

      // Start second poll while first is running
      await service.pollPendingEvents();

      // The second poll should have returned immediately without calling find again
      // (find was called once by poll1)
      expect(mockOutboxRepository.find).toHaveBeenCalledTimes(1);

      // Resolve first poll
      resolveFirst!();
      await poll1;
    });

    it('should handle "job already exists" errors gracefully', async () => {
      const pendingEvents = [
        { eventId: 'evt-1', eventType: 'user.created' },
        { eventId: 'evt-2', eventType: 'user.updated' },
      ];
      mockOutboxRepository.find.mockResolvedValue(pendingEvents);

      // First add throws 'job already exists', second succeeds
      mockOutboxQueue.add
        .mockRejectedValueOnce(new Error('job already exists'))
        .mockResolvedValueOnce(undefined);

      await service.pollPendingEvents();

      // Should continue to second event without logging error
      expect(mockOutboxQueue.add).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log error for non-duplicate job failures', async () => {
      const pendingEvents = [{ eventId: 'evt-1', eventType: 'user.created' }];
      mockOutboxRepository.find.mockResolvedValue(pendingEvents);

      mockOutboxQueue.add.mockRejectedValueOnce(new Error('Redis connection lost'));

      await service.pollPendingEvents();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to queue outbox event evt-1'),
        expect.objectContaining({
          category: 'outbox',
          action: 'queue_failed',
          eventId: 'evt-1',
          error: 'Redis connection lost',
        }),
      );
    });

    it('should reset isPolling on error', async () => {
      mockOutboxRepository.find.mockRejectedValue(new Error('DB connection lost'));

      await service.pollPendingEvents();

      // isPolling should be reset, so next call should proceed
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Outbox polling failed'),
        expect.objectContaining({
          category: 'outbox',
          action: 'poll_error',
          error: 'DB connection lost',
        }),
      );

      // Verify isPolling was reset by calling again
      mockOutboxRepository.find.mockResolvedValue([]);
      await service.pollPendingEvents();

      // Should have called find a second time (not blocked by isPolling)
      expect(mockOutboxRepository.find).toHaveBeenCalledTimes(2);
    });

    it('should not add jobs when no pending events found', async () => {
      mockOutboxRepository.find.mockResolvedValue([]);

      await service.pollPendingEvents();

      expect(mockOutboxQueue.add).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it('should log the count of pending events found', async () => {
      const pendingEvents = [
        { eventId: 'evt-1', eventType: 'user.created' },
        { eventId: 'evt-2', eventType: 'user.updated' },
        { eventId: 'evt-3', eventType: 'user.suspended' },
      ];
      mockOutboxRepository.find.mockResolvedValue(pendingEvents);

      await service.pollPendingEvents();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Found 3 pending outbox events',
        expect.objectContaining({
          category: 'outbox',
          action: 'poll_pending',
          count: 3,
        }),
      );
    });
  });

  describe('pollStuckEvents', () => {
    it('should reset stuck events to pending and increment retryCount', async () => {
      const stuckEvents = [
        {
          eventId: 'stuck-1',
          status: OUTBOX_STATUS.PUBLISHING,
          retryCount: 1,
        },
        {
          eventId: 'stuck-2',
          status: OUTBOX_STATUS.PUBLISHING,
          retryCount: 0,
        },
      ];
      mockOutboxRepository.find.mockResolvedValue(stuckEvents);

      await service.pollStuckEvents();

      expect(mockOutboxRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OUTBOX_STATUS.PUBLISHING,
          }),
          take: OUTBOX_CONFIG.STUCK_BATCH_SIZE,
        }),
      );

      // Save should be called for each stuck event
      expect(mockOutboxRepository.save).toHaveBeenCalledTimes(2);

      // First event: status reset to pending, retryCount incremented
      expect(stuckEvents[0].status).toBe(OUTBOX_STATUS.PENDING);
      expect(stuckEvents[0].retryCount).toBe(2);

      // Second event: status reset to pending, retryCount incremented
      expect(stuckEvents[1].status).toBe(OUTBOX_STATUS.PENDING);
      expect(stuckEvents[1].retryCount).toBe(1);
    });

    it('should do nothing when no stuck events found', async () => {
      mockOutboxRepository.find.mockResolvedValue([]);

      await service.pollStuckEvents();

      expect(mockOutboxRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should log warning when stuck events are found', async () => {
      const stuckEvents = [
        { eventId: 'stuck-1', status: OUTBOX_STATUS.PUBLISHING, retryCount: 0 },
      ];
      mockOutboxRepository.find.mockResolvedValue(stuckEvents);

      await service.pollStuckEvents();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Found 1 stuck outbox events',
        expect.objectContaining({
          category: 'outbox',
          action: 'poll_stuck',
          count: 1,
        }),
      );
    });

    it('should log debug for each reset event', async () => {
      const stuckEvents = [
        { eventId: 'stuck-1', status: OUTBOX_STATUS.PUBLISHING, retryCount: 0 },
      ];
      mockOutboxRepository.find.mockResolvedValue(stuckEvents);

      await service.pollStuckEvents();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Reset stuck outbox event stuck-1 to pending',
        expect.objectContaining({
          category: 'outbox',
          action: 'reset_stuck',
          eventId: 'stuck-1',
          retryCount: 1,
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      mockOutboxRepository.find.mockRejectedValue(new Error('DB timeout'));

      await service.pollStuckEvents();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process stuck outbox events: DB timeout'),
        expect.objectContaining({
          category: 'outbox',
          action: 'stuck_error',
          error: 'DB timeout',
        }),
      );
    });
  });

  describe('cleanupOldEvents', () => {
    it('should delete old published events', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 15 });

      await service.cleanupOldEvents();

      expect(mockOutboxRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'status = :status',
        { status: OUTBOX_STATUS.PUBLISHED },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'published_at < :date',
        { date: expect.any(Date) },
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Cleaned up 15 old outbox events',
        expect.objectContaining({
          category: 'outbox',
          action: 'cleanup',
          deletedCount: 15,
        }),
      );
    });

    it('should not log when no events were deleted', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      await service.cleanupOldEvents();

      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockQueryBuilder.execute.mockRejectedValue(new Error('Query failed'));

      await service.cleanupOldEvents();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Outbox cleanup failed: Query failed'),
        expect.objectContaining({
          category: 'outbox',
          action: 'cleanup_error',
          error: 'Query failed',
        }),
      );
    });

    it('should handle null affected count', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: null });

      await service.cleanupOldEvents();

      // affected is null, so deleted = 0, no log
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should use correct retention threshold', async () => {
      const beforeTimestamp = Date.now() - OUTBOX_CONFIG.CLEANUP_RETENTION_MS;
      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      await service.cleanupOldEvents();

      const dateArg = mockQueryBuilder.andWhere.mock.calls[0][1].date as Date;
      const afterTimestamp = Date.now() - OUTBOX_CONFIG.CLEANUP_RETENTION_MS;

      expect(dateArg.getTime()).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(dateArg.getTime()).toBeLessThanOrEqual(afterTimestamp);
    });
  });
});
