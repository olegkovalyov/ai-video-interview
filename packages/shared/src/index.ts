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

// Export tracing utilities
export * from './tracing/kafka-propagation';

// Explicitly export factories and types for better IDE support
export { 
  UserCommandFactory,
  AuthEventFactory,
  type UserCommand,
  type UserCreateCommand,
  type UserUpdateCommand,
  type UserDeleteCommand,
  type UserSuspendCommand,
  type UserActivateCommand,
  type UserAssignRoleCommand,
  type UserRemoveRoleCommand,
  type UserIntegrationEvent,
  type UserCreatedEvent,
  type UserUpdatedEvent,
  type UserDeletedEvent,
  type UserSuspendedEvent,
  type UserActivatedEvent,
  type UserRoleAssignedEvent,
  type UserRoleRemovedEvent,
  type UserAuthEvent,
  type UserAuthenticatedEvent,
  type UserLoggedOutEvent,
} from './events/user.events';

export {
  injectTraceContext,
  extractTraceContext,
  withKafkaTracing,
  getTraceInfo,
} from './tracing/kafka-propagation';
