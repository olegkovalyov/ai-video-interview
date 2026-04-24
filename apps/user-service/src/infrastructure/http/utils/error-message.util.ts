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

/** Safe `.stack` accessor — returns undefined for non-Error throws. */
export function errorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

/**
 * Safe `.code` accessor for errno-style errors (e.g., fs/minio client errors
 * carrying `code: 'NotFound'`). Returns undefined when absent or when the
 * thrown value is not an object.
 */
export function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}
