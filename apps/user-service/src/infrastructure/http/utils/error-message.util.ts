/**
 * Narrows an unknown caught value to a human-readable message string.
 *
 * Controllers routinely `catch` values that TypeScript types as `unknown`
 * (the correct stance since any value can be thrown). This helper keeps the
 * call sites terse without resorting to `any` or unsafe member access.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}
