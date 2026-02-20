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
