import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  // HTTP Request Counter
  public readonly httpRequestsTotal: Counter<string>;
  
  // HTTP Request Duration
  public readonly httpRequestDuration: Histogram<string>;

  constructor() {
    // Collect default metrics (CPU, Memory, Event Loop, etc.)
    collectDefaultMetrics({ 
      prefix: 'user_service_',
      register 
    });

    // HTTP Requests Total
    this.httpRequestsTotal = new Counter({
      name: 'user_service_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [register],
    });

    // HTTP Request Duration
    this.httpRequestDuration = new Histogram({
      name: 'user_service_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [register],
    });
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestsTotal.inc({ method, route, status: status.toString() });
    this.httpRequestDuration.observe({ method, route, status: status.toString() }, duration);
  }
}
