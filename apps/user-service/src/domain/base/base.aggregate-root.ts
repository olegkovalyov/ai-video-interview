import type { IDomainEvent } from '../events/domain-event.interface';

/**
 * Base class for Aggregate Roots
 * Pure domain — no framework dependencies.
 * Aggregate Roots are Entities that act as entry points to aggregates.
 * They collect domain events and ensure consistency within the aggregate boundary.
 */
export abstract class AggregateRoot {
  private _domainEvents: IDomainEvent[] = [];

  /**
   * Apply a domain event (collect for later publishing)
   */
  protected apply(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Get uncommitted domain events
   */
  public getUncommittedEvents(): IDomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Clear uncommitted domain events (after publishing)
   */
  public clearEvents(): void {
    this._domainEvents = [];
  }
}
