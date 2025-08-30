// Shared event types and utilities
export * from './user.events';

// Common Kafka configuration
export const KAFKA_CONFIG = {
  brokers: ['localhost:9092'],
  clientId: 'ai-interview-platform',
  groupId: 'ai-interview-group',
};

export const KAFKA_TOPICS = {
  USER_EVENTS: 'user-events',
  INTERVIEW_EVENTS: 'interview-events', 
  SYSTEM_EVENTS: 'system-events',
  USER_ANALYTICS: 'user-analytics',
} as const;
