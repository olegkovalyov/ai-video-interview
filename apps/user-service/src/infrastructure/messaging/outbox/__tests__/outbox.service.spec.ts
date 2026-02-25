import { OutboxService } from '../outbox.service';
import type { IOutboxService } from '../../../../application/interfaces/outbox-service.interface';
import type { ITransactionContext } from '../../../../application/interfaces/transaction-context.interface';
import {
  OUTBOX_STATUS,
  BULL_JOB,
  OUTBOX_CONFIG,
  SERVICE_NAME,
  SERVICE_VERSION,
} from '../../../constants';

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('OutboxService', () => {
  let service: OutboxService;

  const mockOutboxRepository = {
    create: jest.fn().mockImplementation((data) => ({ ...data })),
    save: jest.fn().mockResolvedValue(undefined),
  };

  const mockOutboxQueue = {
    add: jest.fn().mockResolvedValue(undefined),
    addBulk: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OutboxService(
      mockOutboxRepository as any,
      mockOutboxQueue as any,
    );
  });

  describe('saveEvent', () => {
    const eventType = 'user.created';
    const payload = { userId: 'user-1', email: 'test@example.com' };
    const aggregateId = 'user-1';

    describe('without transaction context (backward compatible)', () => {
      it('should create outbox entity with correct eventType, aggregateId, and status pending', async () => {
        await service.saveEvent(eventType, payload, aggregateId);

        expect(mockOutboxRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            eventId: 'mock-uuid',
            aggregateId,
            eventType,
            status: OUTBOX_STATUS.PENDING,
            retryCount: 0,
          }),
        );
      });

      it('should build Kafka envelope with eventId, eventType, timestamp, version, source, and payload', async () => {
        const beforeTimestamp = Date.now();
        await service.saveEvent(eventType, payload, aggregateId);
        const afterTimestamp = Date.now();

        const createdEntity = mockOutboxRepository.create.mock.calls[0][0];
        const envelope = createdEntity.payload;

        expect(envelope.eventId).toBe('mock-uuid');
        expect(envelope.eventType).toBe(eventType);
        expect(envelope.version).toBe(SERVICE_VERSION);
        expect(envelope.source).toBe(SERVICE_NAME);
        expect(envelope.payload).toEqual(payload);
        expect(envelope.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
        expect(envelope.timestamp).toBeLessThanOrEqual(afterTimestamp);
      });

      it('should save entity to repository directly', async () => {
        await service.saveEvent(eventType, payload, aggregateId);

        expect(mockOutboxRepository.save).toHaveBeenCalledTimes(1);
        expect(mockOutboxRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            eventId: 'mock-uuid',
            aggregateId,
            eventType,
            status: OUTBOX_STATUS.PENDING,
          }),
        );
      });

      it('should add BullMQ job immediately', async () => {
        await service.saveEvent(eventType, payload, aggregateId);

        expect(mockOutboxQueue.add).toHaveBeenCalledTimes(1);
        expect(mockOutboxQueue.add).toHaveBeenCalledWith(
          BULL_JOB.PUBLISH_OUTBOX_EVENT,
          { eventId: 'mock-uuid' },
          {
            jobId: 'mock-uuid',
            removeOnComplete: true,
            removeOnFail: false,
            attempts: OUTBOX_CONFIG.RETRY_ATTEMPTS,
            backoff: {
              type: 'exponential',
              delay: OUTBOX_CONFIG.BACKOFF_DELAY_MS,
            },
          },
        );
      });

      it('should return the generated eventId', async () => {
        const result = await service.saveEvent(eventType, payload, aggregateId);

        expect(result).toBe('mock-uuid');
      });
    });

    describe('with transaction context', () => {
      const mockEntityManager = {
        save: jest.fn().mockResolvedValue(undefined),
      };
      const tx = mockEntityManager as unknown as ITransactionContext;

      it('should save via EntityManager within the transaction', async () => {
        await service.saveEvent(eventType, payload, aggregateId, tx);

        expect(mockEntityManager.save).toHaveBeenCalledTimes(1);
        expect(mockEntityManager.save).toHaveBeenCalledWith(
          expect.any(Function), // OutboxEntity class reference
          expect.objectContaining({
            eventId: 'mock-uuid',
            aggregateId,
            eventType,
            status: OUTBOX_STATUS.PENDING,
            retryCount: 0,
          }),
        );
      });

      it('should NOT save via repository when tx is provided', async () => {
        await service.saveEvent(eventType, payload, aggregateId, tx);

        expect(mockOutboxRepository.save).not.toHaveBeenCalled();
      });

      it('should NOT create BullMQ job when tx is provided', async () => {
        await service.saveEvent(eventType, payload, aggregateId, tx);

        expect(mockOutboxQueue.add).not.toHaveBeenCalled();
      });

      it('should return the generated eventId', async () => {
        const result = await service.saveEvent(
          eventType,
          payload,
          aggregateId,
          tx,
        );

        expect(result).toBe('mock-uuid');
      });

      it('should build Kafka envelope correctly when tx is provided', async () => {
        await service.saveEvent(eventType, payload, aggregateId, tx);

        const savedEntity = mockEntityManager.save.mock.calls[0][1];
        const envelope = savedEntity.payload;

        expect(envelope.eventId).toBe('mock-uuid');
        expect(envelope.eventType).toBe(eventType);
        expect(envelope.version).toBe(SERVICE_VERSION);
        expect(envelope.source).toBe(SERVICE_NAME);
        expect(envelope.payload).toEqual(payload);
      });
    });
  });

  describe('saveEvents', () => {
    const events = [
      {
        eventType: 'user.created',
        payload: { userId: '1' },
        aggregateId: 'user-1',
      },
      {
        eventType: 'user.updated',
        payload: { userId: '2' },
        aggregateId: 'user-2',
      },
    ];

    describe('without transaction context (backward compatible)', () => {
      it('should save multiple entries via repository and add bulk BullMQ jobs', async () => {
        await service.saveEvents(events);

        expect(mockOutboxRepository.create).toHaveBeenCalledTimes(2);
        expect(mockOutboxRepository.save).toHaveBeenCalledTimes(1);

        const savedEntries = mockOutboxRepository.save.mock.calls[0][0];
        expect(savedEntries).toHaveLength(2);
        expect(savedEntries[0].eventType).toBe('user.created');
        expect(savedEntries[0].status).toBe(OUTBOX_STATUS.PENDING);
        expect(savedEntries[0].retryCount).toBe(0);
        expect(savedEntries[1].eventType).toBe('user.updated');

        expect(mockOutboxQueue.addBulk).toHaveBeenCalledTimes(1);
        const jobs = mockOutboxQueue.addBulk.mock.calls[0][0];
        expect(jobs).toHaveLength(2);
        expect(jobs[0]).toEqual({
          name: BULL_JOB.PUBLISH_OUTBOX_EVENT,
          data: { eventId: 'mock-uuid' },
          opts: {
            jobId: 'mock-uuid',
            removeOnComplete: true,
            removeOnFail: false,
            attempts: OUTBOX_CONFIG.RETRY_ATTEMPTS,
            backoff: {
              type: 'exponential',
              delay: OUTBOX_CONFIG.BACKOFF_DELAY_MS,
            },
          },
        });
      });

      it('should return array of eventIds', async () => {
        const result = await service.saveEvents(events);

        expect(result).toEqual(['mock-uuid', 'mock-uuid']);
      });

      it('should do nothing for empty array and return empty array', async () => {
        const result = await service.saveEvents([]);

        expect(result).toEqual([]);
        expect(mockOutboxRepository.create).not.toHaveBeenCalled();
        expect(mockOutboxRepository.save).not.toHaveBeenCalled();
        expect(mockOutboxQueue.addBulk).not.toHaveBeenCalled();
      });

      it('should build Kafka envelope for each event with correct source and version', async () => {
        const singleEvent = [
          {
            eventType: 'user.suspended',
            payload: { userId: '1', reason: 'test' },
            aggregateId: 'user-1',
          },
        ];

        await service.saveEvents(singleEvent);

        const createdEntity = mockOutboxRepository.create.mock.calls[0][0];
        const envelope = createdEntity.payload;

        expect(envelope.eventId).toBe('mock-uuid');
        expect(envelope.eventType).toBe('user.suspended');
        expect(envelope.version).toBe(SERVICE_VERSION);
        expect(envelope.source).toBe(SERVICE_NAME);
        expect(envelope.payload).toEqual({ userId: '1', reason: 'test' });
        expect(typeof envelope.timestamp).toBe('number');
      });
    });

    describe('with transaction context', () => {
      const mockEntityManager = {
        save: jest.fn().mockResolvedValue(undefined),
      };
      const tx = mockEntityManager as unknown as ITransactionContext;

      it('should save via EntityManager within the transaction', async () => {
        await service.saveEvents(events, tx);

        expect(mockEntityManager.save).toHaveBeenCalledTimes(1);
        const savedEntries = mockEntityManager.save.mock.calls[0][1];
        expect(savedEntries).toHaveLength(2);
        expect(savedEntries[0].eventType).toBe('user.created');
        expect(savedEntries[1].eventType).toBe('user.updated');
      });

      it('should NOT save via repository when tx is provided', async () => {
        await service.saveEvents(events, tx);

        expect(mockOutboxRepository.save).not.toHaveBeenCalled();
      });

      it('should NOT create BullMQ jobs when tx is provided', async () => {
        await service.saveEvents(events, tx);

        expect(mockOutboxQueue.addBulk).not.toHaveBeenCalled();
        expect(mockOutboxQueue.add).not.toHaveBeenCalled();
      });

      it('should return array of eventIds', async () => {
        const result = await service.saveEvents(events, tx);

        expect(result).toEqual(['mock-uuid', 'mock-uuid']);
      });

      it('should return empty array for empty events with tx', async () => {
        const result = await service.saveEvents([], tx);

        expect(result).toEqual([]);
        expect(mockEntityManager.save).not.toHaveBeenCalled();
      });
    });
  });

  describe('schedulePublishing', () => {
    it('should create a single BullMQ job for one eventId', async () => {
      await service.schedulePublishing(['event-1']);

      expect(mockOutboxQueue.add).toHaveBeenCalledTimes(1);
      expect(mockOutboxQueue.add).toHaveBeenCalledWith(
        BULL_JOB.PUBLISH_OUTBOX_EVENT,
        { eventId: 'event-1' },
        {
          jobId: 'event-1',
          removeOnComplete: true,
          removeOnFail: false,
          attempts: OUTBOX_CONFIG.RETRY_ATTEMPTS,
          backoff: {
            type: 'exponential',
            delay: OUTBOX_CONFIG.BACKOFF_DELAY_MS,
          },
        },
      );
      expect(mockOutboxQueue.addBulk).not.toHaveBeenCalled();
    });

    it('should create bulk BullMQ jobs for multiple eventIds', async () => {
      await service.schedulePublishing(['event-1', 'event-2', 'event-3']);

      expect(mockOutboxQueue.addBulk).toHaveBeenCalledTimes(1);
      const jobs = mockOutboxQueue.addBulk.mock.calls[0][0];
      expect(jobs).toHaveLength(3);

      expect(jobs[0]).toEqual({
        name: BULL_JOB.PUBLISH_OUTBOX_EVENT,
        data: { eventId: 'event-1' },
        opts: expect.objectContaining({
          jobId: 'event-1',
          attempts: OUTBOX_CONFIG.RETRY_ATTEMPTS,
        }),
      });
      expect(jobs[1]).toEqual({
        name: BULL_JOB.PUBLISH_OUTBOX_EVENT,
        data: { eventId: 'event-2' },
        opts: expect.objectContaining({
          jobId: 'event-2',
          attempts: OUTBOX_CONFIG.RETRY_ATTEMPTS,
        }),
      });
      expect(jobs[2]).toEqual({
        name: BULL_JOB.PUBLISH_OUTBOX_EVENT,
        data: { eventId: 'event-3' },
        opts: expect.objectContaining({
          jobId: 'event-3',
          attempts: OUTBOX_CONFIG.RETRY_ATTEMPTS,
        }),
      });

      expect(mockOutboxQueue.add).not.toHaveBeenCalled();
    });

    it('should do nothing for empty eventIds array', async () => {
      await service.schedulePublishing([]);

      expect(mockOutboxQueue.add).not.toHaveBeenCalled();
      expect(mockOutboxQueue.addBulk).not.toHaveBeenCalled();
    });
  });
});
