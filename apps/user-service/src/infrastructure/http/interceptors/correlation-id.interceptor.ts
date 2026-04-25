import { Injectable } from '@nestjs/common';
import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { trace } from '@opentelemetry/api';
import { v4 as uuid } from 'uuid';
import {
  requestContextStore,
  CORRELATION_ID_HEADER,
  type RequestContext,
} from './request-context.store';
import type { AuthenticatedRequest } from '../types/authenticated-request';

/** Request extended with the correlation ID we stamp on it for downstream use. */
type CorrelatedRequest = AuthenticatedRequest & { correlationId?: string };

/**
 * Opens a {@link RequestContext} for the duration of every HTTP request:
 *
 * 1. correlationId — taken from `x-correlation-id` header if upstream
 *    forwarded one (gateway → service); otherwise generated server-side
 *    so we never have `correlationId="unknown"` in logs.
 * 2. traceId — read from the active OTel span. Pasting it into Loki bridges
 *    over to the same trace in Jaeger.
 * 3. userId / userEmail — read from the auth claims attached by the gateway.
 *    Optional: anonymous endpoints (health, public docs) carry no user.
 *
 * For Kafka / BullMQ entry points the equivalent setup lives in their own
 * wrappers (see `wrapKafkaHandler` / outbox publisher) — this interceptor
 * only handles HTTP.
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();
    const correlationId =
      CorrelationIdInterceptor.resolveCorrelationId(request);
    request.correlationId = correlationId;

    const ctx: RequestContext = {
      correlationId,
      traceId: trace.getActiveSpan()?.spanContext().traceId,
      userId: request.user?.userId ?? request.user?.sub,
      userEmail: request.user?.email,
      source: 'http',
    };

    return new Observable((subscriber) => {
      requestContextStore.run(ctx, () => {
        next.handle().subscribe({
          next: (val) => subscriber.next(val),
          error: (err: unknown) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }

  private static resolveCorrelationId(request: CorrelatedRequest): string {
    const rawHeader = request.headers[CORRELATION_ID_HEADER];
    const fromHeader = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    return fromHeader && fromHeader.length > 0 ? fromHeader : uuid();
  }
}
