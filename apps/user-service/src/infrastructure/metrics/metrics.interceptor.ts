import { Injectable } from '@nestjs/common';
import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

/**
 * Express types declare `route` as `any`, which defeats the downstream type
 * propagation. We cast it to a known-narrow shape at the usage site.
 */
interface RouteInfo {
  path?: string;
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const method = request.method;
    const routeInfo = request.route as RouteInfo | undefined;
    const route = routeInfo?.path ?? request.url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - startTime) / 1000;
        this.metricsService.recordHttpRequest(
          method,
          route,
          response.statusCode,
          duration,
        );
      }),
    );
  }
}
