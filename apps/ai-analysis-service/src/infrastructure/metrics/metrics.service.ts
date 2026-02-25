import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  public readonly httpRequestsTotal: Counter<string>;
  public readonly httpRequestDuration: Histogram<string>;
  public readonly analysisTotal: Counter<string>;
  public readonly analysisDuration: Histogram<string>;
  public readonly llmRequestsTotal: Counter<string>;
  public readonly llmTokensUsed: Histogram<string>;

  constructor() {
    collectDefaultMetrics({
      prefix: 'analysis_service_',
      register,
    });

    this.httpRequestsTotal = new Counter({
      name: 'analysis_service_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [register],
    });

    this.httpRequestDuration = new Histogram({
      name: 'analysis_service_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [register],
    });

    this.analysisTotal = new Counter({
      name: 'analysis_service_analysis_total',
      help: 'Total number of analyses processed',
      labelNames: ['status', 'model'],
      registers: [register],
    });

    this.analysisDuration = new Histogram({
      name: 'analysis_service_analysis_duration_seconds',
      help: 'Analysis processing duration in seconds',
      labelNames: ['status', 'model'],
      buckets: [1, 5, 10, 30, 60, 120, 300, 600],
      registers: [register],
    });

    this.llmRequestsTotal = new Counter({
      name: 'analysis_service_llm_requests_total',
      help: 'Total number of LLM API requests',
      labelNames: ['status', 'type'],
      registers: [register],
    });

    this.llmTokensUsed = new Histogram({
      name: 'analysis_service_llm_tokens_used',
      help: 'LLM tokens used per request',
      labelNames: ['type'],
      buckets: [100, 250, 500, 1000, 2000, 5000, 10000],
      registers: [register],
    });
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  recordHttpRequest(method: string, route: string, status: number, duration: number): void {
    this.httpRequestsTotal.inc({ method, route, status: status.toString() });
    this.httpRequestDuration.observe({ method, route, status: status.toString() }, duration);
  }

  recordAnalysis(status: string, model: string, durationMs: number): void {
    this.analysisTotal.inc({ status, model });
    this.analysisDuration.observe({ status, model }, durationMs / 1000);
  }

  recordLlmRequest(status: string, type: string, tokensUsed?: number): void {
    this.llmRequestsTotal.inc({ status, type });
    if (tokensUsed !== undefined) {
      this.llmTokensUsed.observe({ type }, tokensUsed);
    }
  }
}
