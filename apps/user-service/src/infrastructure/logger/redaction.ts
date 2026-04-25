import { createHash } from 'node:crypto';
import type { LogContext } from './logger.service';

export type RedactionMode = 'off' | 'hash' | 'strip';

const HASH_ALG = 'sha256';
const HASH_PREFIX_LENGTH = 16;

/**
 * Resolve the redaction mode from `LOG_PII_REDACTION_MODE`. Production
 * defaults to `hash` (deterministic pseudonym + open domain so Loki
 * filters by company stay useful) and other environments default to
 * `off` so developers see real values when reproducing bugs.
 */
export function readRedactionMode(): RedactionMode {
  const explicit = process.env.LOG_PII_REDACTION_MODE;
  if (explicit === 'hash' || explicit === 'strip' || explicit === 'off') {
    return explicit;
  }
  return process.env.NODE_ENV === 'production' ? 'hash' : 'off';
}

/**
 * Replaces `email` with a deterministic pseudonym (`sha256:<16-hex>@domain`)
 * or strips it. Returns `undefined` for `strip` so the caller can delete
 * the key entirely; returning the original string for `off`.
 *
 * Determinism is intentional: the same email always hashes to the same
 * value, so a single user's activity remains stitchable in Loki even
 * when the literal email never appears in logs.
 */
export function redactEmail(
  email: string,
  mode: RedactionMode,
): string | undefined {
  if (mode === 'off') return email;
  if (mode === 'strip') return undefined;
  const at = email.indexOf('@');
  if (at === -1) return undefined;
  const normalized = email.toLowerCase().trim();
  const hash = createHash(HASH_ALG)
    .update(normalized)
    .digest('hex')
    .slice(0, HASH_PREFIX_LENGTH);
  const domain = email.slice(at);
  return `sha256:${hash}${domain}`;
}

/**
 * Walk the known PII keys on a log context and redact / strip in place
 * (returns a new object to keep callers pure-ish). Only fields where we
 * have a confident schema are touched — free-form `data` is not scanned
 * because false positives would be noisy. Add new keys here if a domain
 * grows new PII surfaces.
 */
export function redactPIIFields(
  ctx: LogContext,
  mode: RedactionMode,
): LogContext {
  if (mode === 'off') return ctx;
  const out: LogContext = { ...ctx };
  applyEmailRedaction(out, 'userEmail', mode);
  applyEmailRedaction(out, 'email', mode);
  return out;
}

function applyEmailRedaction(
  ctx: LogContext,
  key: 'userEmail' | 'email',
  mode: RedactionMode,
): void {
  const value = ctx[key];
  if (typeof value !== 'string') return;
  const next = redactEmail(value, mode);
  if (next === undefined) delete ctx[key];
  else ctx[key] = next;
}
