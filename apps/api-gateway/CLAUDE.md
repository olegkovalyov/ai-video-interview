# API Gateway Service

## Overview

Thin orchestration/proxy layer that sits between the frontend (Next.js) and backend microservices. This is NOT a DDD service -- it handles authentication, request routing, circuit breaking, metrics collection, and cross-cutting concerns.

- **Port**: 8001
- **Swagger**: http://localhost:8001/api/docs
- **Role**: Edge gateway -- all client traffic enters here

## Tech Stack

- NestJS 11, TypeScript 5
- jose (JWT verification via JWKS)
- http-proxy-middleware (service proxying)
- prom-client (Prometheus metrics)
- OpenTelemetry SDK + Jaeger exporter (distributed tracing)
- kafkajs (event publishing for registration saga)
- Winston + Loki transport (structured logging)
- ioredis / BullMQ (session management, job queues)
- @nestjs/swagger (OpenAPI documentation)

## Architecture

```
src/
  core/
    auth/           # Keycloak OIDC integration
      controllers/    auth.controller.ts
      services/       auth-orchestrator.service.ts, oidc.service.ts, token.service.ts,
                      cookie.service.ts, keycloak.service.ts, session-manager.service.ts
      guards/         jwt-auth.guard.ts, jwt-refresh.guard.ts, roles.guard.ts
      decorators/     @Public(), @Roles(), @CurrentUser()
      interceptors/   auth-error.interceptor.ts
      sagas/          registration.saga.ts
    metrics/        # Prometheus counters, histograms, gauges
    tracing/        # OpenTelemetry + Jaeger
    circuit-breaker/# Custom CircuitBreaker with CLOSED/OPEN/HALF_OPEN states
    health/         # Health check endpoints
    logging/        # Winston logger with Loki + console formatters
  proxies/
    base/           # BaseServiceProxy -- HTTP client with circuit breaker, retries, metrics
  modules/
    user-service/       # Proxy controllers + Keycloak admin integration
    interview-service/  # Proxy controllers for templates & invitations
    analysis-service/   # Proxy controllers for AI analysis results
  kafka/
    producers/      # auth-event.publisher.ts, user-command.publisher.ts
```

## Core Modules

### Authentication (Keycloak OIDC)

- **Flow**: Keycloak OIDC authorization code flow
- **Tokens**: JWT access + refresh tokens stored in httpOnly cookies
- **Guard ordering**: JwtAuthGuard (global via APP_GUARD) checks @Public() metadata first, then extracts token from Bearer header or `access_token` cookie
- **Registration saga**: On first login, JwtAuthGuard calls `RegistrationSaga.ensureUserExists()` which synchronously creates user in user-service if not found, with Keycloak compensation on failure
- **Role extraction**: `extractPrimaryRole()` uses priority order: admin > hr > candidate > pending

### Decorators

```typescript
@Public()                    // Skip JWT authentication
@Roles('admin', 'hr')       // Require specific Keycloak realm roles
@CurrentUser() user: CurrentUserData  // Extract user from request
```

### Circuit Breaker

Custom implementation with three states:
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Service down, requests instantly fail with CircuitBreakerError
- **HALF_OPEN**: Testing recovery, limited requests allowed

Default config: `failureThreshold=5, successThreshold=2, timeout=5000ms, resetTimeout=60000ms, rollingWindow=10000ms`

### Service Proxy Pattern

All microservice calls go through `BaseServiceProxy` which provides:
- HTTP methods (GET/POST/PUT/DELETE/PATCH) with circuit breaker wrapping
- Exponential backoff retry (max 10s delay)
- Automatic metrics recording via `MetricsService.recordServiceCall()`
- `x-internal-request: true` header for service-to-service auth
- `bypassCircuitBreaker` option for critical operations

### Metrics (Prometheus)

Exposed at `/metrics` endpoint. Key metrics:
- `http_requests_total` (method, route, status_code)
- `http_request_duration_seconds` (method, route)
- `auth_requests_total` (type, status)
- `service_calls_total` (service, method, status)
- `circuit_breaker_state` (circuit)
- `kafka_messages_produced_total` (topic, status)

### Global Interceptors

Registered via `APP_INTERCEPTOR` in AppModule:
1. `AuthErrorInterceptor` -- catches auth errors, normalizes responses
2. `MetricsInterceptor` -- records request count and duration for every HTTP request

## Key Patterns

### Registration Saga (Compensation Pattern)

```
Login via Keycloak -> JWT Guard -> RegistrationSaga.ensureUserExists()
  1. Check user-service for existing user (fast path)
  2. If user-service unavailable -> throw 503 (DO NOT delete from Keycloak)
  3. If user not found -> create in user-service
  4. If creation fails -> COMPENSATE: delete from Keycloak (orphan prevention)
  5. Assign 'pending' role in Keycloak (non-blocking failure)
  6. Return UserResult with isNew flag for onboarding
```

### Proxy Controller Pattern

Gateway controllers re-declare DTOs with Swagger decorators and delegate to service clients:
```typescript
@Post('templates')
@Roles('hr', 'admin')
async createTemplate(@CurrentUser() user, @Body() dto) {
  return this.interviewServiceClient.createTemplate(user.userId, dto);
}
```

## Commands

```bash
cd apps/api-gateway
npm run start:dev          # Development with hot reload
npm run build              # Production build
npm run test               # Unit tests
npm run test:e2e           # E2E tests
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 8001) |
| KEYCLOAK_URL | Keycloak server URL |
| KEYCLOAK_REALM | Keycloak realm name |
| KEYCLOAK_CLIENT_ID | OIDC client ID |
| KEYCLOAK_CLIENT_SECRET | OIDC client secret |
| KEYCLOAK_ADMIN_CLIENT_ID | Admin API client ID |
| KEYCLOAK_ADMIN_CLIENT_SECRET | Admin API client secret |
| USER_SERVICE_URL | User service base URL (default: http://localhost:8002) |
| INTERVIEW_SERVICE_URL | Interview service base URL (default: http://localhost:8003) |
| ANALYSIS_SERVICE_URL | Analysis service base URL (default: http://localhost:8005) |
| KAFKA_BROKERS | Kafka broker addresses |
| NEXT_PUBLIC_WEB_ORIGIN | CORS allowed origin |
| REDIS_HOST | Redis host for BullMQ |
| LOKI_URL | Grafana Loki endpoint for log shipping |

## Testing

- Unit tests: Jest 30
- Focus areas: circuit breaker state transitions, auth guard logic, registration saga compensation
- Mock HTTP services with `HttpService` from `@nestjs/axios`

---

## Skills & Best Practices

### NestJS API Gateway Patterns

- **Interceptor ordering matters**: APP_INTERCEPTOR providers execute in registration order. Place AuthErrorInterceptor before MetricsInterceptor so auth errors are normalized before metrics record the final status code.
- **Guard execution order**: Global guards run before controller-level guards. The JwtAuthGuard is global; RolesGuard is applied per-controller. Always check `@Public()` metadata first using `Reflector.getAllAndOverride()` with both handler and class contexts.
- **Middleware vs interceptors vs guards**: Use middleware for raw request transforms (logging, correlation IDs). Use guards for authentication/authorization decisions. Use interceptors for response transforms, timing, and error mapping.
- **Exception filters**: Create a global `HttpExceptionFilter` that normalizes ServiceProxyError into proper HTTP responses. Map status code 0 (network error) to 503 Service Unavailable.
- **Module organization**: Keep proxy modules (user-service, interview-service) isolated with their own clients, controllers, and DTOs. Avoid cross-module imports between proxy modules.

### Keycloak / OIDC Best Practices

- **Token rotation**: Always verify access tokens via JWKS endpoint (jose `jwtVerify`), not by decoding alone. Cache the JWKS key set with a TTL (5-15 minutes) to avoid per-request network calls.
- **Session management**: Store refresh tokens in httpOnly, Secure, SameSite=Strict cookies. Never expose tokens in response bodies or URL parameters. Set cookie `path=/auth` to limit scope.
- **Realm configuration**: Use a dedicated Keycloak realm per environment. Configure token lifespans: access_token=5min, refresh_token=30min, SSO session=8h.
- **Registration saga safety**: Never delete a Keycloak user during the "check if exists" phase. Only compensate (delete from Keycloak) when user creation in user-service explicitly fails after the user was already created in Keycloak.
- **Role sync**: After role changes in Keycloak, the user must re-authenticate (or refresh) to get updated JWT claims. Design the frontend to handle stale role claims gracefully.

### Circuit Breaker Patterns

- **Half-open state**: Allow only one test request through in HALF_OPEN state. If it succeeds, increment successCount toward the threshold. If it fails, immediately transition back to OPEN.
- **Fallback strategies**: For read operations, consider returning cached data or a degraded response when the circuit is OPEN. For write operations, queue the request for retry or return 503 immediately.
- **Monitoring**: Expose circuit breaker state as a Prometheus gauge (0=CLOSED, 1=OPEN, 2=HALF_OPEN). Alert on state transitions. Track `circuit_breaker_state_transitions_total` to detect flapping.
- **Rolling window**: Use a time-based rolling window (not a simple counter) to count failures. This prevents old failures from keeping the circuit open indefinitely.
- **Per-service circuits**: Create separate circuit breaker instances per downstream service (user-service, interview-service, analysis-service) via CircuitBreakerRegistry. One failing service should not affect others.

### HTTP Proxy Best Practices

- **Timeout configuration**: Set aggressive timeouts for proxy calls (5s default). Use shorter timeouts for health checks (2s) and longer for analysis endpoints (30s) that involve LLM processing.
- **Header forwarding**: Forward `Authorization`, `x-request-id`, `x-correlation-id`, and `accept-language` headers. Strip hop-by-hop headers (Connection, Keep-Alive, Transfer-Encoding). Always add `x-internal-request: true` for service-to-service calls.
- **Error mapping**: Map downstream 4xx errors to the same status code. Map 5xx and network errors to 502 Bad Gateway (not 500). Include the originating service name in the error response for debugging.
- **Retry policy**: Only retry on 5xx and network errors, never on 4xx (client errors). Use exponential backoff with jitter: `min(1000 * 2^attempt, 10000) + random(0, 500)`.
- **Request/response size limits**: Configure maximum request body size in NestJS (e.g., 10MB for avatar uploads). Set `maxRedirects: 5` on the HTTP client to prevent infinite redirect loops.

### Prometheus Metrics Best Practices

- **Histogram vs counter**: Use histograms for latency/duration measurements (`http_request_duration_seconds`, `service_call_duration_milliseconds`). Use counters for event counts (`http_requests_total`, `auth_requests_total`). Use gauges for current-state values (`circuit_breaker_state`, `auth_active_sessions`).
- **Label cardinality**: Keep label cardinality low. Use route patterns (`/users/:id`) not actual URLs (`/users/abc-123`). Limit status_code to actual codes observed, not all possible HTTP codes.
- **Naming conventions**: Follow Prometheus naming: `<namespace>_<name>_<unit>`. Use `_total` suffix for counters, `_seconds` or `_milliseconds` for durations. Prefix business metrics with the domain (`auth_`, `kafka_`, `circuit_breaker_`).
- **Default metrics**: Call `collectDefaultMetrics()` once in `onModuleInit` to get Node.js runtime metrics (CPU, memory, event loop lag, GC stats). These are essential for capacity planning.
- **Bucket selection**: Choose histogram buckets based on expected latency distribution. For HTTP requests: `[0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]`. For service calls: `[10, 50, 100, 300, 500, 1000, 3000, 5000]` ms.

### OpenTelemetry Tracing Best Practices

- **Initialization order**: Import tracing setup before NestJS bootstraps (`import './core/tracing/tracing'` at the top of `main.ts`). OpenTelemetry must instrument HTTP/gRPC modules before they are loaded.
- **Span naming**: Name spans as `<HTTP_METHOD> <route_pattern>` for HTTP spans (e.g., `GET /users/:id`). For service calls, use `<service>.<operation>` (e.g., `user-service.createUser`).
- **Context propagation**: Ensure W3C Trace Context headers (`traceparent`, `tracestate`) are forwarded in all inter-service HTTP calls. The `x-internal-request` header should carry these automatically.
- **Sampling**: In production, use a tail-based sampling strategy: sample 100% of error traces, 100% of slow traces (>2s), and 1-10% of normal traces. In development, sample 100%.
- **Sensitive data**: Never include request/response bodies, JWT tokens, or PII in span attributes. Log only request method, route, status code, duration, and correlation ID.

### Security Best Practices

- **CORS configuration**: Restrict `origin` to the exact frontend domain. Enable `credentials: true` only when using cookie-based auth. Never use `origin: '*'` with credentials.
- **httpOnly cookies**: Set `HttpOnly`, `Secure` (in production), `SameSite=Strict` on all auth cookies. Set `Path` to restrict cookie scope. Use short `Max-Age` for access tokens.
- **CSRF protection**: With `SameSite=Strict` cookies, CSRF attacks from cross-origin sites are mitigated. For additional safety, validate the `Origin` header on state-changing requests.
- **Rate limiting**: Apply rate limiting on auth endpoints (`/auth/login`, `/auth/register`, `/auth/refresh`). Use sliding window counters in Redis. Typical limits: 10 login attempts per minute per IP, 3 registration attempts per hour per IP.
- **Input validation**: Use class-validator on all incoming DTOs even though this is a proxy layer. Reject malformed requests at the gateway before forwarding to downstream services.
- **Dependency security**: Regularly audit dependencies (`npm audit`). Pin exact versions in production. The `jose` library is preferred over `jsonwebtoken` for better security and modern JWT handling.

### Logging Best Practices

- **Structured logs**: Use Winston with JSON format. Every log entry should include: `timestamp`, `level`, `message`, `service`, `action`, and optional `correlationId`.
- **Correlation IDs**: Generate a UUID correlation ID for each incoming request (or extract from `x-request-id` header). Propagate it in all downstream service calls and log entries. This enables end-to-end request tracing.
- **Sensitive data masking**: Never log JWT tokens, passwords, or full email addresses. Mask emails as `j***@example.com`. Log only the last 4 characters of tokens for debugging.
- **Log levels**: Use `error` for unrecoverable failures requiring attention. Use `warn` for degraded states (circuit open, retry attempts). Use `info` for business events (user created, login success). Use `debug` for request/response details (disable in production).
- **Loki integration**: Ship logs to Grafana Loki for centralized log aggregation. Use labels sparingly (service, environment, level) to avoid high cardinality. Use structured fields for filtering.
