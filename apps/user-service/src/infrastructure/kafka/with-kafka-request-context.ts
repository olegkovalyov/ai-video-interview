import { v4 as uuid } from 'uuid';
import type { KafkaMessage } from 'kafkajs';
import { withKafkaTracing } from '@repo/shared';
import {
  requestContextStore,
  CORRELATION_ID_HEADER,
  type RequestContext,
} from '../http/interceptors/request-context.store';

const TRACER_NAME = 'user-service.kafka';

/**
 * Composes the two cross-cutting concerns every Kafka consumer needs:
 *
 * 1. OTel: open a child span linked to the producer's `traceparent`
 *    header (via {@link withKafkaTracing}) so Jaeger renders the full
 *    cross-service flow as one trace.
 * 2. AsyncLocalStorage: open a {@link RequestContext} so log entries
 *    written inside `handler` automatically carry `correlationId`,
 *    `userId`, etc. — same way HTTP requests do via the global
 *    interceptor.
 *
 * If the upstream message lacks a `x-correlation-id` header we generate
 * a UUID server-side rather than letting the field be absent. This keeps
 * Loki dashboards consistent: every log line ever has a correlationId.
 *
 * Use it in any `@MessagePattern` handler / `KafkaService.subscribe`
 * callback to replace the hand-rolled try/catch + `correlationStore.run`
 * boilerplate.
 */
export async function withKafkaRequestContext<T>(
  options: {
    topic: string;
    operationName: string;
    message: KafkaMessage;
    extra?: Pick<RequestContext, 'userId' | 'userEmail'>;
  },
  handler: () => Promise<T>,
): Promise<T> {
  const headers = options.message.headers ?? {};
  const correlationId = readCorrelationId(headers);
  const ctx: RequestContext = {
    correlationId,
    source: 'kafka',
    userId: options.extra?.userId,
    userEmail: options.extra?.userEmail,
  };

  return withKafkaTracing(
    TRACER_NAME,
    options.operationName,
    headers,
    {
      'messaging.destination': options.topic,
      'messaging.operation': 'process',
      'messaging.kafka.correlation_id': correlationId,
    },
    () => requestContextStore.run(ctx, handler),
  );
}

function readCorrelationId(headers: Record<string, unknown>): string {
  const raw = headers[CORRELATION_ID_HEADER];
  if (typeof raw === 'string' && raw.length > 0) return raw;
  if (Buffer.isBuffer(raw)) {
    const value = raw.toString();
    return value.length > 0 ? value : uuid();
  }
  return uuid();
}
