/**
 * Masks email addresses for safe logging.
 * "john.doe@example.com" → "j***@example.com"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '[no-email]';
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return '***';
  return `${email[0]}***${email.substring(atIndex)}`;
}
