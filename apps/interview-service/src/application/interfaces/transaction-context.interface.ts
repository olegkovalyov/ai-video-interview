/**
 * ITransactionContext — opaque marker for database transactions.
 * Application/domain layers see only this interface.
 * Infrastructure layer casts to EntityManager internally.
 *
 * Used by IUnitOfWork.execute() and repository/outbox methods.
 */
export interface ITransactionContext {}
