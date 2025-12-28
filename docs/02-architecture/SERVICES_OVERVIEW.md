# Services Overview

This document provides a comprehensive overview of the AI Video Interview platform's microservices architecture.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js 14)                              │
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
│   Port: 3005    │  │   Port: 3007    │  │   Port: 3006    │  │   Port: 3009    │
│   ✅ DONE       │  │   ✅ DONE       │  │   🔴 PLANNED    │  │   🔴 PLANNED    │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │                    │
         └────────────────────┴────────────────────┴────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              KAFKA MESSAGE BUS                                   │
│                                 Port: 9092                                       │
│  Topics: user-commands, user-events, interview-events, media-events, etc.       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│NOTIFICATION SVC │           │ BILLING SERVICE │           │    ANALYTICS    │
│   Port: 3008    │           │   Port: 3010    │           │   (ClickHouse)  │
│   🔴 PLANNED    │           │   🔴 PLANNED    │           │   Port: 8123    │
└─────────────────┘           └─────────────────┘           └─────────────────┘
```

---

## Service Status

| Service | Port | Status | Database | Description |
|---------|------|--------|----------|-------------|
| **API Gateway** | 8001 | ✅ Done | — | Auth, routing, metrics, tracing |
| **User Service** | 3005 | ✅ Done | PostgreSQL | User management, roles, profiles |
| **Interview Service** | 3007 | ✅ Done | PostgreSQL | Templates, questions, invitations |
| **Media Service** | 3006 | 🔴 Planned | PostgreSQL + MinIO | File storage, transcription |
| **AI Analysis Service** | 3009 | 🔴 Planned | PostgreSQL + pgvector | Interview analysis, RAG |
| **Notification Service** | 3008 | 🔴 Planned | PostgreSQL | Email, webhooks |
| **Billing Service** | 3010 | 🔴 Planned | PostgreSQL | Subscriptions, payments |

---

## Infrastructure Services

| Service | Port | Purpose |
|---------|------|---------|
| **PostgreSQL** | 5432 | Primary database |
| **Redis** | 6379 | BullMQ queues, caching |
| **Kafka** | 9092 | Event streaming |
| **Zookeeper** | 2181 | Kafka coordination |
| **Keycloak** | 8090 | Identity & Access Management |
| **MinIO** | 9000/9001 | Object storage (S3-compatible) |
| **ClickHouse** | 8123 | Analytics database |
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3002 | Dashboards & monitoring |
| **Loki** | 3100 | Log aggregation |
| **Jaeger** | 16686 | Distributed tracing |

---

## Technology Stack

### Backend Services

| Layer | Technology |
|-------|------------|
| **Framework** | NestJS 10 |
| **Language** | TypeScript 5.x |
| **ORM** | TypeORM |
| **CQRS** | @nestjs/cqrs |
| **Validation** | class-validator, class-transformer |
| **API Docs** | Swagger/OpenAPI |

### Architecture Patterns

| Pattern | Implementation |
|---------|----------------|
| **Clean Architecture** | Domain → Application → Infrastructure |
| **CQRS** | Commands/Queries separation |
| **DDD** | Aggregates, Value Objects, Domain Events |
| **INBOX/OUTBOX** | Reliable messaging with BullMQ |
| **Event Sourcing** | Kafka event streaming |

### Frontend

| Technology | Version |
|------------|---------|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS |
| **Components** | shadcn/ui |
| **State** | React Query, Zustand |
| **Auth** | NextAuth.js + Keycloak |

---

## Service Communication

### Synchronous (HTTP)

```
Frontend ──HTTP──► API Gateway ──HTTP──► Microservices
                      │
                      ├── /api/users/* ──► User Service (3005)
                      ├── /api/templates/* ──► Interview Service (3007)
                      └── /api/media/* ──► Media Service (3006)
```

### Asynchronous (Kafka)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             KAFKA TOPICS                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  user-commands        API Gateway ──────────────────────► User Service          │
│  (create, update)                                                                │
│                                                                                  │
│  user-events          User Service ────► Interview Service, Notification SVC    │
│  (created, updated)                   └► Billing Service, Analytics             │
│                                                                                  │
│  interview-events     Interview Service ──► Media Service, AI Analysis          │
│  (invitation.created)                   └► Notification Service                  │
│                                                                                  │
│  media-events         Media Service ──────► AI Analysis Service                 │
│  (transcription.ready)                                                           │
│                                                                                  │
│  analysis-events      AI Analysis ────────► Notification Service                │
│  (analysis.completed)                                                            │
│                                                                                  │
│  billing-events       Billing Service ────► All services (quota enforcement)    │
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
│   └── interview-service/ # Interview Service proxy
└── proxies/            # HTTP proxies
```

**Key Features:**
- OAuth2/OIDC authentication via Keycloak
- JWT token validation & refresh
- Circuit breaker for downstream services
- Request/response logging
- Prometheus metrics endpoint
- OpenTelemetry distributed tracing
- Swagger API documentation at `/api/docs`

---

### User Service (Port: 3005)

**Architecture:**
```
src/
├── domain/
│   ├── aggregates/     # User aggregate
│   ├── entities/       # Role, Company, Skill
│   ├── events/         # Domain events
│   ├── repositories/   # Repository interfaces
│   └── value-objects/  # Email, FullName, Status
├── application/
│   ├── commands/       # create-user, update-user, suspend, etc.
│   ├── queries/        # get-user, list-users, get-permissions
│   └── dto/            # Request/Response DTOs
└── infrastructure/
    ├── persistence/    # TypeORM entities, repositories, migrations
    ├── kafka/          # Event consumers/producers
    ├── messaging/      # INBOX/OUTBOX pattern
    ├── http/           # Controllers
    └── storage/        # MinIO avatar storage
```

**CQRS Commands:**
- `CreateUser` - Create new user from Kafka event
- `UpdateUser` - Update user profile
- `SuspendUser` / `ActivateUser` - Account status management
- `SelectRole` - HR/Candidate role selection
- `UploadAvatar` - Profile picture upload

**CQRS Queries:**
- `GetUser` - Get user by ID
- `GetUserByExternalAuthId` - Find by Keycloak ID
- `ListUsers` - Paginated user list (admin)
- `GetUserPermissions` - Role-based permissions

**Database Tables:**
- `users` - User profiles
- `roles` - System roles (admin, hr, candidate)
- `user_roles` - Many-to-many relationship
- `companies` - Company entities
- `skills` - Skill catalog
- `inbox` / `outbox` - Messaging patterns

---

### Interview Service (Port: 3007)

**Architecture:**
```
src/
├── domain/
│   ├── aggregates/     # Template, Invitation
│   ├── entities/       # Question
│   ├── events/         # Domain events
│   └── value-objects/  # Duration, QuestionType
├── application/
│   ├── commands/       # Templates, Questions, Invitations
│   ├── queries/        # Get/List templates, invitations
│   └── dto/            # Request/Response DTOs
└── infrastructure/
    ├── persistence/    # TypeORM, migrations
    ├── kafka/          # Event handling
    ├── messaging/      # INBOX/OUTBOX
    └── http/
        ├── controllers/
        └── modules/    # Templates, Invitations modules
```

**CQRS Commands:**
- `CreateTemplate` - Create interview template
- `UpdateTemplate` - Modify template
- `DeleteTemplate` - Remove template
- `PublishTemplate` - Make template available
- `AddQuestion` / `RemoveQuestion` - Manage questions
- `ReorderQuestions` - Question ordering
- `CreateInvitation` - Invite candidate
- `StartInvitation` - Begin interview
- `SubmitResponse` - Record answer
- `CompleteInvitation` - Finish interview

**CQRS Queries:**
- `GetTemplate` - Single template
- `ListTemplates` - HR's templates
- `GetTemplateQuestions` - Template questions
- `GetInvitation` - Invitation details
- `ListHrInvitations` - HR's sent invitations
- `ListCandidateInvitations` - Candidate's invitations

**Database Tables:**
- `templates` - Interview templates
- `questions` - Template questions
- `invitations` - Candidate invitations
- `responses` - Interview responses
- `inbox` / `outbox` - Messaging patterns

---

## Planned Services

### Media Service (Port: 3006)
- Video/audio file storage (MinIO)
- FFmpeg video processing
- Groq Whisper transcription
- Presigned URL generation

### AI Analysis Service (Port: 3009)
- Groq LLama 3.3 70B for analysis
- RAG pipeline with pgvector
- Interview scoring & feedback
- Candidate comparison

### Notification Service (Port: 3008)
- Email delivery (Resend)
- Template-based notifications
- Webhook integrations

### Billing Service (Port: 3010)
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
   { type: "CREATE_USER", userId: "uuid", externalAuthId: "keycloak-id" }
   │
   ▼
5. User Service (INBOX) receives command
   │
   ▼
6. User Service creates user record
   │
   ▼
7. User Service publishes to user-events topic (OUTBOX)
   { type: "user.created", userId: "uuid", email: "...", roles: [...] }
   │
   ▼
8. Interview Service, Billing Service consume event
```

### Interview Invitation Flow

```
1. HR creates template with questions
   │
   ▼
2. HR invites candidate (email)
   │
   ▼
3. Interview Service publishes invitation.created event
   │
   ▼
4. Notification Service sends email
   │
   ▼
5. Candidate clicks link, starts interview
   │
   ▼
6. Candidate records responses
   │
   ▼
7. Media Service stores videos, triggers transcription
   │
   ▼
8. AI Analysis Service analyzes responses
   │
   ▼
9. HR receives notification: analysis ready
```

---

## Database Architecture

### Database Per Service

| Service | Database Name | Port |
|---------|--------------|------|
| User Service | `ai_video_interview_user` | 5432 |
| Interview Service | `ai_video_interview_interview` | 5432 |
| Media Service | `ai_video_interview_media` | 5432 |
| AI Analysis Service | `ai_video_interview_analysis` | 5432 |
| Billing Service | `ai_video_interview_billing` | 5432 |
| Notification Service | `ai_video_interview_notification` | 5432 |

### Shared Infrastructure

- **Redis (6379)**: BullMQ queues for all services
- **MinIO (9000)**: Shared object storage
- **Kafka (9092)**: Event bus for all services

---

## Security Model

### Authentication

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Flow                          │
│                                                                 │
│  1. Frontend → Keycloak login page                             │
│  2. User authenticates with Keycloak                           │
│  3. Keycloak returns tokens to Frontend                        │
│  4. Frontend sends JWT to API Gateway                          │
│  5. API Gateway validates JWT with Keycloak                    │
│  6. API Gateway forwards request to service                    │
└─────────────────────────────────────────────────────────────────┘
```

### Authorization (RBAC)

| Role | Capabilities |
|------|-------------|
| **admin** | Full system access, user management |
| **hr** | Create templates, invite candidates, view results |
| **candidate** | Complete interviews, view own profile |

### Service-to-Service Auth

- Internal services communicate via Kafka (no HTTP auth needed)
- Internal HTTP endpoints protected by `X-Internal-Service-Token`
- API Gateway is the single entry point for external requests

---

## Observability Stack

### Logging

```
Services ──Winston──► Loki ──► Grafana
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
                                        - database_query_duration
```

### Tracing

```
Services ──OpenTelemetry──► Jaeger
               │
               └── Distributed traces across:
                   - API Gateway
                   - User Service
                   - Interview Service
                   - Kafka consumers
```

---

## Development Commands

```bash
# Start infrastructure
docker-compose up -d

# Start all services (Turborepo)
npm run dev

# Start individual service
npm run dev --filter=api-gateway
npm run dev --filter=user-service
npm run dev --filter=interview-service

# Run migrations
npm run migration:run --filter=user-service
npm run migration:run --filter=interview-service

# Generate migration
npm run migration:generate --filter=user-service -- -n MigrationName

# View logs
docker-compose logs -f loki grafana
```

---

## API Documentation

- **API Gateway Swagger**: http://localhost:8001/api/docs
- **Grafana Dashboards**: http://localhost:3002 (admin/admin123)
- **Jaeger Tracing**: http://localhost:16686
- **MinIO Console**: http://localhost:9001

---

**Last Updated:** December 2024
