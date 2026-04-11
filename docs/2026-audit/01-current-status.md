# 01 — Current Status (What's Done)

**Last updated:** 2026-04-04

## Overall Progress

```
Services:        ████████████████░░░░  6/7 backend + 1 frontend
Infrastructure:  ██████████████████░░  90%
Observability:   ████████████████░░░░  75%
Testing:         ██████████████████░░  85%
CI/CD:           ░░░░░░░░░░░░░░░░░░░░  0%
Production:      ░░░░░░░░░░░░░░░░░░░░  0%
```

---

## Backend Services

### API Gateway (port 8001) — DONE

| Area               | Status  | Details                                                                                              |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------- |
| Keycloak OIDC      | Done    | JWT validation via JWKS, httpOnly cookies, refresh flow                                              |
| Registration Saga  | Done    | Compensation pattern (rollback on failure)                                                           |
| Service Proxying   | Done    | BaseServiceProxy to User, Interview, Analysis, Billing, Notification services                        |
| Circuit Breaker    | Done    | Custom 3-state (CLOSED/OPEN/HALF_OPEN) with rolling window                                           |
| Kafka Producers    | Done    | user-commands, auth-events topics                                                                    |
| Prometheus Metrics | Done    | Per-service call tracking, HTTP request metrics                                                      |
| OpenTelemetry      | Done    | Jaeger integration, W3C trace context                                                                |
| Winston Logging    | Done    | Loki transport, structured JSON                                                                      |
| Health Checks      | Done    | `/health` endpoint                                                                                   |
| Swagger            | Done    | `/api/docs`                                                                                          |
| 30+ API Endpoints  | Done    | Auth, users, HR, candidates, skills, admin, templates, invitations, analysis, billing, notifications |
| Tests              | Minimal | 1 test file — needs improvement                                                                      |

### User Service (port 8002) — DONE

| Area                | Status | Details                                                                                                  |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| Domain Layer        | Done   | 3 aggregates (User, Company, CandidateProfile), 8 value objects, 12 domain events                        |
| Domain Exceptions   | Done   | 12 exception types: User, Company, Skill, Candidate, AccessDenied — all mapped via DomainExceptionFilter |
| Commands (CQRS)     | Done   | 19 commands: CRUD + role selection + avatar + company + skills                                           |
| Queries (CQRS)      | Done   | 14 queries: users, companies, skills, candidates, stats                                                  |
| TypeORM Persistence | Done   | 9 entities, 5 migrations, mappers                                                                        |
| Kafka Integration   | Done   | Consumes user-commands, publishes user-events (Outbox + BullMQ)                                          |
| MinIO Storage       | Done   | Avatar upload with presigned URLs                                                                        |
| Read Models         | Done   | Separate read repositories for optimized queries                                                         |
| Tests               | Good   | 38 test suites, 581 tests passing                                                                        |
| Known Bugs          | Minor  | console.log in migrations (acceptable), some P2/P3 code quality items                                    |

### Interview Service (port 8003) — DONE

| Area                        | Status | Details                                                                            |
| --------------------------- | ------ | ---------------------------------------------------------------------------------- |
| Domain Layer                | Done   | 2 aggregates (Template, Invitation), state machines, 10 domain events              |
| Commands (CQRS)             | Done   | 11 commands: template CRUD, publish, questions, invitations, responses             |
| Queries (CQRS)              | Done   | 6 queries: templates, invitations, questions                                       |
| State Machines              | Done   | Template: draft→active→archived; Invitation: pending→in_progress→completed/expired |
| Kafka Integration           | Done   | Publishes invitation.completed (Outbox), consumes analysis.completed               |
| Denormalized Contact Fields | Done   | candidateEmail, candidateName, hrEmail, hrName stored in invitation                |
| TypeORM Persistence         | Done   | 5 entities, 6 migrations                                                           |
| Tests                       | Good   | 13 test files                                                                      |

### AI Analysis Service (port 8005) — DONE

| Area                 | Status | Details                                                                                      |
| -------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Domain Layer         | Done   | AnalysisResult aggregate, QuestionAnalysis entity, Score/Recommendation VOs                  |
| Groq LLM Integration | Done   | openai/gpt-oss-120b, temperature 0.3, JSON mode                                              |
| Scoring Algorithm    | Done   | 4 criteria (relevance, completeness, clarity, depth), weighted 0-100                         |
| Recommendations      | Done   | hire (>=75), consider (50-74), reject (<50)                                                  |
| Kafka Consumer       | Done   | Consumes invitation.completed from interview-events (sessionTimeout: 600s for long analysis) |
| Idempotency          | Done   | processed_events table with UNIQUE constraint                                                |
| Rate Limiting        | Done   | 5s delay between Groq calls (free tier ~8000 TPM)                                            |
| Ports & Adapters     | Done   | IAnalysisEngine, IEventPublisher, IPromptLoader interfaces                                   |
| Sandbox Controller   | Done   | Dev endpoint for manual testing without Kafka                                                |
| Tests                | Good   | 15 test files                                                                                |

### Notification Service (port 8006) — DONE

| Area                     | Status  | Details                                                                                             |
| ------------------------ | ------- | --------------------------------------------------------------------------------------------------- |
| Domain Layer             | Done    | DDD + CQRS + Outbox (same as other services)                                                        |
| Email Delivery           | Done    | SMTP via Nodemailer, Handlebars templates                                                           |
| Kafka Consumers          | Done    | user.created → welcome email, invitation.created → candidate email, invitation.completed → HR email |
| Notification Preferences | Done    | CRUD for user notification preferences                                                              |
| Template Renderer        | Done    | Handlebars templates with underscore→dash normalization                                             |
| TypeORM Persistence      | Done    | Migrations, outbox table                                                                            |
| Tests                    | Minimal | Needs improvement                                                                                   |

### Billing Service (port 8007) — DONE

| Area                | Status  | Details                                             |
| ------------------- | ------- | --------------------------------------------------- |
| Domain Layer        | Done    | Subscription aggregate, Plan entity, Usage tracking |
| Freemium Model      | Done    | Free / Plus / Pro plans with limits                 |
| Stripe Integration  | Done    | Checkout sessions, webhooks, subscription lifecycle |
| Kafka Consumers     | Done    | user.created → auto-create free subscription        |
| Usage Tracking      | Done    | Interview and analysis usage per billing period     |
| Quota Enforcement   | Done    | Check quota before interview creation               |
| TypeORM Persistence | Done    | Migrations, outbox table                            |
| Tests               | Minimal | Needs improvement                                   |

### Media Service (port 8004) — NOT STARTED

Specification exists in docs (MEDIA_SERVICE.md), but **zero source code**. Only Phase 1 (MinIO basics) was partially done via User Service (avatar upload).

---

## Frontend — Web App (port 3000) — DONE

| Area                | Status | Details                                                    |
| ------------------- | ------ | ---------------------------------------------------------- |
| Framework           | Done   | Next.js 15 + React 19 + App Router                         |
| Auth Middleware     | Done   | Cookie-based JWT, auto-refresh, role-based route guards    |
| Landing Pages       | Done   | Marketing: landing, about, pricing                         |
| Auth Flow           | Done   | Login, register, OAuth callback, role selection            |
| Admin Dashboard     | Done   | User management, skills, interview admin                   |
| HR Dashboard        | Done   | Template builder, companies, candidate search, invitations |
| Candidate Dashboard | Done   | Profile, skills, interview list                            |
| Template Builder    | Done   | Drag-and-drop question reordering                          |
| AI Results Display  | Done   | Interview analysis results visualization                   |
| Profile Management  | Done   | Editing, security, timezone/language prefs                 |
| API Layer           | Done   | React Query + base HTTP client with token refresh          |
| Styling             | Done   | Tailwind 4 + shadcn/ui + dark mode                         |
| Tests               | None   | No unit/component tests found                              |

**10 Feature Modules**: auth, candidates, companies, templates, interviews, profile, skills, candidate-skills, users, hr-candidates

---

## Shared Package (@repo/shared) — DONE

| Area                 | Status | Details                                                                      |
| -------------------- | ------ | ---------------------------------------------------------------------------- |
| Event Contracts      | Done   | BaseEvent, 7 user commands, 10 user events, 2 auth events, 2 analysis events |
| Event Factories      | Done   | UserCommandFactory, AuthEventFactory                                         |
| KafkaService         | Done   | Idempotent producer, manual/auto-commit consumer, DLQ handling               |
| KafkaHealthService   | Done   | Broker health, consumer lag, group reset                                     |
| Trace Propagation    | Done   | W3C trace context inject/extract for Kafka headers                           |
| Generated Contracts  | Done   | Auto-generated types from OpenAPI specs (user-service, interview-service)    |
| Topics Configuration | Done   | 8 topics + 8 DLQ topics defined                                              |

---

## Infrastructure — DONE (for local dev)

| Component       | Status | Details                                                                   |
| --------------- | ------ | ------------------------------------------------------------------------- |
| PostgreSQL 15   | Done   | 5 databases (user, interview, analysis, billing, notification) + test DBs |
| Redis 7         | Done   | Cache, BullMQ queues                                                      |
| Kafka 7.4 KRaft | Done   | No Zookeeper, single node, JMX metrics                                    |
| Kafka UI        | Done   | Web management at :8080                                                   |
| Kafka Exporter  | Done   | Prometheus metrics at :9308                                               |
| MinIO           | Done   | S3-compatible storage, console at :9001                                   |
| Keycloak        | Done   | Custom realm, roles (admin/hr/candidate), custom login theme              |
| Mailpit         | Done   | Local SMTP testing at :1025, web UI at :8025                              |
| Docker Compose  | Done   | 15+ containers, healthchecks, custom network                              |
| Init Scripts    | Done   | DB creation, Kafka topic setup, test user scripts                         |

## Observability Stack

| Component     | Status      | Details                                                             |
| ------------- | ----------- | ------------------------------------------------------------------- |
| Prometheus    | Done        | Scrapes all services + node exporter + kafka exporter               |
| Grafana       | Partial     | 1 unified dashboard; kafka-overview & system-overview = empty stubs |
| Loki          | Done        | Log aggregation with 31-day retention                               |
| Promtail      | Done        | Docker + NestJS app log scraping, JSON parsing, field extraction    |
| Jaeger        | Done        | Distributed tracing, OTLP enabled                                   |
| Node Exporter | Done        | System metrics                                                      |
| Alert Rules   | Not Started | Prometheus rules directory empty, no Alertmanager container         |
| ClickHouse    | Optional    | Analytics DB, behind Docker profile flag                            |

---

## Testing

| Area                | Status      | Details                                                                                                |
| ------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| Unit Tests          | Done        | 6 services: user (581), interview (432), ai-analysis (221), billing (246), notification, api-gateway   |
| Integration Tests   | Done        | 5 services: user, interview, ai-analysis (9), billing (5), notification — real PostgreSQL + migrations |
| E2E Tests           | Done        | 5 services: user, interview, ai-analysis (7), billing (3), api-gateway (48) — full HTTP stack          |
| System E2E Tests    | Done        | 69 tests across 8 categories, all passing                                                              |
| Test Pipeline       | Done        | `npm run test:pipeline` — sequential: unit → integration → e2e → system, fail-fast                     |
| System Test Runner  | Done        | `npm run system-test` — starts 6 services on test ports (9002-9010)                                    |
| Clean Kafka Startup | Done        | Delete consumer groups + recreate topics before test run                                               |
| Async Drain         | Done        | waitForAsyncDrain() polls outbox tables + analysis_results between categories                          |
| Frontend Tests      | None        | No unit/component tests                                                                                |
| CI/CD               | Not Started | No GitHub Actions workflows                                                                            |

---

## Recent Changes (2026-03 → 2026-04)

- **bull → bullmq migration** across all 5 services (BullMQ 5.x + @nestjs/bullmq)
- **6 event contract fixes** between producers and consumers
- **Unique BullMQ queue names** per service (prevents cross-service job stealing)
- **Invitation denormalization** — candidateEmail, candidateName, hrEmail, hrName stored in invitation aggregate
- **Kafka session timeout** — reduced default from 600s to 30s (only AI analysis consumer keeps 600s)
- **System E2E test framework** — 66 tests, 8 categories, clean Kafka startup, async drain
- **User Service DDD layer fix** — replaced 20 NestJS exceptions (NotFoundException, ConflictException, etc.) with 7 new domain exception classes across 13 handlers; DomainExceptionFilter updated with 12 exception→HTTP mappings
- **Company aggregate hardening** — defensive copy for users getter
- **Documentation cleanup** — removed 10 empty placeholders, fixed all port numbers, updated service statuses
- **AI Analysis Service** — added integration tests (9 specs) + e2e tests (7 specs) with MockAnalysisEngine
- **Billing Service** — added Kafka consumer unit tests (user-created + usage-tracking), system tests for usage tracking + quota enforcement
- **Interview Service** — added `companyId` to invitation.completed outbox payload (was missing, broke billing usage tracking)
- **Test Pipeline** — `npm run test:pipeline` runs unit → integration → e2e → system sequentially with fail-fast

---

## Cross-Cutting Concerns

| Concern                             | Status                                                          |
| ----------------------------------- | --------------------------------------------------------------- |
| Event-driven communication (Kafka)  | Done — Outbox pattern, DLQ, idempotency                         |
| Distributed tracing (OpenTelemetry) | Done — W3C propagation through Kafka                            |
| Structured logging (Winston + Loki) | Done — JSON logs, field extraction                              |
| Metrics (Prometheus)                | Done — per-service /metrics endpoints                           |
| Health checks                       | Done — /health on each service                                  |
| API docs (Swagger)                  | Done — /api/docs on each service                                |
| RBAC                                | Done — admin/hr/candidate roles via Keycloak                    |
| Error handling                      | Done — Domain exceptions, DomainExceptionFilter                 |
| Correlation IDs                     | Done — x-correlation-id propagated through gateway and services |
