# AI Video Interview Platform

A scalable platform for asynchronous AI-powered video interviews built with modern microservices architecture.

## Features

- **Asynchronous Video Interviews** — Candidates record responses at their convenience
- **AI-Powered Analysis** — Automatic transcription and interview scoring (Groq LLama 3.3 70B)
- **Template Management** — HR creates reusable interview templates with questions
- **Multi-tenant** — Support for multiple companies and HR managers
- **Role-based Access** — Admin, HR, and Candidate roles
- **Real-time Notifications** — Email notifications for interview invitations

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js 14)                             │
│                               Port: 3000                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY (8001)                               │
│         Auth (Keycloak) │ Metrics │ Tracing │ Circuit Breaker              │
└─────────────────────────────────────────────────────────────────────────────┘
        │                    │                    │                    │
        ▼                    ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ User Service │    │  Interview   │    │    Media     │    │ AI Analysis  │
│    (3005)    │    │   Service    │    │   Service    │    │   Service    │
│   ✅ Done    │    │    (3007)    │    │    (3006)    │    │    (3009)    │
│              │    │   ✅ Done    │    │  🔴 Planned  │    │  🔴 Planned  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │                    │
        └────────────────────┴────────────────────┴────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KAFKA (9092)                                      │
│    Topics: user-commands, user-events, interview-events, media-events      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Service Status

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| API Gateway | 8001 | ✅ Done | Auth, routing, metrics, tracing |
| User Service | 3005 | ✅ Done | Users, roles, companies, skills |
| Interview Service | 3007 | ✅ Done | Templates, questions, invitations |
| Media Service | 3006 | 🔴 Planned | File storage, transcription |
| AI Analysis Service | 3009 | 🔴 Planned | Interview analysis, RAG |
| Notification Service | 3008 | 🔴 Planned | Email, webhooks |
| Billing Service | 3010 | 🔴 Planned | Subscriptions, payments |

---

## Tech Stack

### Backend
- **Framework:** NestJS 10
- **Language:** TypeScript 5.x
- **ORM:** TypeORM
- **Architecture:** Clean Architecture, CQRS, DDD
- **Messaging:** Kafka with INBOX/OUTBOX pattern
- **Queue:** BullMQ (Redis)

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **State:** React Query

### Infrastructure
- **Database:** PostgreSQL 15
- **Cache/Queue:** Redis 7
- **Object Storage:** MinIO (S3-compatible)
- **Auth:** Keycloak
- **Monitoring:** Prometheus, Grafana, Loki
- **Tracing:** OpenTelemetry, Jaeger

---

## Quick Start

### Prerequisites

```bash
Node.js 18+
npm 10+
Docker & Docker Compose
```

### 1. Clone and Install

```bash
git clone <repository-url>
cd ai-video-interview

npm install
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

### 3. Configure Environment

```bash
# Copy env files for each service
cp apps/api-gateway/.env.example apps/api-gateway/.env
cp apps/user-service/.env.example apps/user-service/.env
cp apps/interview-service/.env.example apps/interview-service/.env
```

### 4. Run Migrations

```bash
npm run migration:run --filter=user-service
npm run migration:run --filter=interview-service
```

### 5. Start Development

```bash
# Start all services
npm run dev

# Or start specific service
npm run dev --filter=api-gateway
npm run dev --filter=user-service
npm run dev --filter=interview-service
npm run dev --filter=web
```

---

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Web App** | http://localhost:3000 | — |
| **API Gateway** | http://localhost:8001 | — |
| **Swagger Docs** | http://localhost:8001/api/docs | — |
| **Keycloak** | http://localhost:8090 | admin/admin |
| **Grafana** | http://localhost:3002 | admin/admin123 |
| **Jaeger** | http://localhost:16686 | — |
| **MinIO Console** | http://localhost:9001 | minioadmin/minioadmin123 |

---

## Project Structure

```
ai-video-interview/
├── apps/
│   ├── api-gateway/           # API Gateway (NestJS)
│   ├── user-service/          # User Service (NestJS + DDD + CQRS)
│   ├── interview-service/     # Interview Service (NestJS + DDD + CQRS)
│   ├── media-service/         # Media Service (planned)
│   └── web/                   # Frontend (Next.js 14)
│
├── packages/
│   ├── shared/                # Shared types, events, Kafka
│   ├── ui/                    # Shared UI components
│   ├── eslint-config/         # ESLint config
│   └── typescript-config/     # TypeScript config
│
├── infra/
│   ├── keycloak/              # Keycloak realm & theme
│   ├── observability/         # Grafana, Loki, Prometheus
│   └── postgres/              # Database init scripts
│
├── docs/
│   ├── 01-getting-started/    # Quick start guides
│   ├── 02-architecture/       # Architecture overview
│   ├── 03-services/           # Service documentation
│   └── 04-api/                # API documentation
│
├── scripts/                   # Utility scripts
├── docker-compose.yml         # Infrastructure services
└── turbo.json                 # Turborepo config
```

---

## Development Commands

```bash
# Development
npm run dev                    # Start all services
npm run dev --filter=web       # Start specific service
npm run build                  # Build all packages
npm run lint                   # Lint all packages
npm run test                   # Run tests

# Database
npm run migration:run --filter=user-service
npm run migration:generate --filter=user-service -- -n MigrationName

# Infrastructure
docker-compose up -d           # Start all infrastructure
docker-compose down            # Stop all infrastructure
docker-compose logs -f kafka   # View specific logs

# Utilities
npm run cleanup:ports          # Kill processes on service ports
```

---

## Kafka Topics

| Topic | Publisher | Consumers |
|-------|-----------|-----------|
| `user-commands` | API Gateway | User Service |
| `user-events` | User Service | Interview, Notification, Billing |
| `interview-events` | Interview Service | Media, AI Analysis, Notification |
| `media-events` | Media Service | AI Analysis |
| `analysis-events` | AI Analysis | Notification |
| `billing-events` | Billing Service | All services |

---

## Documentation

Detailed documentation available in `/docs`:

- [Quick Start](./docs/01-getting-started/QUICK_START.md)
- [Services Overview](./docs/02-architecture/SERVICES_OVERVIEW.md)
- [API Gateway](./docs/03-services/API_GATEWAY.md)
- [User Service](./docs/03-services/USER_SERVICE.md)
- [Interview Service](./docs/03-services/INTERVIEW_SERVICE.md)

---

## License

MIT
