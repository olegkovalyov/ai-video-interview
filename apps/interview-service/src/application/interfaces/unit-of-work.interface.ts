import type { ITransactionContext } from './transaction-context.interface';

/**
 * IUnitOfWork — wraps aggregate save + outbox save in a single DB transaction.
 *
 * Usage in command handlers:
 *   const eventId = await this.unitOfWork.execute(async (tx) => {
 *     await this.repo.save(aggregate, tx);
 *     return this.outboxService.saveEvent(type, payload, id, tx);
 *   });
 *   await this.outboxService.schedulePublishing([eventId]);
 *
 * Inject via token: @Inject('IUnitOfWork')
 */
export interface IUnitOfWork {
  execute<T>(work: (tx: ITransactionContext) => Promise<T>): Promise<T>;
}
