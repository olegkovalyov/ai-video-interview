/**
 * Infrastructure-level constants for Notification Service
 * BullMQ queues, outbox config, service metadata
 */

export const SERVICE_NAME = "notification-service";
export const SERVICE_VERSION = "1.0";

export const OUTBOX_STATUS = {
  PENDING: "pending",
  PUBLISHING: "publishing",
  PUBLISHED: "published",
  FAILED: "failed",
} as const;
export type OutboxStatus = (typeof OUTBOX_STATUS)[keyof typeof OUTBOX_STATUS];

export const BULL_QUEUE = {
  OUTBOX_PUBLISHER: "notification-outbox-publisher",
  WEBHOOK_DELIVERY: "webhook-delivery",
} as const;

export const BULL_JOB = {
  PUBLISH_OUTBOX_EVENT: "publish-outbox-event",
  DELIVER_WEBHOOK: "deliver-webhook",
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

export const WEBHOOK_CONFIG = {
  RETRY_ATTEMPTS: 3,
  BACKOFF_DELAYS: [1000, 5000, 30000],
  CONCURRENCY: 5,
  TIMEOUT_MS: 10000,
} as const;
