# AI Video Interview Platform — Claude Code Orchestrator

## Project Identity

Production-grade monorepo for an asynchronous AI-powered video interview platform. Built with microservices architecture using Turborepo, NestJS 11, Next.js 15, and TypeScript 5.8.

## Monorepo Structure

```
ai-video-interview/
  apps/
    api-gateway/          Port 8001  Auth (Keycloak), proxying, circuit breaker, observability
    user-service/         Port 8002  Users, roles, companies, skills (DDD+CQRS)
    interview-service/    Port 8003  Templates, invitations, responses (DDD+CQRS)
    ai-analysis-service/  Port 8005  Groq LLM analysis, scoring (DDD+CQRS)
    web/                  Port 3000  Next.js 15 App Router frontend
    media-service/        Port 8004  (Planned) Video/audio storage, transcription
  packages/
    shared/               Kafka events, contracts, tracing utilities
    ui/                   Shared UI components
    eslint-config/        ESLint configurations
    typescript-config/    TypeScript configurations
  infra/                  Keycloak themes, observability configs (Prometheus, Grafana, Loki, Jaeger)
  scripts/                Utility and test scripts
  docs/                   Comprehensive project documentation
```

## Service Routing Guide

When a task involves:
- **Authentication, OIDC, JWT, Keycloak, proxying, circuit breaker, metrics endpoints** → work in `apps/api-gateway/`
- **Users, roles, companies, skills, avatars, MinIO uploads** → work in `apps/user-service/`
- **Interview templates, questions, invitations, candidate responses** → work in `apps/interview-service/`
- **LLM analysis, scoring, Groq integration, interview evaluation** → work in `apps/ai-analysis-service/`
- **UI, pages, components, React, Next.js, Tailwind, shadcn** → work in `apps/web/`
- **Kafka events, event contracts, tracing, shared types** → work in `packages/shared/`
- **Cross-service communication, new event types** → modify `packages/shared/` AND the relevant services
- **Docker, infrastructure, observability configs** → work in `infra/` and `docker-compose.yml`

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | >=18 |
| Language | TypeScript | 5.8.3 |
| Monorepo | Turborepo | 2.5 |
| Package Manager | npm | 10.9.2 |
| Backend Framework | NestJS | 11.x |
| Frontend Framework | Next.js (App Router) | 15.x |
| React | React | 19.x |
| ORM | TypeORM | 0.3.x |
| Database | PostgreSQL | 15 |
| Cache/Queue | Redis 7 / BullMQ | -- |
| Messaging | Kafka (KRaft, no Zookeeper) | 7.4 |
| Auth | Keycloak (OIDC) | latest |
| Object Storage | MinIO (S3-compatible) | latest |
| LLM | Groq API (Llama 3.3 / GPT-OSS) | -- |
| CSS | Tailwind CSS | 4.x |
| UI Components | shadcn/ui + Radix UI | -- |
| Testing | Jest | 30.x |
| Tracing | OpenTelemetry + Jaeger | -- |
| Metrics | Prometheus + Grafana | -- |
| Logging | Winston + Loki | -- |

## Architecture Patterns

### DDD (Domain-Driven Design)
All backend services (except API Gateway) follow strict DDD with three layers:
- **Domain Layer** (`src/domain/`) — Aggregates, entities, value objects, domain events, repository interfaces, exceptions. ZERO framework dependencies.
- **Application Layer** (`src/application/`) — Commands, queries, handlers (CQRS), DTOs, ports. Depends only on domain.
- **Infrastructure Layer** (`src/infrastructure/`) — TypeORM repositories, Kafka consumers/producers, HTTP controllers, persistence entities, mappers. Implements domain interfaces.

### CQRS via @nestjs/cqrs
- Commands: imperative names (`CreateUserCommand` + `CreateUserHandler`)
- Queries: interrogative names (`GetUserQuery` + `GetUserHandler`)
- Each command/query lives in its own directory with `.command.ts`/`.query.ts` and `.handler.ts`

### Event-Driven Architecture (Kafka)
- **Domain Events** — Internal to a service, published via NestJS EventBus
- **Integration Events** — Cross-service, published via Kafka through Outbox pattern
- **Command Events** — Instructions from API Gateway to services via Kafka
- Outbox pattern ensures at-least-once delivery using BullMQ + PostgreSQL
- Event contracts defined in `packages/shared/src/events/`

### Kafka Topics
- `user-commands` / `user-commands-dlq` — Commands TO User Service
- `user-events` — User domain integration events
- `interview-events` — Interview domain integration events
- `analysis-events` / `analysis-events-dlq` — AI analysis results
- `auth-events` — Login/logout events
- `user-analytics` — Analytics events

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `create-user.command.ts` |
| Classes | PascalCase | `CreateUserHandler` |
| Aggregates | `*.aggregate.ts` | `user.aggregate.ts` |
| Value Objects | `*.vo.ts` | `email.vo.ts` |
| Domain Events | `*-created.event.ts` | `user-created.event.ts` |
| Repository Interfaces | `I` prefix | `IUserRepository` |
| Kafka Integration Events | past-tense dotted | `user.created`, `analysis.completed` |
| Kafka Command Events | present-tense dotted | `user.create`, `user.update` |
| Kafka Topics | kebab-case | `user-events`, `interview-events` |
| TypeORM Entities | `*.entity.ts` (infrastructure) | `user.entity.ts` |
| Migrations | timestamp prefix | `1730900000000-InitialSchema.ts` |

## Databases (Separate per Service)

| Database | Service | Port |
|----------|---------|------|
| `ai_video_interview_user` | User Service | 5432 |
| `ai_video_interview_interview` | Interview Service | 5432 |
| `ai_video_interview_analysis` | AI Analysis Service | 5432 |
| `keycloak` | Keycloak (separate PostgreSQL) | 5433 |

Each service has its own TypeORM config at `src/infrastructure/persistence/typeorm.config.ts`.
Migrations stored in `src/infrastructure/persistence/migrations/`.

## Common Commands

```bash
# Development
npm run dev:all              # Start all services + web concurrently
npm run dev:services         # Start only backend services
npm run dev:web              # Start only frontend
npm run dev:api              # Start only API Gateway
npm run dev:analysis         # Start only AI Analysis service

# Testing
npm run test                 # Run all unit tests
npm run test --filter=<svc>  # Run tests for specific service

# Per-service (from service directory)
npm run test                 # Unit tests
npm run test:integration     # Integration tests
npm run test:e2e             # E2E tests
npm run test:cov             # Coverage report

# Database migrations (from service directory)
npm run migration:generate -- src/infrastructure/persistence/migrations/MigrationName
npm run migration:run
npm run migration:revert

# Infrastructure
npm run infra:up             # Start PostgreSQL, Redis, MinIO
npm run infra:down           # Stop infrastructure
npm run kafka:up             # Start Kafka + UI
npm run kafka:down           # Stop Kafka

# Code quality
npm run lint                 # ESLint all packages
npm run format               # Prettier format
npm run check-types          # TypeScript type checking

# API type generation
npm run generate:types       # Generate TS types from OpenAPI specs
```

## Critical Rules

1. **NEVER** put business logic in controllers or infrastructure layer. Domain logic belongs in aggregates and domain services only.
2. **NEVER** import from infrastructure in the domain layer. Domain has ZERO framework dependencies (no NestJS, no TypeORM imports).
3. **ALWAYS** use the Outbox pattern for cross-service events. Never publish directly to Kafka from command handlers.
4. **ALWAYS** create Value Objects for domain concepts (Email, FullName, UserStatus, etc.). Never use raw primitives for domain data.
5. **ALWAYS** use factory methods on aggregates: `create()` for new instances (emits events), `reconstitute()` for loading from persistence (no events).
6. Repository **interfaces** live in `domain/repositories/`. **Implementations** (TypeORM) live in `infrastructure/persistence/repositories/`. Inject via `@Inject('IUserRepository')` tokens.
7. TypeORM entities (infrastructure) and domain aggregates/entities are **separate classes**. Use mappers to convert between them.
8. When adding a new Kafka event, update **both** `packages/shared/src/events/` AND the consuming/producing services.
9. Frontend API calls go through the API Gateway (port 8001) only. **Never** call microservices directly from the frontend.
10. All services use Winston for logging with Loki transport. Use the service-specific `LoggerService`, **never** `console.log`.

## Cross-Cutting Concerns

- **Tracing**: OpenTelemetry spans propagated via Kafka headers (`packages/shared/src/tracing/`)
- **Metrics**: Prometheus client exposed at `/metrics` on each service
- **Health**: Health checks at `/health` on each service
- **Swagger**: API docs at `/api/docs` on each service (development mode)
- **Logging**: Structured JSON logs via Winston, shipped to Loki via Promtail

## Git Workflow

- Branch from `develop` for features
- Main branch is `master` (production)
- Commit format: `feat(service-name): description`, `fix(service-name): description`, `docs: description`
- Use conventional commits with scope matching service name

---

## Skills & Best Practices (Orchestrator-Level)

> These practices apply to ALL services in the monorepo. Service-specific CLAUDE.md files extend these with domain-specific patterns.

### NestJS 11 Best Practices

- **Module encapsulation**: Each NestJS module should export only what other modules need. Use `exports: [ServiceA]` explicitly — never export everything. Internal helpers, mappers, and guards stay private to their module.
- **Dependency injection tokens**: Use string tokens (`'IUserRepository'`) for domain interfaces and Symbol tokens (`Symbol('IAnalysisEngine')`) for application ports. String tokens are simpler but risk naming collisions in large monorepos; Symbol tokens are type-safe and collision-proof.
- **Lifecycle hooks**: Use `OnModuleInit` for initialization (DB connections, Kafka subscriptions, cache warming). Use `OnModuleDestroy` for cleanup (close connections, flush buffers, clear intervals). Always call `app.enableShutdownHooks()` in `main.ts` for graceful shutdown.
- **Global vs module-scoped providers**: Register guards, filters, and interceptors globally via `APP_GUARD`, `APP_FILTER`, `APP_INTERCEPTOR` only when they apply to ALL routes. For service-specific concerns, register at module level. Global exception filters MUST be registered to catch domain exceptions properly.
- **Custom providers**: Use factory providers (`useFactory`) when initialization requires async operations or config values. Use class providers (`useClass`) for straightforward interface implementations. Use value providers (`useValue`) for config objects and constants.
- **Circular dependency resolution**: If two modules depend on each other, use `forwardRef(() => ModuleB)` in imports. Better: refactor to extract shared logic into a third module. Circular dependencies are a design smell — they usually mean module boundaries are wrong.
- **ConfigModule**: Use `@nestjs/config` with Joi validation schemas to fail fast on missing environment variables at startup, not at runtime when the variable is first accessed. Group related config into factory functions: `databaseConfig()`, `kafkaConfig()`, `authConfig()`.
- **Exception handling hierarchy**: Domain exceptions → caught by DomainExceptionFilter → mapped to HTTP codes. NestJS HttpExceptions → caught by default filter. Unexpected errors → caught by global catch-all filter → log full stack trace, return 500.
- **Pipes and validation**: Use `ValidationPipe` globally with `whitelist: true` (strip unknown properties), `forbidNonWhitelisted: true` (reject unknown properties), and `transform: true` (auto-transform types). This prevents unexpected data from reaching handlers.
- **Testing NestJS**: Use `Test.createTestingModule()` for unit tests with mock providers. For integration tests, use a real NestJS app with `app.init()`. Mock external services (DB, Kafka, HTTP) at the provider level, not at the NestJS module level.

### Microservices Architecture Patterns

- **Service boundaries**: Each service owns its data (database-per-service). Services communicate ONLY via Kafka events or synchronous HTTP through the API Gateway. Direct database access across services is strictly forbidden.
- **Eventual consistency**: Accept that cross-service data will be temporarily inconsistent. Design UI to handle this: show "processing" states, use polling or WebSocket for real-time updates. The Outbox pattern + Kafka provides at-least-once delivery.
- **Saga pattern**: For multi-service operations (user registration, interview completion), use the saga pattern with compensation. The API Gateway orchestrates: if step 2 fails, compensate step 1. Log all saga steps with a correlation ID for debugging. Never leave partial state.
- **Idempotency everywhere**: Every event consumer must be idempotent. Use the `processed_events` table pattern: check event ID before processing, mark as processed after success. For HTTP endpoints: use `Idempotency-Key` header for POST requests.
- **Service discovery**: In Docker Compose, services find each other by container name (e.g., `http://user-service:8002`). In Kubernetes, use Service DNS (`http://user-service.default.svc.cluster.local`). Never hardcode IP addresses.
- **Bulkhead pattern**: Isolate failure domains. Each service has its own database, Redis connection, and Kafka consumer group. A failing service should not cascade to others. The circuit breaker in API Gateway enforces this at the HTTP level.
- **API Gateway as the single entry point**: All external traffic enters through the API Gateway. Services never expose ports externally (except health checks for orchestrators). The gateway handles auth, rate limiting, routing, and response aggregation.
- **Data duplication is OK**: Services may store denormalized copies of data they need. For example, Interview Service stores `companyName` from User Service in invitations. This avoids cross-service queries. Keep copies updated via Kafka events.
- **Contract testing**: Use the shared package (`@repo/shared`) as the single source of truth for event contracts. When changing an event schema, update the shared package first, then all producers and consumers. TypeScript compilation catches missing fields.
- **Timeouts and deadlines**: Every inter-service call must have a timeout. Set timeout budgets: if the API Gateway has 30s, and it calls User Service (5s timeout) then Interview Service (10s), there's 15s budget remaining. Never let a downstream timeout exceed the upstream timeout.

### PostgreSQL Best Practices

- **Database per service**: Each service has its own PostgreSQL database. Never share databases. This ensures loose coupling and allows independent schema evolution, backup, and scaling.
- **Connection pooling**: Configure TypeORM pool: `max: 20` (production), `max: 5` (development). For production, consider PgBouncer in transaction mode in front of PostgreSQL. Set `statement_timeout: '30s'` to kill runaway queries.
- **Indexing strategy**: Index all foreign keys, all columns used in WHERE/JOIN/ORDER BY. Use `EXPLAIN ANALYZE` to verify index usage. Prefer partial indexes for soft-delete patterns: `CREATE INDEX idx_users_active ON users(email) WHERE deleted_at IS NULL`. Use composite indexes for multi-column queries (leftmost prefix rule).
- **Migration safety**: Always use explicit migrations, never `synchronize: true`. Every migration must be reversible (`up()` and `down()`). Test `down()` migrations in CI. For zero-downtime deployments: add columns as nullable first, backfill data, then add NOT NULL constraint in a separate migration.
- **VACUUM and maintenance**: Configure `autovacuum_vacuum_cost_limit = 1000` for high-write tables (outbox, events). Monitor `pg_stat_user_tables.n_dead_tup` for bloat. For the outbox table specifically, set aggressive vacuum: `autovacuum_vacuum_threshold = 50, autovacuum_vacuum_scale_factor = 0.01`.
- **UUID primary keys**: Generate UUIDs in the application layer (`uuid v4`), not in PostgreSQL (`gen_random_uuid()`). This allows the handler to know the ID before persisting (needed for Outbox pattern, event IDs, and response construction).
- **JSONB columns**: Use `jsonb` for semi-structured data (event payloads, metadata, settings). Create GIN indexes for queried JSONB fields: `CREATE INDEX idx_outbox_payload ON outbox USING gin(payload)`. Avoid deep nesting — flatten when possible.
- **Transactions**: Wrap aggregate save + outbox save in a single transaction for atomicity. Use `DataSource.transaction()` or `QueryRunner`. Keep transactions short — never hold a transaction open while making HTTP/Kafka calls.
- **Query optimization**: For list queries, use read models (flat SQL views or denormalized tables) instead of loading full aggregates. Use `SELECT` only needed columns. Use `LIMIT`/`OFFSET` for pagination (or better: keyset pagination for large datasets).
- **Monitoring**: Track `pg_stat_activity` for active connections, `pg_stat_statements` for slow queries, `pg_stat_user_tables` for table bloat. Set up alerts for: connection count > 80% of max, replication lag > 10s, disk usage > 80%.

### Kafka Best Practices

- **Topic naming**: Use kebab-case: `user-events`, `interview-commands`. Every topic has a corresponding DLQ: `user-events-dlq`. Use consistent naming across the monorepo via `KAFKA_TOPICS` constant from `@repo/shared`.
- **Partition keys**: Use the aggregate ID (userId, invitationId, analysisId) as the partition key to guarantee ordered delivery per entity. Never use random keys if event ordering matters. All events for the same user will go to the same partition.
- **Consumer groups**: One consumer group per service (`user-service`, `interview-service`, `ai-analysis-service`). Each service gets its own copy of every message. Within a service, multiple instances share the same group for load balancing.
- **Exactly-once processing**: Kafka provides at-least-once delivery. Combine with application-level idempotency (processed_events table) for effectively-exactly-once semantics. Use `idempotent: true` on the producer to prevent duplicate messages from producer retries.
- **Dead Letter Queues**: After 3 failed processing attempts, send the message to `<topic>-dlq` with error metadata (error message, stack trace, retry count, original timestamp). Monitor DLQ depth. Build admin tooling to inspect and replay DLQ messages.
- **Long-running consumers**: For AI analysis (minutes per message), set `sessionTimeout: 600000` (10 min) and `heartbeatInterval: 10000` (10s). Call `heartbeat()` periodically during processing to prevent consumer eviction. Never block the consumer thread with synchronous operations.
- **Event envelope**: All events follow `BaseEvent` structure: `{ eventId, eventType, timestamp, version, source, payload }`. Include all data the consumer needs in the payload (fat events). Consumers should not need to call back to the producer service.
- **Schema evolution**: Add new optional fields freely. Never remove or rename fields. Use the `version` field to track schema changes. Consumers must handle unknown fields gracefully (ignore them). For breaking changes, create a new event type (`user.created.v2`).
- **Monitoring**: Track consumer lag per group/partition, message throughput per topic, DLQ depth, producer error rate. Alert on: consumer lag > 1000, DLQ messages > 0, producer errors > 1% of published messages.
- **Backpressure**: If a consumer falls behind, Kafka will buffer messages on the broker. Set `fetch.max.bytes` and `max.partition.fetch.bytes` to control batch sizes. For bursty workloads, scale consumer instances to match partition count.

### Redis & BullMQ Best Practices

- **Connection management**: Use a single Redis connection for BullMQ and a separate one for caching. Configure `maxRetriesPerRequest: null` for BullMQ (it handles its own retries). Set `enableReadyCheck: true` to verify Redis is ready before processing.
- **BullMQ job design**: Keep job data small (< 1KB). Store large payloads in the database and pass only IDs in the job. Use `jobId` to prevent duplicate jobs (e.g., `jobId: eventId` for outbox processing). Set `removeOnComplete: true` and `removeOnFail: 1000` to prevent Redis memory growth.
- **Retry strategies**: Use exponential backoff for transient failures: `backoff: { type: 'exponential', delay: 2000 }`. Set `attempts: 3` for outbox jobs. After max retries, BullMQ moves the job to the failed set — monitor this.
- **Queue monitoring**: Use Bull Board or a custom endpoint to expose queue health: active jobs, waiting jobs, failed jobs, completed jobs. Alert on: failed jobs > 0, waiting jobs > 100, processing time > expected SLA.
- **Redis memory**: Set `maxmemory` with `allkeys-lru` eviction policy. For BullMQ-only Redis, monitor memory usage and increase limits as needed. BullMQ stores job data in Redis — large payloads cause memory pressure.
- **Concurrency**: Set BullMQ worker `concurrency` based on the work type. For CPU-bound work (e.g., FFmpeg): concurrency = CPU cores. For I/O-bound work (e.g., Kafka publish): concurrency = 5-10. For rate-limited work (e.g., Groq API): concurrency = 1.

### Distributed Systems Resilience

- **Circuit breaker**: Wrap all inter-service HTTP calls in circuit breakers. Three states: CLOSED (normal), OPEN (fail fast), HALF_OPEN (test recovery). Configure per-service: `failureThreshold: 5, resetTimeout: 60s, rollingWindow: 10s`. One failing service must not bring down the entire platform.
- **Retry with jitter**: For transient failures, retry with exponential backoff + random jitter: `delay = min(baseDelay * 2^attempt, maxDelay) + random(0, jitter)`. This prevents thundering herd when a service recovers. Never retry on 4xx errors (client mistakes).
- **Timeout hierarchy**: Set timeouts in a chain: Frontend (30s) > API Gateway (10-20s) > Service (5-15s) > Database (3-10s). Each layer's timeout must be shorter than its caller's. Include timeout in error messages for debugging.
- **Graceful degradation**: When a non-critical service is down, return partial data instead of an error. For example, if AI Analysis is down, still show interview results without scores. Use feature flags to disable non-critical features during outages.
- **Health checks**: Every service exposes `/health` with dependency checks (DB connection, Redis ping, Kafka connectivity). Use three-state health: `UP`, `DEGRADED` (some dependencies down but service functional), `DOWN`. Orchestrators (Docker, K8s) use these for restarts and routing.
- **Correlation IDs**: Generate a UUID at the API Gateway for each incoming request. Propagate it through all HTTP headers (`x-correlation-id`), Kafka message headers, and log entries. This enables end-to-end request tracing across all services.
- **Backpressure management**: If a service is overwhelmed, it should reject new work (return 429 or 503) rather than queueing unboundedly. Use BullMQ queue depth limits. Monitor queue sizes and consumer lag as leading indicators of overload.

### Observability Best Practices

- **Metrics (RED method)**: For every service, track Rate (requests/sec), Errors (error rate %), Duration (latency P50/P95/P99). Use Prometheus histograms for duration, counters for rate and errors. Alert on: error rate > 5%, P99 > 5s, rate drop > 50%.
- **Structured logging**: All logs are JSON via Winston. Required fields: `timestamp`, `level`, `message`, `service`, `correlationId`. Optional: `userId`, `action`, `duration`, `error`. Never log PII (full emails, tokens). Use log levels consistently: `error` = action required, `warn` = degraded, `info` = business event, `debug` = development details.
- **Distributed tracing**: OpenTelemetry SDK initialized before NestJS bootstrap. W3C Trace Context (`traceparent`) propagated in all HTTP and Kafka headers. Jaeger collects traces. Use sampling in production: 100% for errors, 10% for normal requests.
- **Dashboard hierarchy**: Build dashboards from high-level to low-level: (1) Platform overview (all services health, total request rate), (2) Per-service dashboard (RED metrics, circuit breaker state), (3) Infrastructure dashboard (CPU, memory, disk, network), (4) Business metrics (interviews created, analyses completed).
- **Alerting strategy**: Use Prometheus Alertmanager with severity levels: `critical` (pages on-call, e.g., service down > 2 min), `warning` (Slack notification, e.g., high error rate), `info` (dashboard only, e.g., unusual traffic pattern). Avoid alert fatigue by setting appropriate thresholds.

### Security Best Practices (Cross-Service)

- **Zero trust between services**: Even internal service-to-service calls should be authenticated. Use the `x-internal-request: true` header as a basic check. For production, use mTLS (mutual TLS) between services via service mesh (Istio/Linkerd).
- **Secret management**: Never commit secrets to git. Use environment variables for local dev, HashiCorp Vault or K8s Secrets for production. Rotate secrets regularly. The `.env` file must be in `.gitignore`.
- **Input validation at boundaries**: Validate ALL external input at the API Gateway (class-validator DTOs). Validate again at the domain layer (value objects). Never trust data from other services blindly — validate at consumption points too.
- **SQL injection prevention**: TypeORM's parameterized queries prevent SQL injection by default. Never use raw SQL with string interpolation. When using `QueryBuilder`, always use `.setParameter()` for dynamic values.
- **Dependency security**: Run `npm audit` regularly. Pin exact versions in `package-lock.json`. Use Dependabot or Renovate for automated security patches. Prefer well-maintained libraries with frequent releases.
- **CORS**: Configure strict CORS at the API Gateway: allow only the frontend origin, enable credentials, restrict methods and headers. Never use `origin: '*'` with `credentials: true`.
- **Rate limiting**: Apply at two levels: (1) nginx (IP-based rate limiting for DDoS protection), (2) API Gateway (user-based rate limiting for abuse prevention). Use Redis sliding window counters for accurate rate limiting.

### Testing Strategy (Cross-Service)

- **Test pyramid**: Unit tests (fast, many) > Integration tests (slower, fewer) > E2E tests (slowest, fewest). Aim for 90% domain coverage, 80% application coverage, key integration paths covered.
- **Domain tests (no mocks)**: Test aggregates and value objects directly. Create via factory methods, call business methods, assert state and events. These are the fastest and most valuable tests.
- **Application tests (mocked infra)**: Mock repositories, outbox, and event bus. Test handler orchestration: correct method calls, correct arguments, correct order. Verify error handling paths.
- **Integration tests (real DB)**: Use test databases (configured in docker-compose). Run migrations, execute full flows, verify DB state. Use transaction rollback for cleanup between tests.
- **Contract tests**: Verify that produced events match the schema in `@repo/shared`. Verify that consumers can parse events from producers. This catches serialization issues before they reach production.
- **No `console.log` in tests**: Use the LoggerService mock. Assert log calls if logging is part of the requirement.

### AI / LLM Integration Patterns

- **Provider abstraction**: Always use a port interface (`IAnalysisEngine`) between application logic and LLM providers. This enables: swapping providers (Groq → OpenAI → local), mocking in tests, A/B testing models, and gradual migration.
- **Rate limit management**: Track API rate limits (TPM, RPM, TPD) from response headers. Implement adaptive delays: if approaching the limit, increase delay between calls. For free tier, implement a token budget per day and reject requests when exhausted.
- **Prompt versioning**: Store prompts as templates, not hardcoded strings. Version prompts alongside code. When changing prompts, test against a reference dataset to ensure quality doesn't regress. Consider storing prompts in config files or database for runtime updates.
- **Response validation**: Always validate LLM JSON output against expected schema. Use `JSON.parse` with try/catch. Provide fallback values for missing fields. Clamp numeric values to valid ranges. Reject invalid enum values.
- **Cost tracking**: Log token usage per request (`prompt_tokens`, `completion_tokens`, `total_tokens`). Aggregate per analysis, per day, per model. Set budget alerts. Use smaller models for development/testing.
- **Evaluation and quality**: Periodically review AI analysis quality. Compare scores against human evaluators. Track score distribution — if all scores cluster around 70-80, the scoring criteria may need recalibration. Log full prompts and responses for debugging (in development only, never in production with PII).
