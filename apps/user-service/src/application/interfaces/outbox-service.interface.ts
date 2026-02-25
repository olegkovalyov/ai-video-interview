import type { ITransactionContext } from './transaction-context.interface';

/**
 * IOutboxService — Application-layer interface for outbox event publishing.
 * Infrastructure provides the implementation (BullMQ + TypeORM).
 *
 * Transaction-aware: when `tx` is provided, the outbox entry is saved
 * within the same database transaction as the aggregate.
 * BullMQ jobs are NOT created inside the transaction — use `schedulePublishing()`
 * after the UnitOfWork commit.
 *
 * Inject via token: @Inject('IOutboxService')
 */
export interface IOutboxService {
  /**
   * Save a single outbox event. Returns the event ID.
   * When tx is provided, saves within the same transaction (no BullMQ job created).
   * When tx is not provided, saves directly and creates BullMQ job immediately.
   */
  saveEvent(
    eventType: string,
    payload: Record<string, unknown>,
    aggregateId: string,
    tx?: ITransactionContext,
  ): Promise<string>;

  /**
   * Save multiple outbox events in batch. Returns event IDs.
   * When tx is provided, saves within the same transaction (no BullMQ jobs created).
   * When tx is not provided, saves directly and creates BullMQ jobs immediately.
   */
  saveEvents(
    events: Array<{ eventType: string; payload: Record<string, unknown>; aggregateId: string }>,
    tx?: ITransactionContext,
  ): Promise<string[]>;

  /**
   * Schedule BullMQ jobs for outbox events that were saved within a transaction.
   * Call this AFTER UnitOfWork.execute() commits successfully.
   */
  schedulePublishing(eventIds: string[]): Promise<void>;
}
