// Shared event types and utilities
export * from './user.events';

// Common Kafka configuration
export const KAFKA_CONFIG = {
  brokers: ['localhost:9092'],
  clientId: 'ai-interview-platform',
  groupId: 'ai-interview-group',
};

export const KAFKA_TOPICS = {
  AUTH_EVENTS: 'auth_events',
  AUTH_EVENTS_DLQ: 'auth_events_dlq',
  // Legacy topics (will be added as needed)
  USER_EVENTS: 'user-events',
  INTERVIEW_EVENTS: 'interview-events',
  USER_ANALYTICS: 'user-analytics',
  // Dead Letter Queue topics
  USER_EVENTS_DLQ: 'user-events-dlq',
  INTERVIEW_EVENTS_DLQ: 'interview-events-dlq',
  USER_ANALYTICS_DLQ: 'user-analytics-dlq',
} as const;
