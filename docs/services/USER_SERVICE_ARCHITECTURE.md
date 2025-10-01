# 👤 USER SERVICE - Architecture Specification

> **Версия:** 1.0 | **Обновлено:** 2025-10-01 | **Статус:** In Development

## 📋 Quick Navigation

- [Service Overview](#service-overview)
- [Architecture Layers](#architecture-layers)
- [Database Schema](#database-schema)
- [API Contracts](#api-contracts)
- [Event Contracts](#event-contracts)
- [Domain Model](#domain-model)
- [Project Structure](#project-structure)
- [Security & RBAC](#security--rbac)
- [Integration Points](#integration-points)
- [Configuration](#configuration)

---

## 🎯 Service Overview

**User Service** - микросервис управления пользователями, профилями, ролями и разрешениями.

### Core Responsibilities

✅ User CRUD (create, read, update, soft delete)  
✅ Profile Management (avatar, bio, preferences)  
✅ RBAC (roles, permissions, assignments)  
✅ User Status (active, suspended, deleted)  
✅ Analytics & Stats

### Out of Scope

❌ Authentication (API Gateway)  
❌ Billing (Billing Service)  
❌ Notifications (Notification Service)

### Tech Stack

- **Framework:** NestJS + TypeScript
- **Database:** PostgreSQL + TypeORM
- **Messaging:** Kafka (KafkaJS)
- **Storage:** MinIO (S3-compatible)
- **Architecture:** CQRS + DDD + Clean Architecture

---

## 🏗️ Architecture Layers

### Layer Overview

```
┌─────────────────────────────────┐
│   PRESENTATION (HTTP/REST)      │  Controllers, Guards, Decorators
├─────────────────────────────────┤
│   APPLICATION (CQRS)            │  Commands, Queries, Handlers, DTOs
├─────────────────────────────────┤
│   DOMAIN (DDD)                  │  Aggregates, VOs, Events, Interfaces
├─────────────────────────────────┤
│   INFRASTRUCTURE                │  TypeORM, Kafka, MinIO, Mappers
└─────────────────────────────────┘
```

### CQRS Flow

**Commands (Write):** `HTTP → CommandBus → Handler → Aggregate → Repository → EventBus → Kafka`

**Queries (Read):** `HTTP → QueryBus → Handler → ReadRepository → DTO`

---

## 📊 Database Schema

### users table
```sql
id                UUID PRIMARY KEY
keycloak_id       VARCHAR(255) UNIQUE NOT NULL INDEX
email             VARCHAR(255) UNIQUE NOT NULL INDEX
first_name        VARCHAR(100) NOT NULL
last_name         VARCHAR(100) NOT NULL
avatar_url        TEXT NULL
bio               TEXT NULL
phone             VARCHAR(50) NULL
status            ENUM('active','suspended','deleted') DEFAULT 'active' INDEX
email_verified    BOOLEAN DEFAULT FALSE
last_login_at     TIMESTAMP NULL
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
deleted_at        TIMESTAMP NULL
metadata          JSONB DEFAULT '{}'
```

### roles table
```sql
id                UUID PRIMARY KEY
name              VARCHAR(50) UNIQUE NOT NULL
display_name      VARCHAR(100) NOT NULL
permissions       JSONB NOT NULL DEFAULT '[]'
created_at        TIMESTAMP DEFAULT NOW()
```

### user_roles table
```sql
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
role_id           UUID REFERENCES roles(id) ON DELETE CASCADE
assigned_by       UUID REFERENCES users(id) NULL
UNIQUE(user_id, role_id)
```

### processed_events table (Kafka Idempotency)
```sql
event_id          VARCHAR(255) NOT NULL
service_name      VARCHAR(100) NOT NULL
event_type        VARCHAR(100) NOT NULL
payload           JSONB NULL
processed_at      TIMESTAMP DEFAULT NOW()
UNIQUE(event_id, service_name)
```

---

## 🚀 API Contracts

**Base:** `/api/v1/users`

### User Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me` | User | Get current user |
| PUT | `/users/me` | User | Update profile |
| POST | `/users/me/avatar` | User | Upload avatar |
| DELETE | `/users/me/avatar` | User | Delete avatar |
| GET | `/users/me/preferences` | User | Get preferences |
| PUT | `/users/me/preferences` | User | Update preferences |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Admin | List users (paginated) |
| GET | `/users/:id` | Admin | Get user by ID |
| PUT | `/users/:id` | Admin | Update user |
| DELETE | `/users/:id` | Admin | Soft delete user |
| GET | `/users/:id/roles` | Admin | Get user roles |
| POST | `/users/:id/roles` | Admin | Assign role |
| DELETE | `/users/:id/roles/:roleId` | Admin | Remove role |
| GET | `/users/stats` | Admin | Get statistics |

### Internal Endpoints (Service-to-Service)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/internal/users/by-keycloak/:id` | Get by Keycloak ID |
| GET | `/internal/users/:id/permissions` | Get permissions |

### Response Examples

**GET /users/me:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "https://...",
  "status": "active",
  "roles": ["Candidate"],
  "createdAt": "2025-01-01T00:00:00Z"
}
```

**GET /users (List):**
```json
{
  "data": [...users],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## 📡 Event Contracts

### Producer: `user-events` topic

#### user.created
```json
{
  "eventType": "user.created",
  "eventId": "uuid",
  "timestamp": "ISO-8601",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "keycloakId": "keycloak-uuid",
    "roles": ["Candidate"]
  }
}
```

#### user.updated
```json
{
  "eventType": "user.updated",
  "eventId": "uuid",
  "data": {
    "userId": "uuid",
    "changes": { "firstName": "New" },
    "updatedBy": "admin-id"
  }
}
```

#### user.deleted
```json
{
  "eventType": "user.deleted",
  "eventId": "uuid",
  "data": {
    "userId": "uuid",
    "deletedBy": "admin-id"
  }
}
```

#### user.role_assigned
```json
{
  "eventType": "user.role_assigned",
  "eventId": "uuid",
  "data": {
    "userId": "uuid",
    "roleId": "uuid",
    "roleName": "HR",
    "assignedBy": "admin-id"
  }
}
```

### Consumer: `auth-events` topic

#### user_authenticated
```json
{
  "eventType": "user_authenticated",
  "data": {
    "keycloakId": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```
**Action:** Create user if not exists

#### user_logged_in
```json
{
  "eventType": "user_logged_in",
  "data": {
    "userId": "uuid",
    "timestamp": "ISO-8601"
  }
}
```
**Action:** Update `last_login_at`

---

## 🧬 Domain Model

### Aggregates

**User (Aggregate Root)**
- Business logic for user lifecycle
- State management (active/suspended/deleted)
- Domain event generation
- Invariant protection

**Methods:**
- `create()`, `reconstitute()`
- `updateProfile()`, `changeEmail()`
- `suspend()`, `activate()`, `delete()`
- `uploadAvatar()`, `verifyEmail()`

### Value Objects

**Email:** Validation, normalization, immutability  
**FullName:** firstName + lastName validation  
**UserStatus:** Type-safe enum (active/suspended/deleted)

### Domain Events

- UserCreatedEvent
- UserUpdatedEvent
- UserSuspendedEvent
- UserDeletedEvent
- RoleAssignedEvent
- RoleRemovedEvent

---

## 📁 Project Structure

```
src/
├── domain/                    # Business Logic
│   ├── aggregates/
│   ├── value-objects/
│   ├── events/
│   ├── repositories/         # Interfaces
│   └── exceptions/
│
├── application/              # Use Cases (CQRS)
│   ├── commands/             # Write operations
│   ├── queries/              # Read operations
│   ├── dto/
│   └── event-handlers/
│
├── infrastructure/           # Technical Details
│   ├── persistence/          # TypeORM
│   ├── kafka/                # Messaging
│   ├── storage/              # MinIO
│   └── http/                 # Controllers, Guards
│
├── shared/                   # Cross-cutting
│   ├── base/
│   ├── exceptions/
│   ├── filters/
│   └── interceptors/
│
└── config/                   # Configuration
```

---

## 🔐 Security & RBAC

### Roles

| Role | Permissions | Description |
|------|-------------|-------------|
| **Admin** | `*` (all) | Full system access |
| **HR** | `users:read`, `interviews:*`, `candidates:*` | Manage interviews |
| **Candidate** | `users:read_own`, `users:write_own`, `interviews:take` | Take interviews |
| **Viewer** | `users:read`, `interviews:read`, `analytics:view` | Read-only |

### Permission Format

`resource:action` (e.g., `users:read`, `interviews:*`)

---

## 🔗 Integration Points

### With API Gateway
- `GET /internal/users/by-keycloak/:id` - User lookup after auth
- `GET /internal/users/:id/permissions` - Authorization checks

### With Other Services (via Kafka)
- **Interview Service** - listens to `user.created` for validation
- **Notification Service** - listens to `user.created` for welcome email
- **Billing Service** - listens to `user.created` for trial setup

---

## ⚙️ Configuration

### Environment Variables

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=user_service_db
DATABASE_USER=user_service
DATABASE_PASSWORD=<secret>

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=user-service
KAFKA_CONSUMER_GROUP=user-service-group

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=<key>
MINIO_SECRET_KEY=<secret>
MINIO_BUCKET=user-avatars

# Service
PORT=3003
NODE_ENV=development
LOG_LEVEL=debug
MAX_AVATAR_SIZE_MB=5
```

---

## 📅 Development Plan

### Day 1-2: Domain Layer
- ✅ Aggregates (User)
- ✅ Value Objects (Email, FullName, UserStatus)
- ✅ Domain Events
- ✅ Repository Interfaces
- ✅ 71 unit tests

### Day 3: Application Layer
- ✅ Commands (6) & Queries (5)
- ✅ Command/Query Handlers (11)
- ✅ DTOs (Request/Response)
- ✅ 7 handler tests

### Day 4: Infrastructure
- ✅ TypeORM Entities & Mappers
- ✅ Repository Implementations
- ⏳ Kafka Producer/Consumer
- ⏳ MinIO Service
- ⏳ HTTP Controllers
- ⏳ Migrations

### Day 5: Integration & Testing
- 🔲 API Gateway integration
- 🔲 Kafka event flows
- 🔲 Integration tests
- 🔲 E2E tests

---

## 🎯 Success Criteria

### Functional
- ✅ User CRUD через API Gateway
- ✅ RBAC enforcement
- ✅ Avatar upload (MinIO)
- ✅ Kafka events published
- ✅ Auth events consumed (idempotent)

### Non-Functional
- ✅ API response <100ms (p95)
- ✅ Test coverage >85% (domain >90%)
- ✅ Zero event loss
- ✅ Graceful shutdown

### Architecture
- ✅ Clean separation (Domain/App/Infra)
- ✅ CQRS pattern implemented
- ✅ DDD tactical patterns used
- ✅ Dependency Inversion

---

**Документация подготовлена для быстрого onboarding разработчиков**  
**Для примеров реализации см. исходный код в `/apps/user-service/src/`**
