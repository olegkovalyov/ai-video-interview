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

  // Service Proxy Metrics
  private readonly serviceCallsTotal = new Counter({
    name: 'service_calls_total',
    help: 'Total number of inter-service HTTP calls',
    labelNames: ['service', 'method', 'status'], // service: user-service, interview-service
    registers: [register],
  });

  private readonly serviceCallDuration = new Histogram({
    name: 'service_call_duration_milliseconds',
    help: 'Duration of inter-service HTTP calls in milliseconds',
    labelNames: ['service', 'method'],
    buckets: [10, 50, 100, 300, 500, 1000, 3000, 5000],
    registers: [register],
  });

  // Circuit Breaker Metrics
  private readonly circuitBreakerState = new Gauge({
    name: 'circuit_breaker_state',
    help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
    labelNames: ['circuit'],
    registers: [register],
  });

  private readonly circuitBreakerFailures = new Gauge({
    name: 'circuit_breaker_recent_failures',
    help: 'Number of recent failures in rolling window',
    labelNames: ['circuit'],
    registers: [register],
  });

  private readonly circuitBreakerTransitions = new Counter({
    name: 'circuit_breaker_state_transitions_total',
    help: 'Total number of circuit breaker state transitions',
    labelNames: ['circuit', 'from_state', 'to_state'],
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
  incrementAuthRequests(type: 'login' | 'logout' | 'refresh' | 'callback' | 'register', status: 'success' | 'failure') {
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

  // Service Proxy Metrics Methods
  recordServiceCall(
    service: string,
    method: string,
    status: 'success' | 'error',
    durationMs: number
  ) {
    this.serviceCallsTotal.inc({ service, method, status });
    this.serviceCallDuration.observe({ service, method }, durationMs);
  }

  // Circuit Breaker Metrics Methods
  setCircuitBreakerState(circuit: string, state: string) {
    // Map state to numeric value: CLOSED=0, OPEN=1, HALF_OPEN=2
    const stateValue = state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 2;
    this.circuitBreakerState.set({ circuit }, stateValue);
  }

  setCircuitBreakerFailures(circuit: string, failures: number) {
    this.circuitBreakerFailures.set({ circuit }, failures);
  }

  recordCircuitBreakerTransition(circuit: string, fromState: string, toState: string) {
    this.circuitBreakerTransitions.inc({ circuit, from_state: fromState, to_state: toState });
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
