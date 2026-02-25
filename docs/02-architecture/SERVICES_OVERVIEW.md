# Services Overview

This document provides a comprehensive overview of the AI Video Interview platform's microservices architecture.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js 15)                              │
│                                   Port: 3000                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               API GATEWAY                                        │
│                                 Port: 8001                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │     Auth     │ │   Metrics    │ │   Tracing    │ │   Circuit    │           │
│  │ (Keycloak)   │ │ (Prometheus) │ │ (OpenTelemetry│ │   Breaker    │           │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘           │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  USER SERVICE   │  │INTERVIEW SERVICE│  │  MEDIA SERVICE  │  │ AI ANALYSIS     │
│   Port: 8002    │  │   Port: 8003    │  │   Port: 8004    │  │   Port: 8005    │
│   ✅ DONE       │  │   ✅ DONE       │  │   🔴 PLANNED    │  │   ✅ DONE       │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │                    │
         └────────────────────┴────────────────────┴────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              KAFKA MESSAGE BUS (KRaft)                           │
│                                 Port: 9092                                       │
│  Topics: user-commands, user-events, interview-events, analysis-events, etc.    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│NOTIFICATION SVC │           │ BILLING SERVICE │           │    ANALYTICS    │
│   🔴 PLANNED    │           │   🔴 PLANNED    │           │   (ClickHouse)  │
│                 │           │                 │           │   🔴 PLANNED    │
└─────────────────┘           └─────────────────┘           └─────────────────┘
```

---

## Service Status

| Service | Port | Status | Database | Description |
|---------|------|--------|----------|-------------|
| **API Gateway** | 8001 | ✅ Done | — | Auth (Keycloak OIDC), routing, circuit breaker, metrics, tracing |
| **User Service** | 8002 | ✅ Done | PostgreSQL | User management, roles, profiles, companies, skills |
| **Interview Service** | 8003 | ✅ Done | PostgreSQL | Templates, questions, invitations, responses |
| **Media Service** | 8004 | 🔴 Planned | PostgreSQL + MinIO | File storage, video processing, transcription |
| **AI Analysis Service** | 8005 | ✅ Done | PostgreSQL | Groq LLM interview analysis, scoring, recommendations |
| **Notification Service** | — | 🔴 Planned | PostgreSQL | Email, webhooks |
| **Billing Service** | — | 🔴 Planned | PostgreSQL | Subscriptions, payments |

---

## Infrastructure Services

| Service | Port | Purpose |
|---------|------|---------|
| **PostgreSQL** | 5432 | Primary database (separate DB per service) |
| **PostgreSQL (Keycloak)** | 5433 | Keycloak database |
| **Redis** | 6379 | BullMQ queues, caching |
| **Kafka (KRaft)** | 9092 | Event streaming (no Zookeeper) |
| **Kafka UI** | 8080 | Kafka management dashboard |
| **Keycloak** | 8090 | Identity & Access Management |
| **MinIO** | 9000/9001 | Object storage (S3-compatible) |
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3002 | Dashboards & monitoring |
| **Loki** | 3100 | Log aggregation |
| **Promtail** | — | Log shipping to Loki |
| **Jaeger** | 16686 | Distributed tracing |
| **Kafka Exporter** | 9308 | Kafka metrics for Prometheus |
| **Node Exporter** | 9100 | Host metrics for Prometheus |

---

## Technology Stack

### Backend Services

| Layer | Technology |
|-------|------------|
| **Framework** | NestJS 11 |
| **Language** | TypeScript 5.8 |
| **ORM** | TypeORM 0.3.x |
| **CQRS** | @nestjs/cqrs |
| **Validation** | class-validator, class-transformer |
| **API Docs** | Swagger/OpenAPI |

### Architecture Patterns

| Pattern | Implementation |
|---------|----------------|
| **Clean Architecture** | Domain → Application → Infrastructure |
| **CQRS** | Commands/Queries separation via @nestjs/cqrs |
| **DDD** | Aggregates, Value Objects, Domain Events |
| **OUTBOX** | Reliable messaging with BullMQ + PostgreSQL |
| **Event-Driven** | Kafka event streaming (KRaft mode) |

### Frontend

| Technology | Version |
|------------|---------|
| **Framework** | Next.js 15 (App Router) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4 |
| **Components** | shadcn/ui + Radix UI |
| **Data Fetching** | React Query (TanStack) |
| **Forms** | React Hook Form + Zod |
| **Auth** | Keycloak OIDC (httpOnly cookies) |

---

## Service Communication

### Synchronous (HTTP)

```
Frontend ──HTTP──► API Gateway ──HTTP──► Microservices
                      │
                      ├── /users/*       ──► User Service (8002)
                      ├── /templates/*   ──► Interview Service (8003)
                      ├── /invitations/* ──► Interview Service (8003)
                      ├── /analysis/*    ──► AI Analysis Service (8005)
                      └── /media/*       ──► Media Service (8004)
```

### Asynchronous (Kafka)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             KAFKA TOPICS                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  auth-events         API Gateway ────────────────► User Service                 │
│  (user.authenticated)                                                            │
│                                                                                  │
│  user-commands        API Gateway ──────────────────────► User Service          │
│  (user.create, etc.)                                                             │
│                                                                                  │
│  user-events          User Service ────► Interview Service                      │
│  (user.created, etc.)                                                            │
│                                                                                  │
│  interview-events     Interview Service ──► AI Analysis Service                 │
│  (invitation.completed)                                                          │
│                                                                                  │
│  analysis-events      AI Analysis ────────► Interview Service                   │
│  (analysis.completed)                                                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Implemented Services Detail

### API Gateway (Port: 8001)

**Architecture:**
```
src/
├── core/
│   ├── auth/           # Keycloak integration, JWT, guards
│   ├── circuit-breaker/# Resilience patterns
│   ├── health/         # Health checks
│   ├── logging/        # Winston + Loki
│   ├── metrics/        # Prometheus metrics
│   └── tracing/        # OpenTelemetry
├── kafka/
│   └── producers/      # Event publishing
├── modules/
│   ├── user-service/   # User Service proxy
│   ├── interview-service/ # Interview Service proxy
│   └── analysis-service/  # Analysis Service proxy
└── proxies/            # HTTP proxies with circuit breaker
```

**Key Features:**
- OAuth2/OIDC authentication via Keycloak
- JWT token validation (JWKS) & httpOnly cookie sessions
- Circuit breaker for downstream services (CLOSED/OPEN/HALF_OPEN)
- Registration saga with compensation pattern
- Prometheus metrics endpoint (`/metrics`)
- OpenTelemetry distributed tracing
- Swagger API documentation at `/api/docs`
- Kafka event publishing (auth-events, user-commands)

---

### User Service (Port: 8002)

**Architecture:**
```
src/
├── domain/
│   ├── aggregates/     # User, Company, CandidateProfile
│   ├── entities/       # Skill, SkillCategory, CandidateSkill
│   ├── events/         # Domain events
│   ├── repositories/   # Repository interfaces
│   └── value-objects/  # Email, FullName, UserStatus, UserRole
├── application/
│   ├── commands/       # create-user, update-user, suspend, etc.
│   ├── queries/        # get-user, list-users, get-permissions
│   └── dto/            # Request/Response DTOs
└── infrastructure/
    ├── persistence/    # TypeORM entities, repositories, migrations
    ├── kafka/          # Event consumers/producers
    ├── messaging/      # OUTBOX pattern
    ├── http/           # Controllers
    └── storage/        # MinIO avatar storage
```

**CQRS Commands:**
- `CreateUser` - Create new user from Kafka event
- `UpdateUser` - Update user profile
- `SuspendUser` / `ActivateUser` - Account status management
- `SelectRole` - HR/Candidate role selection
- `UploadAvatar` - Profile picture upload to MinIO
- `CreateCompany` / `UpdateCompany` / `DeleteCompany` - Company management
- `CreateSkill` / `UpdateSkill` / `DeleteSkill` - Skill taxonomy (admin)
- `AddCandidateSkill` / `RemoveCandidateSkill` - Candidate skills management

**CQRS Queries:**
- `GetUser` - Get user by ID
- `GetUserByExternalAuthId` - Find by Keycloak ID
- `ListUsers` - Paginated user list (admin)
- `GetUserPermissions` - Role-based permissions
- `GetUserStats` - User statistics
- `GetCompany` / `ListCompanies` - Company queries
- `ListSkills` / `GetSkill` - Skill taxonomy queries
- `GetCandidateProfile` / `GetCandidateSkills` - Candidate queries

**Database Tables:**
- `users` - User profiles
- `companies` - Company entities
- `candidate_profiles` - Extended candidate data
- `skills` / `skill_categories` - Skill taxonomy
- `candidate_skills` - Candidate skill self-assessment
- `user_companies` - User-company relationships
- `outbox` - Outbox pattern

---

### Interview Service (Port: 8003)

**Architecture:**
```
src/
├── domain/
│   ├── aggregates/     # InterviewTemplate, Invitation
│   ├── entities/       # Question, Response
│   ├── events/         # Domain events
│   └── value-objects/  # TemplateStatus, InvitationStatus, QuestionType
├── application/
│   ├── commands/       # Templates, Questions, Invitations
│   ├── queries/        # Get/List templates, invitations
│   └── dto/            # Request/Response DTOs
└── infrastructure/
    ├── persistence/    # TypeORM, migrations
    ├── kafka/          # Event handling (producer + consumer)
    ├── messaging/      # OUTBOX pattern
    └── http/
        └── controllers/ # Templates, Invitations
```

**CQRS Commands:**
- `CreateTemplate` - Create interview template
- `UpdateTemplate` - Modify template
- `DeleteTemplate` - Remove template
- `PublishTemplate` - Make template available (draft → active)
- `AddQuestion` / `RemoveQuestion` - Manage questions
- `ReorderQuestions` - Question ordering via drag-and-drop
- `CreateInvitation` - Invite candidate
- `StartInvitation` - Begin interview
- `SubmitResponse` - Record answer
- `CompleteInvitation` - Finish interview (triggers AI analysis)

**CQRS Queries:**
- `GetTemplate` - Single template
- `ListTemplates` - HR's templates
- `GetTemplateQuestions` - Template questions
- `GetInvitation` - Invitation details
- `ListHrInvitations` - HR's sent invitations
- `ListCandidateInvitations` - Candidate's invitations

**Database Tables:**
- `interview_templates` - Interview templates (draft/active/archived)
- `questions` - Template questions with options
- `invitations` - Candidate invitations with analysis results
- `responses` - Interview responses
- `outbox` - Outbox pattern

---

### AI Analysis Service (Port: 8005)

**Architecture:**
```
src/
├── domain/
│   ├── aggregates/     # AnalysisResult
│   ├── entities/       # QuestionAnalysis
│   ├── events/         # Domain events
│   ├── repositories/   # IAnalysisResultRepository
│   └── value-objects/  # Score, Recommendation, AnalysisStatus
├── application/
│   ├── commands/       # AnalyzeInterview, RetryAnalysis
│   ├── queries/        # GetAnalysisResult, ListAnalyses
│   ├── ports/          # IAnalysisEngine, IEventPublisher, IPromptLoader
│   └── dto/
└── infrastructure/
    ├── persistence/    # TypeORM entities, repositories, migrations
    ├── groq/           # GroqAnalysisEngine (LLM adapter)
    ├── kafka/          # Consumer (interview-events), publisher
    └── http/           # Controllers
```

**Key Features:**
- Groq LLM integration (configurable model, default: `openai/gpt-oss-120b`)
- Per-question scoring on 4 criteria: relevance, completeness, clarity, depth
- Overall score (0-100) with recommendation (hire/consider/reject)
- Kafka consumer for `interview-events` with idempotency via `processed_events`
- Sequential processing with 5s rate limit between Groq API calls
- JSON mode for structured LLM responses

See [AI Analysis Service](../03-services/AI_ANALYSIS_SERVICE.md) for full documentation.

---

## Planned Services

### Media Service (Port: 8004)
- Video/audio file storage (MinIO)
- FFmpeg video processing
- Groq Whisper transcription
- Presigned URL generation

### Notification Service
- Email delivery (Resend)
- Template-based notifications
- Webhook integrations for ATS

### Billing Service
- Stripe integration
- Freemium model (Free/Plus/Pro)
- Usage tracking & quotas

---

## Event Flow Examples

### User Registration Flow

```
1. User signs up via Frontend
   │
   ▼
2. Keycloak creates account
   │
   ▼
3. API Gateway receives callback
   │
   ▼
4. API Gateway publishes to user-commands topic
   { type: "user.create", userId: "uuid", externalAuthId: "keycloak-id" }
   │
   ▼
5. User Service receives command
   │
   ▼
6. User Service creates user record
   │
   ▼
7. User Service publishes to user-events topic (OUTBOX)
   { type: "user.created", userId: "uuid", email: "...", roles: [...] }
```

### Interview Analysis Flow

```
1. HR creates template with questions
   │
   ▼
2. HR invites candidate (creates invitation)
   │
   ▼
3. Candidate starts and completes interview
   │
   ▼
4. Interview Service publishes invitation.completed event (OUTBOX → Kafka)
   Includes: all questions + all responses in the event payload
   │
   ▼
5. AI Analysis Service consumes event (idempotency check)
   │
   ▼
6. For each question: Groq LLM analyzes response (5s rate limit)
   │
   ▼
7. Groq LLM generates overall summary
   │
   ▼
8. AI Analysis Service publishes analysis.completed event
   │
   ▼
9. Interview Service consumes event, updates invitation with results
   │
   ▼
10. Frontend displays AI review to HR
```

---

## Database Architecture

### Database Per Service

| Service | Database Name | Port |
|---------|--------------|------|
| User Service | `ai_video_interview_user` | 5432 |
| Interview Service | `ai_video_interview_interview` | 5432 |
| AI Analysis Service | `ai_video_interview_analysis` | 5432 |
| Keycloak | `keycloak` | 5433 |

### Shared Infrastructure

- **Redis (6379)**: BullMQ queues for outbox processing
- **MinIO (9000)**: Shared object storage (avatars, media)
- **Kafka (9092)**: Event bus for all services (KRaft mode, no Zookeeper)

---

## Security Model

### Authentication

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Flow                          │
│                                                                 │
│  1. Frontend → Keycloak login page                             │
│  2. User authenticates with Keycloak                           │
│  3. Keycloak returns tokens to API Gateway (callback)          │
│  4. API Gateway sets httpOnly cookies (access + refresh)       │
│  5. Frontend sends requests with cookies                       │
│  6. API Gateway validates JWT via JWKS                         │
│  7. API Gateway forwards request to service                    │
└─────────────────────────────────────────────────────────────────┘
```

### Authorization (RBAC)

| Role | Capabilities |
|------|-------------|
| **admin** | Full system access, user management, skill taxonomy |
| **hr** | Create templates, invite candidates, view results, manage companies |
| **candidate** | Complete interviews, manage profile & skills |

### Service-to-Service Auth

- Internal services communicate via Kafka (no HTTP auth needed)
- Internal HTTP endpoints protected by `X-Internal-Service-Token`
- API Gateway is the single entry point for external requests

---

## Observability Stack

### Logging

```
Services ──Winston──► Loki (via Promtail) ──► Grafana
                       │
                       └── Structured JSON logs
                           - requestId
                           - userId
                           - service
                           - action
                           - duration
```

### Metrics

```
Services ──Prometheus Client──► Prometheus ──► Grafana
                                    │
                                    └── Metrics:
                                        - http_requests_total
                                        - http_request_duration_seconds
                                        - kafka_messages_processed
                                        - auth_requests_total
                                        - circuit_breaker_state
```

### Tracing

```
Services ──OpenTelemetry──► Jaeger
               │
               └── Distributed traces across:
                   - API Gateway
                   - User Service
                   - Interview Service
                   - AI Analysis Service
                   - Kafka consumers (trace propagation via headers)
```

---

## Development Commands

```bash
# Start infrastructure
npm run infra:up             # PostgreSQL, Redis, MinIO
npm run kafka:up             # Kafka + UI

# Start all services (Turborepo)
npm run dev:all              # All services + web
npm run dev:services         # Backend services only
npm run dev:web              # Frontend only

# Start individual service
npm run dev:api              # API Gateway
npm run dev --filter=user-service
npm run dev --filter=interview-service
npm run dev:analysis         # AI Analysis Service

# Run migrations (from service directory)
npm run migration:run
npm run migration:generate -- src/infrastructure/persistence/migrations/MigrationName

# Testing
npm run test                 # All tests
npm run test --filter=<svc>  # Tests for specific service
```

---

## API Documentation

- **API Gateway Swagger**: http://localhost:8001/api/docs
- **Grafana Dashboards**: http://localhost:3002 (admin/admin123)
- **Jaeger Tracing**: http://localhost:16686
- **MinIO Console**: http://localhost:9001
- **Kafka UI**: http://localhost:8080
- **Keycloak Admin**: http://localhost:8090

---

**Last Updated:** February 2026
