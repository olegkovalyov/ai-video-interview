# AI Video Interview Platform

Production-grade platform for asynchronous AI-powered video interviews. Candidates record responses at their convenience, and the system automatically analyzes them using LLM, providing detailed scoring and hiring recommendations.

Built with microservices architecture using Turborepo, NestJS 11, Next.js 15, and TypeScript 5.8.

---

## Architecture

```
                          ┌──────────────────────────────────┐
                          │     Frontend (Next.js 15)        │
                          │          Port: 3000              │
                          │   App Router · React 19 · shadcn │
                          └───────────────┬──────────────────┘
                                          │ HTTP (cookies)
                                          ▼
                          ┌──────────────────────────────────┐
                          │      API Gateway (NestJS)        │
                          │          Port: 8001              │
                          │  Keycloak OIDC · Circuit Breaker │
                          │  Rate Limiting · Tracing · Sagas │
                          └──┬──────┬──────┬──────┬──────┬───┘
                             │      │      │      │      │
          ┌──────────────────┼──────┼──────┼──────┼──────┼──────────────────┐
          ▼                  ▼      ▼      ▼      ▼      ▼                  ▼
   ┌─────────────┐  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────-──┐
   │   User      │  │ Interview  │ │ AI Analysis│ │   Media    │ │Notification│ │  Billing    │
   │  Service    │  │  Service   │ │  Service   │ │  Service   │ │  Service   │ │  Service    │
   │  :8002      │  │  :8003     │ │  :8005     │ │  :8004     │ │  :8006     │ │  :8007      │
   │             │  │            │ │            │ │            │ │            │ │             │
   │Users, Roles │  │ Templates  │ │ Groq LLM   │ │Video/Audio │ │Email, Push │ │  Stripe     │
   │Companies    │  │ Invitations│ │ Scoring    │ │Transcripts │ │In-App, SMS │ │Subscriptions│
   │Skills, MinIO│  │ Responses  │ │Recommend.  │ │Thumbnails  │ │Preferences │ │Usage, Quota │
   └──────┬──────┘  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
          │  DB ▼         │  DB ▼        │  DB ▼        │ (planned)    │  DB ▼        │  DB ▼
          │ [user]        │ [interview]  │ [analysis]   │              │ [notification]│ [billing]
          │               │              │              │              │              │
          └───────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
                                          │
                                          ▼
                          ┌─────────────────────────────────-─┐
                          │        Apache Kafka (KRaft)       │
                          │           Port: 9092              │
                          │                                   │
                          │  user-events · interview-events   │
                          │  analysis-events · billing-events │
                          │  notification-events · auth-events│
                          │  user-commands · user-analytics   │
                          └─────────────────────────────────-─┘
```

### Services

| Service                  | Port | Status  | Description                                                                                              |
| ------------------------ | ---- | ------- | -------------------------------------------------------------------------------------------------------- |
| **Web Frontend**         | 3000 | Active  | Next.js 15 App Router, React 19, Tailwind 4, shadcn/ui, React Query                                      |
| **API Gateway**          | 8001 | Active  | Keycloak OIDC auth, HTTP proxying, circuit breaker, saga orchestration, tracing                          |
| **User Service**         | 8002 | Active  | Users, roles, companies, skills, avatar uploads to MinIO (DDD + CQRS)                                    |
| **Interview Service**    | 8003 | Active  | Templates, questions, invitations, candidate responses, expiration scheduler (DDD + CQRS)                |
| **Media Service**        | 8004 | Planned | Video/audio storage, transcription, thumbnail generation, streaming                                      |
| **AI Analysis Service**  | 8005 | Active  | Groq LLM analysis, per-question scoring (0-100), recommendations (DDD + CQRS)                            |
| **Notification Service** | 8006 | Active  | Multi-channel notifications (email/in-app/webhook), Handlebars templates, scheduled digests (DDD + CQRS) |
| **Billing Service**      | 8007 | Active  | Stripe subscriptions (free/plus/pro), usage tracking, quota enforcement (DDD + CQRS)                     |

> **Outbox Pattern**: All services (except API Gateway) use the Outbox pattern — domain events are persisted to the outbox table within the same DB transaction as the aggregate, then asynchronously published to Kafka via BullMQ workers. This guarantees at-least-once delivery without distributed transactions.

### Inter-Service Communication

All backend services communicate **exclusively** via Kafka events (async) or through the API Gateway (sync). Direct service-to-service HTTP calls and cross-database access are strictly forbidden.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Main Business Flow                                │
│                                                                             │
│  HR creates template ──→ adds questions ──→ publishes template              │
│                                                                             │
│  HR sends invitation ──→ candidate records responses ──→ completes          │
│       │                                                                     │
│       ▼                                                                     │
│  invitation.completed (Kafka via Outbox)                                    │
│       │                                                                     │
│       ├──→ AI Analysis Service: per-question LLM scoring + summary          │
│       │         │                                                           │
│       │         ▼                                                           │
│       │    analysis.completed (Kafka)                                        │
│       │         │                                                           │
│       │         ├──→ Interview Service: saves analysis reference             │
│       │         └──→ Notification Service: emails HR with results           │
│       │                                                                     │
│       ├──→ Notification Service: emails candidate confirmation              │
│       └──→ Billing Service: increments usage counter                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         Supporting Event Flows                              │
│                                                                             │
│  auth-events:     API Gateway ──→ User Service (login/logout tracking)      │
│  user-events:     User Service ──→ Billing, Notification (user.created, etc)│
│  billing-events:  Billing ──→ User Service, Notification (plan changes)     │
│  user-analytics:  User Service ──→ (analytics pipeline)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend

| Technology  | Version | Purpose                    |
| ----------- | ------- | -------------------------- |
| NestJS      | 11.x    | Backend framework          |
| TypeScript  | 5.8.3   | Language                   |
| TypeORM     | 0.3.x   | ORM with migrations        |
| kafkajs     | 2.x     | Event-driven messaging     |
| BullMQ      | 5.x     | Job queue (Outbox pattern) |
| prom-client | 15.x    | Prometheus metrics         |
| Winston     | 3.x     | Structured logging         |
| Jest        | 30.x    | Testing                    |

### Frontend

| Technology            | Version | Purpose                      |
| --------------------- | ------- | ---------------------------- |
| Next.js               | 15.4    | React framework (App Router) |
| React                 | 19.1    | UI library                   |
| Tailwind CSS          | 4.1     | Utility-first styling        |
| shadcn/ui + Radix     | latest  | UI components                |
| React Query           | 5.x     | Data fetching + caching      |
| React Hook Form + Zod | latest  | Form validation              |

### Infrastructure

| Technology | Version     | Purpose                             |
| ---------- | ----------- | ----------------------------------- |
| PostgreSQL | 15          | Database (per-service, 5 databases) |
| Redis      | 7           | Cache + BullMQ queue (Outbox)       |
| Kafka      | 7.4 (KRaft) | Event streaming (no Zookeeper)      |
| Keycloak   | latest      | Identity provider (OIDC)            |
| MinIO      | latest      | S3-compatible object storage        |
| ClickHouse | latest      | Analytics data warehouse            |
| Mailpit    | latest      | Email testing (dev SMTP + web UI)   |
| Groq API   | --          | LLM inference (Llama 3.3 / GPT-OSS) |

### Observability

| Technology             | Purpose                         |
| ---------------------- | ------------------------------- |
| Prometheus + Grafana   | Metrics collection + dashboards |
| Loki + Promtail        | Log aggregation                 |
| Jaeger + OpenTelemetry | Distributed tracing             |
| AlertManager           | Alert routing                   |
| Node Exporter          | System metrics (CPU, RAM, disk) |
| Postgres Exporter      | Database metrics                |
| Redis Exporter         | Cache metrics                   |
| Kafka Exporter         | Messaging metrics               |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 10+
- Docker & Docker Compose

### 1. Clone and Install

```bash
git clone <repository-url>
cd ai-video-interview
npm run setup
```

Or step by step:

```bash
npm install
npm run infra:up      # PostgreSQL, Redis, MinIO
npm run kafka:up      # Kafka + Kafka UI
```

### 2. Configure Environment

```bash
cp .env.example .env
cp apps/api-gateway/.env.example apps/api-gateway/.env
cp apps/user-service/.env.example apps/user-service/.env
cp apps/interview-service/.env.example apps/interview-service/.env
cp apps/ai-analysis-service/.env.example apps/ai-analysis-service/.env
cp apps/billing-service/.env.example apps/billing-service/.env
cp apps/notification-service/.env.example apps/notification-service/.env
```

### 3. Run Migrations

```bash
cd apps/user-service && npm run migration:run && cd ../..
cd apps/interview-service && npm run migration:run && cd ../..
cd apps/ai-analysis-service && npm run migration:run && cd ../..
cd apps/billing-service && npm run migration:run && cd ../..
cd apps/notification-service && npm run migration:run && cd ../..
```

### 4. Start Development

```bash
npm run dev:all        # All backend services + frontend
```

Or individually:

```bash
npm run dev:services   # All 6 backend services
npm run dev:web        # Frontend only
npm run dev:api        # API Gateway only
npm run dev:analysis   # AI Analysis Service only
```

---

## Access Points

| Service                      | URL                            | Credentials                |
| ---------------------------- | ------------------------------ | -------------------------- |
| Web App                      | http://localhost:3000          | --                         |
| API Gateway                  | http://localhost:8001          | --                         |
| API Gateway Swagger          | http://localhost:8001/api/docs | --                         |
| User Service Swagger         | http://localhost:8002/api/docs | --                         |
| Interview Service Swagger    | http://localhost:8003/api/docs | --                         |
| AI Analysis Swagger          | http://localhost:8005/api/docs | --                         |
| Notification Service Swagger | http://localhost:8006/api/docs | --                         |
| Billing Service Swagger      | http://localhost:8007/api/docs | --                         |
| Keycloak Admin               | http://localhost:8090          | admin / admin123           |
| Grafana                      | http://localhost:3002          | admin / admin123           |
| Prometheus                   | http://localhost:9090          | --                         |
| Jaeger UI                    | http://localhost:16686         | --                         |
| AlertManager                 | http://localhost:9093          | --                         |
| Kafka UI                     | http://localhost:8080          | --                         |
| MinIO Console                | http://localhost:9001          | minioadmin / minioadmin123 |
| Mailpit (dev email)          | http://localhost:8025          | --                         |

---

## Project Structure

```
ai-video-interview/
├── apps/
│   ├── api-gateway/              # NestJS — Auth, routing, circuit breaker
│   ├── user-service/             # NestJS — DDD + CQRS, users & companies
│   ├── interview-service/        # NestJS — DDD + CQRS, templates & invitations
│   ├── ai-analysis-service/      # NestJS — DDD + CQRS, Groq LLM analysis
│   ├── notification-service/    # NestJS — DDD + CQRS, email notifications
│   ├── billing-service/         # NestJS — DDD + CQRS, Stripe subscriptions
│   ├── media-service/            # NestJS — (planned) video/audio processing
│   └── web/                      # Next.js 15 — App Router frontend
│
├── packages/
│   ├── shared/                   # Kafka events, contracts, tracing utilities
│   ├── ui/                       # Shared UI components
│   ├── eslint-config/            # ESLint configurations
│   └── typescript-config/        # TypeScript configurations
│
├── infra/
│   ├── keycloak/                 # Keycloak themes
│   └── observability/            # Prometheus, Grafana, Loki, Jaeger, AlertManager
│       ├── prometheus.yml        # Scrape configs for all services + exporters
│       ├── rules/                # Prometheus alert rules
│       ├── alertmanager/         # AlertManager routing config
│       ├── grafana/
│       │   ├── dashboards/       # 4 JSON dashboards (Unified, Kafka, System, AI)
│       │   └── provisioning/     # Datasources (Prometheus, Loki, Jaeger)
│       ├── loki/                 # Loki config
│       └── promtail/             # Promtail log shipper config
│
├── scripts/                      # DB init, Kafka topics, test scripts
├── docs/                         # 14 documentation sections
├── docker-compose.yml            # All infrastructure services
└── turbo.json                    # Turborepo pipeline config
```

### Backend Service Architecture (DDD + CQRS)

Each backend service follows the same layered architecture:

```
src/
├── domain/                       # Pure business logic (no framework deps)
│   ├── aggregates/               # Aggregate roots with factory methods
│   ├── entities/                 # Child entities
│   ├── value-objects/            # Immutable value types with validation
│   ├── events/                   # Domain events
│   ├── exceptions/               # Domain-specific exceptions
│   └── repositories/             # Repository interfaces only
│
├── application/                  # Use cases (depends on domain only)
│   ├── commands/                 # Write operations (CQRS)
│   ├── queries/                  # Read operations (CQRS)
│   ├── event-handlers/           # Domain event listeners
│   └── dto/                      # Request/Response DTOs
│
└── infrastructure/               # Framework & external services
    ├── persistence/              # TypeORM entities, repos, mappers, migrations
    ├── kafka/                    # Consumers & producers
    ├── messaging/                # Outbox pattern (BullMQ)
    ├── http/                     # Controllers, guards, filters
    ├── metrics/                  # Prometheus metrics + HTTP interceptor
    ├── tracing/                  # OpenTelemetry + Jaeger
    └── logger/                   # Winston structured logging
```

---

## Kafka Topics

| Topic                 | DLQ                       | Publisher            | Consumers                          |
| --------------------- | ------------------------- | -------------------- | ---------------------------------- |
| `user-commands`       | `user-commands-dlq`       | API Gateway          | User Service                       |
| `user-events`         | `user-events-dlq`         | User Service         | Interview, Billing, Notification   |
| `interview-events`    | `interview-events-dlq`    | Interview Service    | AI Analysis, Billing, Notification |
| `analysis-events`     | `analysis-events-dlq`     | AI Analysis Service  | Interview, Billing, Notification   |
| `billing-events`      | `billing-events-dlq`      | Billing Service      | User, Notification                 |
| `notification-events` | `notification-events-dlq` | Notification Service | --                                 |
| `auth-events`         | `auth-events-dlq`         | API Gateway          | User Service                       |
| `user-analytics`      | `user-analytics-dlq`      | User Service         | --                                 |

### Key Event Flows

```
Main Flow:
  HR creates template → adds questions → publishes → sends invitation
  Candidate starts interview → records responses → completes
    → invitation.completed (Kafka via Outbox)
      → AI Analysis Service: per-question LLM scoring + summary
        → analysis.completed (Kafka)
          → Interview Service: saves analysis reference
          → Notification Service: emails HR with results
      → Billing Service: increments usage counter
      → Notification Service: emails candidate confirmation

Supporting Flows:
  auth-events:    API Gateway → User Service (login/logout tracking)
  user-events:    User Service → Billing, Notification (user.created, role.assigned)
  billing-events: Billing → User Service, Notification (subscription changes)
```

All event publishing uses the **Outbox pattern** (persist to DB + async BullMQ workers publish to Kafka) for at-least-once delivery guarantees. Every consumer is idempotent via `processed_events` table.

---

## Databases

Each service owns its own PostgreSQL database (database-per-service pattern):

| Database                          | Service                | Purpose                                      |
| --------------------------------- | ---------------------- | -------------------------------------------- |
| `ai_video_interview_user`         | User Service           | Users, roles, companies, skills              |
| `ai_video_interview_interview`    | Interview Service      | Templates, questions, invitations, responses |
| `ai_video_interview_analysis`     | AI Analysis Service    | Analysis results, question scores            |
| `ai_video_interview_billing`      | Billing Service        | Subscriptions, plans, usage                  |
| `ai_video_interview_notification` | Notification Service   | Preferences, delivery logs                   |
| `keycloak`                        | Keycloak (separate PG) | Identity, sessions, realms                   |

---

## Observability

### Grafana Dashboards (http://localhost:3002)

| Dashboard             | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| Unified Observability | HTTP rate/errors/latency per service, service health, logs, traces |
| Kafka Overview        | Message throughput, consumer lag, partition stats, DLQ monitoring  |
| System Overview       | CPU, memory, disk, network, load average                           |
| AI Analysis Overview  | Analysis rate, LLM token usage, duration P95, request status       |

### Prometheus Alert Rules (http://localhost:9090/rules)

| Group           | Alerts                                                            |
| --------------- | ----------------------------------------------------------------- |
| Service Health  | ServiceDown, HighErrorRate (>5%), HighLatency (P99 >5s)           |
| Kafka Health    | KafkaConsumerLag (>1000), KafkaDLQMessages                        |
| Analysis Health | LLMRateLimited, HighAnalysisFailureRate (>10%), SlowAnalysis      |
| Infrastructure  | HighCPUUsage (>85%), HighMemoryUsage (>85%), HighDiskUsage (>85%) |

### Distributed Tracing (http://localhost:16686)

All 7 services (6 active + API Gateway) instrumented with OpenTelemetry, traces sent to Jaeger. W3C Trace Context (`traceparent`) propagated through HTTP and Kafka headers. Service map visualization enabled via Grafana's Jaeger datasource with nodeGraph.

---

## Commands

```bash
# Development
npm run dev:all              # Start all services + web
npm run dev:services         # Start only backend services
npm run dev:web              # Start only frontend
npm run dev:api              # Start only API Gateway
npm run dev:analysis         # Start only AI Analysis Service

# Build & Quality
npm run build                # Build all packages
npm run lint                 # ESLint all packages
npm run format               # Prettier format
npm run check-types          # TypeScript type checking

# Testing
npm run test                 # Run all unit tests
npm run test:e2e             # Run E2E tests
npm run system-test          # Run system E2E tests (all 8 categories)
npm run system-test -- -c 01-sync-http  # Run specific category

# Per-service (from service directory)
npm run test                 # Unit tests
npm run test:integration     # Integration tests
npm run test:e2e             # E2E tests
npm run test:cov             # Coverage report

# Database (from service directory)
npm run migration:generate -- src/infrastructure/persistence/migrations/MigrationName
npm run migration:run
npm run migration:revert

# Infrastructure
npm run infra:up             # Start PostgreSQL, Redis, MinIO
npm run infra:down           # Stop infrastructure
npm run infra:reset          # Reset (delete volumes + restart)
npm run kafka:up             # Start Kafka + UI
npm run kafka:down           # Stop Kafka
npm run kafka:reset          # Reset Kafka (delete volumes + restart)
npm run cleanup:ports        # Kill processes on service ports

# API Types
npm run generate:types       # Generate TS types from OpenAPI specs
```

---

## Environment Variables

Each service has its own `.env.example`. Key variables:

| Variable            | Default                           | Description                      |
| ------------------- | --------------------------------- | -------------------------------- |
| `PORT`              | varies                            | Service port                     |
| `DATABASE_HOST`     | localhost                         | PostgreSQL host                  |
| `DATABASE_PORT`     | 5432                              | PostgreSQL port                  |
| `DATABASE_NAME`     | varies                            | Service-specific DB name         |
| `DATABASE_USER`     | postgres                          | PostgreSQL user                  |
| `DATABASE_PASSWORD` | postgres                          | PostgreSQL password              |
| `KAFKA_BROKERS`     | localhost:9092                    | Kafka broker addresses           |
| `REDIS_HOST`        | localhost                         | Redis host                       |
| `KEYCLOAK_URL`      | http://localhost:8090             | Keycloak base URL                |
| `KEYCLOAK_REALM`    | ai-video-interview                | Keycloak realm name              |
| `GROQ_API_KEY`      | --                                | Groq Cloud API key (AI Analysis) |
| `GROQ_MODEL`        | openai/gpt-oss-120b               | LLM model for analysis           |
| `MINIO_ENDPOINT`    | http://localhost:9000             | MinIO/S3 endpoint                |
| `JAEGER_ENDPOINT`   | http://localhost:14268/api/traces | Jaeger collector                 |

---

## Documentation

Detailed documentation in `/docs/`:

| Section            | Content                                                |
| ------------------ | ------------------------------------------------------ |
| 01-getting-started | Onboarding and quick start guides                      |
| 02-architecture    | System design, containers, port assignments            |
| 03-services        | Per-service documentation (8 services)                 |
| 05-events          | Event schemas, Kafka topics, DLQ, idempotency          |
| 08-observability   | Logging guide, Prometheus/Loki queries                 |
| 13-roadmap         | Business audit, SaaS features, technical roadmap       |
| 2026-audit         | Platform status, remaining work, refactoring plan      |
| test/system        | System E2E test documentation (66 tests, 8 categories) |

---

## License

MIT
