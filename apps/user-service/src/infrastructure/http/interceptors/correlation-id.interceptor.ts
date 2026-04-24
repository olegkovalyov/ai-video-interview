import { Injectable } from '@nestjs/common';
import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import {
  correlationStore,
  CORRELATION_ID_HEADER,
} from './correlation-id.store';

/** Request extended with the correlation ID we stamp on it for downstream use. */
type CorrelatedRequest = Request & { correlationId?: string };

/**
 * Interceptor that extracts x-correlation-id from incoming HTTP requests
 * and stores it in AsyncLocalStorage for automatic inclusion in log entries.
 *
 * For Kafka consumers, correlationId is extracted from message headers
 * directly in the consumer code.
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();
    const rawHeader = request.headers[CORRELATION_ID_HEADER];
    const correlationId =
      (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader) ?? 'unknown';

    request.correlationId = correlationId;

    return new Observable((subscriber) => {
      correlationStore.run({ correlationId }, () => {
        next.handle().subscribe({
          next: (val) => subscriber.next(val),
          error: (err: unknown) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
