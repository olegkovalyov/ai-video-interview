/**
 * Infrastructure-level constants for Interview Service
 * BullMQ queues, outbox config, service metadata
 */

export const SERVICE_NAME = 'interview-service';
export const SERVICE_VERSION = '1.0';

export const OUTBOX_STATUS = {
  PENDING: 'pending',
  PUBLISHING: 'publishing',
  PUBLISHED: 'published',
  FAILED: 'failed',
} as const;
export type OutboxStatus = (typeof OUTBOX_STATUS)[keyof typeof OUTBOX_STATUS];

export const BULL_QUEUE = {
  OUTBOX_PUBLISHER: 'outbox-publisher',
} as const;

export const BULL_JOB = {
  PUBLISH_OUTBOX_EVENT: 'publish-outbox-event',
} as const;

export const OUTBOX_CONFIG = {
  RETRY_ATTEMPTS: 3,
  BACKOFF_DELAY_MS: 2000,
  PUBLISHER_CONCURRENCY: 2,
  STUCK_THRESHOLD_MS: 5 * 60 * 1000,
  PENDING_BATCH_SIZE: 100,
  STUCK_BATCH_SIZE: 50,
  CLEANUP_RETENTION_MS: 24 * 60 * 60 * 1000,
} as const;
