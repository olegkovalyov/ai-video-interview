import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { correlationStore, CORRELATION_ID_HEADER } from './correlation-id.store';

/**
 * Interceptor that extracts x-correlation-id from incoming HTTP requests
 * and stores it in AsyncLocalStorage for automatic inclusion in log entries.
 *
 * For Kafka consumers, correlationId is extracted from message headers
 * directly in the consumer code.
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId =
      request?.headers?.[CORRELATION_ID_HEADER] || 'unknown';

    if (request) {
      (request as any).correlationId = correlationId;
    }

    return new Observable((subscriber) => {
      correlationStore.run({ correlationId }, () => {
        next.handle().subscribe({
          next: (val) => subscriber.next(val),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
