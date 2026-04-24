/**
 * ITransactionContext — opaque marker interface for transactional operations.
 * Application and domain layers use this as an abstract handle.
 * Infrastructure layer casts it to the concrete implementation (e.g., TypeORM EntityManager).
 *
 * Usage:
 *   repository.save(aggregate, tx)   // pass tx from UnitOfWork callback
 *   outboxService.saveEvent(..., tx)  // same transaction context
 */

/**
 * Opaque brand marker — prevents arbitrary objects from being passed as a
 * transaction context. The concrete infrastructure implementation
 * (e.g., TypeORM `EntityManager`) is cast to this type at the boundary.
 */
export type ITransactionContext = {
  readonly __brand: 'TransactionContext';
};
