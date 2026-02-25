import type { ITransactionContext } from './transaction-context.interface';

/**
 * IUnitOfWork — ensures atomicity of aggregate persistence + outbox event save.
 *
 * All operations inside the `execute()` callback share a single database transaction.
 * If any operation throws, the entire transaction is rolled back.
 *
 * Usage in command handlers:
 * ```typescript
 * const eventId = await this.unitOfWork.execute(async (tx) => {
 *   await this.userRepository.save(user, tx);
 *   return this.outboxService.saveEvent('user.created', payload, user.id, tx);
 * });
 * // After commit: schedule BullMQ job
 * await this.outboxService.schedulePublishing([eventId]);
 * ```
 *
 * Inject via token: @Inject('IUnitOfWork')
 */
export interface IUnitOfWork {
  execute<T>(work: (tx: ITransactionContext) => Promise<T>): Promise<T>;
}
