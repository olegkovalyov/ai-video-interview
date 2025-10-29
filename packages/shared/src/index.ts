/**
 * @repo/shared
 * 
 * Shared package for event-driven communication between microservices
 * Contains only Kafka-related code: events, topics, and Kafka services
 * 
 * Each service manages its own:
 * - DTOs (domain-specific)
 * - Types (domain-specific)
 * - Constants (service-specific)
 * - Utils (service-specific)
 * - RBAC/Permissions (user-service responsibility)
 */

// Export Kafka events and event types
export * from './events';
export * from './events/user.events';

// Export Kafka services
export * from './kafka/kafka.service';
export * from './kafka/kafka-health.service';
