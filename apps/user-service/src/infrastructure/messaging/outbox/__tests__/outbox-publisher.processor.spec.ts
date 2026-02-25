import { OutboxPublisherProcessor } from '../outbox-publisher.processor';
import { OUTBOX_STATUS, OUTBOX_CONFIG } from '../../../constants';

jest.mock('@repo/shared', () => ({
  KafkaService: jest.fn(),
  KAFKA_TOPICS: { USER_EVENTS: 'user-events' },
  injectTraceContext: jest.fn().mockReturnValue({}),
}));

describe('OutboxPublisherProcessor', () => {
  let processor: OutboxPublisherProcessor;

  let savedStatusSnapshots: string[];

  const mockOutboxRepository = {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((entity) => {
      savedStatusSnapshots.push(entity.status);
      return Promise.resolve(undefined);
    }),
  };

  const mockKafkaService = {
    publishEvent: jest.fn().mockResolvedValue(undefined),
  };

  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockJob = { data: { eventId: 'test-event-id' } } as any;

  const createMockOutbox = (overrides: Record<string, unknown> = {}) => ({
    eventId: 'test-event-id',
    eventType: 'user.created',
    payload: {
      eventId: 'test-event-id',
      eventType: 'user.created',
      timestamp: Date.now(),
      version: '1.0',
      source: 'user-service',
      payload: { userId: 'user-1' },
    },
    status: OUTBOX_STATUS.PENDING,
    retryCount: 0,
    publishedAt: null,
    errorMessage: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    savedStatusSnapshots = [];
    processor = new OutboxPublisherProcessor(
      mockOutboxRepository as any,
      mockKafkaService as any,
      mockLogger as any,
    );
  });

  describe('publishOutboxEvent', () => {
    it('should skip if outbox event not found (already published)', async () => {
      mockOutboxRepository.findOne.mockResolvedValue(null);

      await processor.publishOutboxEvent(mockJob);

      expect(mockOutboxRepository.findOne).toHaveBeenCalledWith({
        where: { eventId: 'test-event-id', status: OUTBOX_STATUS.PENDING },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('already published or not found'),
        expect.objectContaining({ action: 'skip', eventId: 'test-event-id' }),
      );
      expect(mockKafkaService.publishEvent).not.toHaveBeenCalled();
      expect(mockOutboxRepository.save).not.toHaveBeenCalled();
    });

    it('should mark as publishing, publish to Kafka, then mark as published with publishedAt', async () => {
      const mockOutbox = createMockOutbox();
      mockOutboxRepository.findOne.mockResolvedValue(mockOutbox);

      await processor.publishOutboxEvent(mockJob);

      // Verify save was called twice: publishing, then published
      expect(mockOutboxRepository.save).toHaveBeenCalledTimes(2);

      // First save: mark as publishing (captured via snapshot)
      expect(savedStatusSnapshots[0]).toBe(OUTBOX_STATUS.PUBLISHING);

      // Kafka publish
      expect(mockKafkaService.publishEvent).toHaveBeenCalledTimes(1);
      expect(mockKafkaService.publishEvent).toHaveBeenCalledWith(
        'user-events',
        mockOutbox.payload,
        expect.any(Object),
      );

      // Second save: mark as published with publishedAt (captured via snapshot)
      expect(savedStatusSnapshots[1]).toBe(OUTBOX_STATUS.PUBLISHED);
      expect(mockOutbox.publishedAt).toBeInstanceOf(Date);
    });

    it('should log success after publishing', async () => {
      const mockOutbox = createMockOutbox();
      mockOutboxRepository.findOne.mockResolvedValue(mockOutbox);

      await processor.publishOutboxEvent(mockJob);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Outbox event published: test-event-id'),
        expect.objectContaining({
          action: 'published',
          eventId: 'test-event-id',
          eventType: 'user.created',
        }),
      );
    });

    it('should mark as failed on Kafka error and increment retryCount', async () => {
      const mockOutbox = createMockOutbox({ retryCount: 0 });
      mockOutboxRepository.findOne.mockResolvedValue(mockOutbox);

      const kafkaError = new Error('Kafka broker unavailable');
      mockKafkaService.publishEvent.mockRejectedValue(kafkaError);

      await expect(processor.publishOutboxEvent(mockJob)).rejects.toThrow(
        'Kafka broker unavailable',
      );

      // First save: mark as publishing (captured via snapshot)
      expect(savedStatusSnapshots[0]).toBe(OUTBOX_STATUS.PUBLISHING);

      // Second save: mark as failed (captured via snapshot)
      expect(savedStatusSnapshots[1]).toBe(OUTBOX_STATUS.FAILED);
      expect(mockOutbox.errorMessage).toBe('Kafka broker unavailable');
      expect(mockOutbox.retryCount).toBe(1);
    });

    it('should re-throw error if retryCount < RETRY_ATTEMPTS (for BullMQ retry)', async () => {
      const mockOutbox = createMockOutbox({ retryCount: 1 });
      mockOutboxRepository.findOne.mockResolvedValue(mockOutbox);

      const kafkaError = new Error('Connection timeout');
      mockKafkaService.publishEvent.mockRejectedValue(kafkaError);

      // retryCount after increment = 2, which is < RETRY_ATTEMPTS (3)
      await expect(processor.publishOutboxEvent(mockJob)).rejects.toThrow(
        'Connection timeout',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish outbox event'),
        expect.objectContaining({ retryCount: 2 }),
      );
    });

    it('should NOT re-throw if retryCount >= RETRY_ATTEMPTS (max retries reached)', async () => {
      const mockOutbox = createMockOutbox({
        retryCount: OUTBOX_CONFIG.RETRY_ATTEMPTS - 1,
      });
      mockOutboxRepository.findOne.mockResolvedValue(mockOutbox);

      const kafkaError = new Error('Permanent failure');
      mockKafkaService.publishEvent.mockRejectedValue(kafkaError);

      // retryCount after increment = RETRY_ATTEMPTS, so error should NOT be re-thrown
      await expect(
        processor.publishOutboxEvent(mockJob),
      ).resolves.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Max retries reached'),
        expect.objectContaining({
          action: 'max_retries',
          eventId: 'test-event-id',
        }),
      );
    });

    it('should log error details on Kafka failure', async () => {
      const mockOutbox = createMockOutbox({ retryCount: 0 });
      mockOutboxRepository.findOne.mockResolvedValue(mockOutbox);

      const kafkaError = new Error('Network error');
      mockKafkaService.publishEvent.mockRejectedValue(kafkaError);

      await expect(processor.publishOutboxEvent(mockJob)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish outbox event test-event-id: Network error'),
        expect.objectContaining({
          category: 'outbox',
          action: 'publish_failed',
          eventId: 'test-event-id',
          retryCount: 1,
          error: 'Network error',
        }),
      );
    });
  });
});
