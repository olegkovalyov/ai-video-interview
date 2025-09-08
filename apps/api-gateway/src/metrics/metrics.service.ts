import { Injectable, OnModuleInit } from '@nestjs/common';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  // HTTP Metrics
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    registers: [register],
  });

  // Auth Metrics
  private readonly authRequestsTotal = new Counter({
    name: 'auth_requests_total',
    help: 'Total number of authentication requests',
    labelNames: ['type', 'status'], // type: login, logout, refresh, callback
    registers: [register],
  });

  private readonly activeSessionsGauge = new Gauge({
    name: 'auth_active_sessions',
    help: 'Number of active user sessions',
    registers: [register],
  });

  // Kafka Metrics
  private readonly kafkaMessagesProduced = new Counter({
    name: 'kafka_messages_produced_total',
    help: 'Total number of messages produced to Kafka',
    labelNames: ['topic', 'status'],
    registers: [register],
  });

  private readonly kafkaMessageProcessingDuration = new Histogram({
    name: 'kafka_message_processing_duration_seconds',
    help: 'Time spent processing Kafka messages',
    labelNames: ['topic'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register],
  });

  // Business Metrics
  private readonly userOperationsTotal = new Counter({
    name: 'user_operations_total',
    help: 'Total number of user operations',
    labelNames: ['operation'], // operation: create, update, delete, authenticate
    registers: [register],
  });

  onModuleInit() {
    // Collect default Node.js metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register });
  }

  // HTTP Metrics Methods
  incrementHttpRequests(method: string, route: string, statusCode: number) {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }

  observeHttpDuration(method: string, route: string, durationInSeconds: number) {
    this.httpRequestDuration.observe({ method, route }, durationInSeconds);
  }

  // Auth Metrics Methods
  incrementAuthRequests(type: 'login' | 'logout' | 'refresh' | 'callback', status: 'success' | 'failure') {
    this.authRequestsTotal.inc({ type, status });
  }

  setActiveSessions(count: number) {
    this.activeSessionsGauge.set(count);
  }

  // Kafka Metrics Methods
  incrementKafkaProduced(topic: string, status: 'success' | 'failure') {
    this.kafkaMessagesProduced.inc({ topic, status });
  }

  observeKafkaProcessing(topic: string, durationInSeconds: number) {
    this.kafkaMessageProcessingDuration.observe({ topic }, durationInSeconds);
  }

  // Business Metrics Methods
  incrementUserOperations(operation: 'create' | 'update' | 'delete' | 'authenticate') {
    this.userOperationsTotal.inc({ operation });
  }

  // Utility Methods
  getMetrics(): Promise<string> {
    return register.metrics();
  }

  clearMetrics(): void {
    register.clear();
  }

  // Helper method for timing operations
  startTimer(histogram: Histogram<string>) {
    return histogram.startTimer();
  }
}
