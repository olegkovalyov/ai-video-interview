import { AggregateRoot as NestAggregateRoot } from '@nestjs/cqrs';

/**
 * Base class for Aggregate Roots
 * Aggregate Roots are Entities that act as entry points to aggregates
 * They manage domain events and ensure consistency within the aggregate boundary
 */
export abstract class AggregateRoot extends NestAggregateRoot {
  private _domainEvents: any[] = [];

  /**
   * Apply a domain event (overriding parent)
   */
  public apply(event: any): void {
    this._domainEvents.push(event);
    super.apply(event);
  }

  /**
   * Get uncommitted domain events
   */
  public getUncommittedEvents(): any[] {
    return this._domainEvents;
  }

  /**
   * Clear uncommitted domain events (after publishing)
   */
  public clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Mark events as committed
   */
  public commit(): void {
    this._domainEvents = [];
  }
}
