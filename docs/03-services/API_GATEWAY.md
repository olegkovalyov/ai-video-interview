# API Gateway

**Status:** ✅ Implemented  
**Port:** 8001  
**Technology Stack:** NestJS, Keycloak, Winston, Prometheus, OpenTelemetry  
**Database:** None (stateless)

---

## Overview

API Gateway is the single entry point for all external requests to the AI Video Interview platform. It handles authentication, request routing, metrics collection, and distributed tracing.

**Key Responsibilities:**
- OAuth2/OIDC authentication via Keycloak
- JWT token validation and refresh
- Request routing to microservices
- Circuit breaker pattern for resilience
- Prometheus metrics exposure
- OpenTelemetry distributed tracing
- Structured logging with Loki integration

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY (8001)                                   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Core Infrastructure                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │   Auth   │  │ Logging  │  │ Metrics  │  │ Tracing  │  │ Circuit  │  │   │
│  │  │(Keycloak)│  │ (Winston)│  │(Promethe)│  │ (OTel)   │  │ Breaker  │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Service Modules                                  │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────┐    ┌─────────────────────────┐            │   │
│  │  │    User Service Module  │    │ Interview Service Module │            │   │
│  │  │  ┌───────────────────┐  │    │  ┌───────────────────┐   │            │   │
│  │  │  │ Users Controller  │  │    │  │Templates Controller│   │            │   │
│  │  │  │ HR Controller     │  │    │  │Invitations Control.│   │            │   │
│  │  │  │ Skills Controller │  │    │  └───────────────────┘   │            │   │
│  │  │  │ Admin Controllers │  │    │                          │            │   │
│  │  │  └───────────────────┘  │    │                          │            │   │
│  │  └─────────────────────────┘    └─────────────────────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            Kafka Module                                  │   │
│  │                    (Event Publishing to Services)                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    User Service       Interview Service      Keycloak
      (3005)              (3007)               (8090)
```

---

## Project Structure

```
src/
├── core/
│   ├── auth/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts      # /auth/* endpoints
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts       # JWT validation
│   │   │   ├── jwt-refresh.guard.ts    # Refresh token validation
│   │   │   ├── roles.guard.ts          # RBAC enforcement
│   │   │   └── roles.decorator.ts      # @Roles() decorator
│   │   ├── interceptors/
│   │   │   └── auth-error.interceptor.ts
│   │   ├── sagas/
│   │   │   └── registration.saga.ts    # Ensure user exists flow
│   │   ├── services/
│   │   │   ├── auth-orchestrator.service.ts  # Main auth orchestration
│   │   │   ├── session-manager.service.ts    # Session management
│   │   │   ├── auth-event-publisher.service.ts
│   │   │   ├── token.service.ts              # JWT operations
│   │   │   ├── cookie.service.ts             # Cookie management
│   │   │   ├── oidc.service.ts               # OIDC discovery
│   │   │   ├── keycloak.service.ts           # Keycloak API
│   │   │   └── redirect-uri.helper.ts
│   │   └── auth.module.ts
│   │
│   ├── circuit-breaker/
│   │   ├── circuit-breaker.service.ts
│   │   ├── circuit-breaker.interceptor.ts
│   │   └── circuit-breaker.module.ts
│   │
│   ├── health/
│   │   ├── health.controller.ts        # /health endpoints
│   │   └── health.module.ts
│   │
│   ├── logging/
│   │   ├── logger.service.ts           # Winston + Loki
│   │   └── logging.module.ts
│   │
│   ├── metrics/
│   │   ├── metrics.service.ts          # Prometheus client
│   │   ├── metrics.controller.ts       # /metrics endpoint
│   │   ├── metrics.interceptor.ts
│   │   └── metrics.module.ts
│   │
│   └── tracing/
│       ├── tracing.ts                  # OpenTelemetry setup
│       └── tracing.module.ts
│
├── kafka/
│   ├── producers/
│   │   └── user-command.producer.ts
│   └── kafka.module.ts
│
├── modules/
│   ├── user-service/
│   │   ├── admin/
│   │   │   ├── controllers/
│   │   │   │   ├── admin-users.controller.ts
│   │   │   │   ├── admin-actions.controller.ts
│   │   │   │   ├── admin-roles.controller.ts
│   │   │   │   └── admin-skills.controller.ts
│   │   │   ├── keycloak/
│   │   │   │   └── keycloak-admin.service.ts
│   │   │   ├── user-orchestration.saga.ts
│   │   │   └── admin.module.ts
│   │   ├── controllers/
│   │   │   ├── users.controller.ts
│   │   │   ├── hr.controller.ts
│   │   │   ├── hr-companies.controller.ts
│   │   │   ├── skills.controller.ts
│   │   │   └── user-skills.controller.ts
│   │   ├── clients/
│   │   │   └── user-service.client.ts
│   │   └── user-service.module.ts
│   │
│   └── interview-service/
│       ├── controllers/
│       │   ├── templates.controller.ts
│       │   └── invitations.controller.ts
│       ├── clients/
│       │   └── interview-service.client.ts
│       └── interview-service.module.ts
│
├── app.module.ts
└── main.ts
```

---

## Authentication Flow

### Login Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OAuth2 Login Flow                                     │
│                                                                                 │
│  1. Frontend: GET /auth/login                                                  │
│     │                                                                          │
│     ▼                                                                          │
│  2. API Gateway generates auth URL with:                                       │
│     - client_id, redirect_uri, scope, state, nonce                            │
│     │                                                                          │
│     ▼                                                                          │
│  3. User redirected to Keycloak login page                                    │
│     │                                                                          │
│     ▼                                                                          │
│  4. User authenticates with Keycloak                                          │
│     │                                                                          │
│     ▼                                                                          │
│  5. Keycloak redirects to /auth/callback?code=xxx&state=yyy                   │
│     │                                                                          │
│     ▼                                                                          │
│  6. API Gateway exchanges code for tokens                                     │
│     │                                                                          │
│     ▼                                                                          │
│  7. RegistrationSaga: Ensure user exists in User Service                      │
│     - GET /internal/users/by-external-auth/{keycloakId}                       │
│     - If not found: Publish CREATE_USER command to Kafka                      │
│     │                                                                          │
│     ▼                                                                          │
│  8. Set JWT tokens in HTTP-only cookies                                       │
│     │                                                                          │
│     ▼                                                                          │
│  9. Redirect to frontend with success                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Token Refresh Flow                                    │
│                                                                                 │
│  1. Frontend: POST /auth/refresh (with refresh_token cookie)                   │
│     │                                                                          │
│     ▼                                                                          │
│  2. JwtRefreshGuard validates refresh token                                    │
│     │                                                                          │
│     ▼                                                                          │
│  3. API Gateway requests new tokens from Keycloak                              │
│     │                                                                          │
│     ▼                                                                          │
│  4. New tokens set in cookies                                                  │
│     │                                                                          │
│     ▼                                                                          │
│  5. Return user info                                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Authentication (`/auth/*`)

| Method | Endpoint | Guard | Description |
|--------|----------|-------|-------------|
| `GET` | `/auth/login` | — | Initiate OAuth2 login |
| `GET` | `/auth/callback` | — | OAuth2 callback handler |
| `POST` | `/auth/refresh` | JwtRefreshGuard | Refresh access token |
| `POST` | `/auth/logout` | JwtAuthGuard | Logout and clear tokens |
| `GET` | `/auth/me` | JwtAuthGuard | Get current user info |

### Users (`/api/users/*`)

| Method | Endpoint | Guard | Roles | Description |
|--------|----------|-------|-------|-------------|
| `GET` | `/api/users/me` | JwtAuth | Any | Get current user profile |
| `PUT` | `/api/users/me` | JwtAuth | Any | Update current user |
| `POST` | `/api/users/me/avatar` | JwtAuth | Any | Upload avatar |
| `DELETE` | `/api/users/me/avatar` | JwtAuth | Any | Remove avatar |
| `POST` | `/api/users/select-role` | JwtAuth | Any | Select HR/Candidate role |

### HR (`/api/hr/*`)

| Method | Endpoint | Guard | Roles | Description |
|--------|----------|-------|-------|-------------|
| `GET` | `/api/hr/profile` | JwtAuth | hr | Get HR profile |
| `PUT` | `/api/hr/profile` | JwtAuth | hr | Update HR profile |
| `GET` | `/api/hr/companies` | JwtAuth | hr | List companies |
| `POST` | `/api/hr/companies` | JwtAuth | hr | Create company |
| `PUT` | `/api/hr/companies/:id` | JwtAuth | hr | Update company |
| `DELETE` | `/api/hr/companies/:id` | JwtAuth | hr | Delete company |

### Candidate (`/api/candidate/*`)

| Method | Endpoint | Guard | Roles | Description |
|--------|----------|-------|-------|-------------|
| `GET` | `/api/candidate/profile` | JwtAuth | candidate | Get candidate profile |
| `PUT` | `/api/candidate/profile` | JwtAuth | candidate | Update candidate profile |
| `GET` | `/api/candidate/skills` | JwtAuth | candidate | Get candidate skills |
| `POST` | `/api/candidate/skills` | JwtAuth | candidate | Add skill |
| `DELETE` | `/api/candidate/skills/:id` | JwtAuth | candidate | Remove skill |

### Skills (`/api/skills/*`)

| Method | Endpoint | Guard | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/skills` | JwtAuth | List all skills (catalog) |
| `GET` | `/api/skills/search` | JwtAuth | Search skills |

### Admin - Users (`/api/admin/users/*`)

| Method | Endpoint | Guard | Roles | Description |
|--------|----------|-------|-------|-------------|
| `GET` | `/api/admin/users` | JwtAuth | admin | List all users (paginated) |
| `GET` | `/api/admin/users/:id` | JwtAuth | admin | Get user by ID |
| `POST` | `/api/admin/users` | JwtAuth | admin | Create user (Keycloak + DB) |
| `PUT` | `/api/admin/users/:id` | JwtAuth | admin | Update user |
| `DELETE` | `/api/admin/users/:id` | JwtAuth | admin | Delete user |

### Admin - Actions (`/api/admin/users/:id/*`)

| Method | Endpoint | Guard | Roles | Description |
|--------|----------|-------|-------|-------------|
| `POST` | `/api/admin/users/:id/suspend` | JwtAuth | admin | Suspend user |
| `POST` | `/api/admin/users/:id/activate` | JwtAuth | admin | Activate user |
| `POST` | `/api/admin/users/:id/roles` | JwtAuth | admin | Assign role |
| `DELETE` | `/api/admin/users/:id/roles/:roleId` | JwtAuth | admin | Remove role |

### Admin - Skills (`/api/admin/skills/*`)

| Method | Endpoint | Guard | Roles | Description |
|--------|----------|-------|-------|-------------|
| `GET` | `/api/admin/skills` | JwtAuth | admin | List all skills |
| `POST` | `/api/admin/skills` | JwtAuth | admin | Create skill |
| `PUT` | `/api/admin/skills/:id` | JwtAuth | admin | Update skill |
| `DELETE` | `/api/admin/skills/:id` | JwtAuth | admin | Delete skill |

### Templates (`/api/templates/*`)

| Method | Endpoint | Guard | Roles | Description |
|--------|----------|-------|-------|-------------|
| `GET` | `/api/templates` | JwtAuth | hr, admin | List templates |
| `GET` | `/api/templates/:id` | JwtAuth | hr, admin | Get template |
| `POST` | `/api/templates` | JwtAuth | hr, admin | Create template |
| `PUT` | `/api/templates/:id` | JwtAuth | hr, admin | Update template |
| `DELETE` | `/api/templates/:id` | JwtAuth | hr, admin | Delete template |
| `POST` | `/api/templates/:id/publish` | JwtAuth | hr, admin | Publish template |
| `POST` | `/api/templates/:id/questions` | JwtAuth | hr, admin | Add question |
| `PUT` | `/api/templates/:id/questions/:qId` | JwtAuth | hr, admin | Update question |
| `DELETE` | `/api/templates/:id/questions/:qId` | JwtAuth | hr, admin | Remove question |
| `PUT` | `/api/templates/:id/questions/reorder` | JwtAuth | hr, admin | Reorder questions |

### Invitations (`/api/invitations/*`)

| Method | Endpoint | Guard | Roles | Description |
|--------|----------|-------|-------|-------------|
| `GET` | `/api/invitations` | JwtAuth | hr | List HR's invitations |
| `GET` | `/api/invitations/candidate` | JwtAuth | candidate | Candidate's invitations |
| `GET` | `/api/invitations/:id` | JwtAuth | hr, candidate | Get invitation |
| `POST` | `/api/invitations` | JwtAuth | hr | Create invitation |
| `POST` | `/api/invitations/:id/start` | JwtAuth | candidate | Start interview |
| `POST` | `/api/invitations/:id/responses` | JwtAuth | candidate | Submit response |
| `POST` | `/api/invitations/:id/complete` | JwtAuth | candidate | Complete interview |

### Health (`/health/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Basic health check |
| `GET` | `/health/live` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe |

### Metrics & Docs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/metrics` | Prometheus metrics |
| `GET` | `/api/docs` | Swagger UI |
| `GET` | `/api/docs-json` | OpenAPI JSON spec |

---

## Kafka Integration

### Published Events

| Topic | Event | Trigger |
|-------|-------|---------|
| `user-commands` | `CREATE_USER` | New user login (RegistrationSaga) |
| `user-commands` | `UPDATE_USER` | User profile update |
| `user-commands` | `DELETE_USER` | User deletion |
| `user-commands` | `SUSPEND_USER` | User suspension |
| `user-commands` | `ACTIVATE_USER` | User activation |

### Event Schema

**CREATE_USER Command:**
```json
{
  "type": "CREATE_USER",
  "payload": {
    "userId": "uuid (generated by API Gateway)",
    "externalAuthId": "keycloak-user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "metadata": {
    "timestamp": "2025-01-01T00:00:00Z",
    "correlationId": "uuid",
    "source": "api-gateway"
  }
}
```

---

## Configuration

### Environment Variables

```bash
# Application
PORT=8001
NODE_ENV=development

# Keycloak
KEYCLOAK_URL=http://localhost:8090
KEYCLOAK_REALM=ai-interview
KEYCLOAK_CLIENT_ID=ai-interview-api
KEYCLOAK_CLIENT_SECRET=your-secret
KEYCLOAK_ADMIN_CLIENT_ID=admin-cli
KEYCLOAK_ADMIN_CLIENT_SECRET=admin-secret

# Frontend
NEXT_PUBLIC_WEB_ORIGIN=http://localhost:3000
AUTH_CALLBACK_URL=http://localhost:8001/auth/callback

# Microservices
USER_SERVICE_URL=http://localhost:3005
INTERVIEW_SERVICE_URL=http://localhost:3007

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=api-gateway

# Observability
LOG_LEVEL=debug
LOKI_HOST=http://localhost:3100
JAEGER_ENDPOINT=http://localhost:4318/v1/traces
```

---

## Guards & Decorators

### JwtAuthGuard

Validates access token from cookies or Authorization header.

```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute() {}
```

### RolesGuard + @Roles()

Enforces role-based access control.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'hr')
@Get('admin-only')
async adminRoute() {}
```

### @CurrentUser()

Extracts current user from request.

```typescript
@Get('me')
async getMe(@CurrentUser() user: UserPayload) {
  return user;
}
```

---

## Circuit Breaker

Protects against downstream service failures.

```typescript
// Configuration
{
  failureThreshold: 5,      // Failures before opening
  successThreshold: 3,      // Successes to close
  timeout: 30000,           // Time before half-open (ms)
}

// States:
// CLOSED → Normal operation
// OPEN → All requests fail fast
// HALF_OPEN → Test requests allowed
```

---

## Metrics

### Prometheus Metrics Exposed

```
# HTTP Requests
http_requests_total{method, path, status}
http_request_duration_seconds{method, path}

# Authentication
auth_login_total{status}
auth_refresh_total{status}
auth_logout_total

# Circuit Breaker
circuit_breaker_state{service}
circuit_breaker_failures_total{service}

# Kafka
kafka_messages_published_total{topic}
```

---

## Logging

### Log Structure

```json
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "level": "info",
  "service": "api-gateway",
  "requestId": "uuid",
  "userId": "uuid",
  "action": "auth.login",
  "message": "User logged in successfully",
  "duration": 150,
  "metadata": {}
}
```

### Log Levels

| Level | Use Case |
|-------|----------|
| `error` | Exceptions, failures |
| `warn` | Degraded states, retries |
| `info` | Business events, requests |
| `debug` | Detailed debugging |

---

## Tracing

OpenTelemetry distributed tracing with Jaeger.

```
Trace spans:
├── HTTP Request (api-gateway)
│   ├── Auth validation
│   ├── HTTP call to user-service
│   │   └── Database query
│   └── Kafka publish
```

View traces at: http://localhost:16686

---

## Error Handling

### Standard Error Response

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/api/users/me"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |
| 502 | Bad Gateway - Downstream service error |
| 503 | Service Unavailable - Circuit open |

---

## Development

### Running Locally

```bash
# Start dependencies
docker-compose up -d postgres redis kafka keycloak

# Start API Gateway
npm run dev --filter=api-gateway

# View Swagger docs
open http://localhost:8001/api/docs
```

### Testing Auth Flow

```bash
# 1. Get login URL
curl http://localhost:8001/auth/login

# 2. Complete login in browser

# 3. Check authenticated endpoint
curl http://localhost:8001/api/users/me \
  -H "Cookie: access_token=..."
```

---

**Last Updated:** December 2024
