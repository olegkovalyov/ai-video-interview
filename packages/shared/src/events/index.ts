// Shared event types and utilities
export * from './user.events';
export * from './analysis.events';

// Common Kafka configuration
export const KAFKA_CONFIG = {
  brokers: ['localhost:9092'],
  clientId: 'ai-interview-platform',
  groupId: 'ai-interview-group',
};

export const KAFKA_TOPICS = {
  // ============ COMMANDS (imperative - do this) ============
  // Commands TO specific services from API Gateway/other services
  
  // User Service Commands
  USER_COMMANDS: 'user-commands',
  USER_COMMANDS_DLQ: 'user-commands-dlq',
  
  // Interview Service Commands (future)
  INTERVIEW_COMMANDS: 'interview-commands',
  INTERVIEW_COMMANDS_DLQ: 'interview-commands-dlq',
  
  // ============ EVENTS (past tense - this happened) ============
  // Integration events FROM services TO other services
  
  // Auth events from API Gateway (login, logout)
  AUTH_EVENTS: 'auth-events',
  AUTH_EVENTS_DLQ: 'auth-events-dlq',
  
  // User domain events from User Service (user.created, user.updated, etc.)
  USER_EVENTS: 'user-events',
  USER_EVENTS_DLQ: 'user-events-dlq',
  
  // Interview domain events from Interview Service
  INTERVIEW_EVENTS: 'interview-events',
  INTERVIEW_EVENTS_DLQ: 'interview-events-dlq',
  
  // Analysis domain events from AI Analysis Service
  ANALYSIS_EVENTS: 'analysis-events',
  ANALYSIS_EVENTS_DLQ: 'analysis-events-dlq',
  
  // Analytics events
  USER_ANALYTICS: 'user-analytics',
  USER_ANALYTICS_DLQ: 'user-analytics-dlq',
} as const;
