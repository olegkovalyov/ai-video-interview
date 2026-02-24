/**
 * Domain Event Interface
 * All domain events must implement this interface.
 * Framework-agnostic — no NestJS dependencies.
 */
export interface IDomainEvent {
  readonly occurredAt: Date;
}
