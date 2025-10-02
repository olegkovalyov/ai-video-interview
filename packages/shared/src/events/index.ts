// Shared event types and utilities
export * from './user.events';

// Common Kafka configuration
export const KAFKA_CONFIG = {
  brokers: ['localhost:9092'],
  clientId: 'ai-interview-platform',
  groupId: 'ai-interview-group',
};

export const KAFKA_TOPICS = {
  // Auth events from API Gateway (login, register, etc.)
  AUTH_EVENTS: 'auth-events',
  AUTH_EVENTS_DLQ: 'auth-events-dlq',
  
  // User domain events from User Service (user.created, user.updated, etc.)
  USER_EVENTS: 'user-events',
  USER_EVENTS_DLQ: 'user-events-dlq',
  
  // Other domain events
  INTERVIEW_EVENTS: 'interview-events',
  INTERVIEW_EVENTS_DLQ: 'interview-events-dlq',
  
  USER_ANALYTICS: 'user-analytics',
  USER_ANALYTICS_DLQ: 'user-analytics-dlq',
} as const;
