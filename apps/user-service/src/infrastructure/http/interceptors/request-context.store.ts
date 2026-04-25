import { AsyncLocalStorage } from 'node:async_hooks';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Source channel that started the current request scope. Used for log
 * faceting in Loki (filter by `source="http"` vs `source="kafka"`) and
 * for skipping HTTP-only logic in async pipelines.
 */
export type RequestSource = 'http' | 'kafka' | 'bullmq' | 'cron';

/**
 * Per-request observability context, carried through async work via
 * AsyncLocalStorage. Every log entry produced inside `requestContextStore.run`
 * gets these fields auto-attached, so debugging in Loki / Grafana boils down
 * to filtering by `correlationId` (one logical request) or `userId`
 * (everything that user did across services + topics).
 *
 * - `correlationId` — UUID, generated server-side if the upstream caller
 *   didn't supply one. Single technical handle for tying together related
 *   logs across HTTP → outbox → Kafka → consumer.
 * - `traceId` — W3C trace ID from the active OTel span, when present.
 *   Same trace shows up in Jaeger; pasting it into Loki bridges the two
 *   tools. Optional because not every entry point has tracing enabled.
 * - `userId` / `userEmail` — business identifiers. `userEmail` is PII;
 *   redaction layer will hash/strip it before it reaches Loki in prod.
 * - `source` — channel that opened the scope.
 */
export interface RequestContext {
  correlationId: string;
  traceId?: string;
  userId?: string;
  userEmail?: string;
  source: RequestSource;
}

export const requestContextStore = new AsyncLocalStorage<RequestContext>();
