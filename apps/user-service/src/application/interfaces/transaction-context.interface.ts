/**
 * ITransactionContext — opaque marker interface for transactional operations.
 * Application and domain layers use this as an abstract handle.
 * Infrastructure layer casts it to the concrete implementation (e.g., TypeORM EntityManager).
 *
 * Usage:
 *   repository.save(aggregate, tx)   // pass tx from UnitOfWork callback
 *   outboxService.saveEvent(..., tx)  // same transaction context
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ITransactionContext {}
