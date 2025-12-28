# User Service

**Status:** ✅ Implemented  
**Port:** 3005  
**Technology Stack:** NestJS, TypeORM, PostgreSQL, Kafka, MinIO, Redis (BullMQ)  
**Database:** `ai_video_interview_user`

---

## Overview

User Service manages all user-related operations for the AI Video Interview platform using Clean Architecture with CQRS and DDD patterns.

**Key Responsibilities:**
- User profile management
- Role-based access control (admin, hr, candidate)
- HR company management
- Candidate skills management
- Avatar storage (MinIO)
- Event publishing via INBOX/OUTBOX pattern

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           USER SERVICE (3005)                                   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         HTTP Layer                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │    Users    │  │  Candidates │  │  Companies  │  │   Skills    │    │   │
│  │  │ Controller  │  │ Controller  │  │ Controller  │  │ Controller  │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                        │
│  ┌─────────────────────────────────────▼───────────────────────────────────┐   │
│  │                    Application Layer (CQRS)                              │   │
│  │                                                                          │   │
│  │  Commands:                              Queries:                         │   │
│  │  ┌──────────────────────────┐          ┌──────────────────────────┐    │   │
│  │  │ CreateUser, UpdateUser   │          │ GetUser, ListUsers       │    │   │
│  │  │ SuspendUser, ActivateUser│          │ GetUserByExternalAuthId  │    │   │
│  │  │ SelectRole, UploadAvatar │          │ GetUserPermissions       │    │   │
│  │  │ Admin: Create/Update/Del │          │ GetUserStats             │    │   │
│  │  │ HR: Companies CRUD       │          │ Candidate: Profile, Skills│   │   │
│  │  │ Candidate: Profile/Skills│          │ Companies: List, Get     │    │   │
│  │  └──────────────────────────┘          └──────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                        │
│  ┌─────────────────────────────────────▼───────────────────────────────────┐   │
│  │                         Domain Layer (DDD)                               │   │
│  │                                                                          │   │
│  │  Aggregates:        Entities:           Value Objects:                   │   │
│  │  ┌────────────┐    ┌────────────┐      ┌────────────────────────┐       │   │
│  │  │    User    │    │   Skill    │      │ Email, FullName        │       │   │
│  │  │ (aggregate)│    │  Company   │      │ UserStatus, UserRole   │       │   │
│  │  └────────────┘    │ Candidate  │      │ ExperienceLevel        │       │   │
│  │                    │   Skill    │      │ ProficiencyLevel       │       │   │
│  │                    └────────────┘      └────────────────────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                        │
│  ┌─────────────────────────────────────▼───────────────────────────────────┐   │
│  │                      Infrastructure Layer                                │   │
│  │                                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  Persistence │  │   Messaging  │  │    Kafka     │  │  Storage   │  │   │
│  │  │  (TypeORM)   │  │(INBOX/OUTBOX)│  │  (Consumer/  │  │  (MinIO)   │  │   │
│  │  │              │  │  (BullMQ)    │  │   Producer)  │  │            │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
    PostgreSQL             Redis               Kafka                MinIO
     (5432)               (6379)              (9092)             (9000/9001)
```

---

## Project Structure

```
src/
├── domain/                              # Domain Layer (Pure business logic)
│   ├── aggregates/
│   │   └── user.aggregate.ts           # User aggregate root
│   ├── entities/
│   │   ├── skill.entity.ts             # Skill domain entity
│   │   ├── skill-category.entity.ts    # Skill category
│   │   ├── candidate-skill.entity.ts   # Candidate-skill relation
│   │   └── user-company.entity.ts      # User-company relation
│   ├── value-objects/
│   │   ├── email.vo.ts                 # Email validation
│   │   ├── full-name.vo.ts             # Name handling
│   │   ├── user-status.vo.ts           # active/suspended/deleted
│   │   ├── user-role.vo.ts             # admin/hr/candidate
│   │   ├── experience-level.vo.ts      # junior/middle/senior/lead
│   │   ├── proficiency-level.vo.ts     # beginner/intermediate/...
│   │   ├── company-size.vo.ts          # startup/small/medium/...
│   │   └── years-of-experience.vo.ts   # Experience validation
│   ├── events/
│   │   ├── user-created.event.ts
│   │   ├── user-updated.event.ts
│   │   ├── user-suspended.event.ts
│   │   └── ... (domain events)
│   ├── repositories/
│   │   └── user.repository.interface.ts
│   ├── read-models/
│   │   └── user-read.model.ts
│   ├── base/
│   │   └── aggregate-root.ts
│   └── exceptions/
│       └── user.exceptions.ts
│
├── application/                         # Application Layer (CQRS)
│   ├── commands/
│   │   ├── create-user/
│   │   │   ├── create-user.command.ts
│   │   │   └── create-user.handler.ts
│   │   ├── update-user/
│   │   ├── suspend-user/
│   │   ├── activate-user/
│   │   ├── select-role/
│   │   ├── upload-avatar/
│   │   ├── admin/                      # Admin-specific commands
│   │   │   ├── admin-create-user/
│   │   │   ├── admin-update-user/
│   │   │   ├── admin-assign-role/
│   │   │   └── ... 
│   │   ├── hr/                         # HR-specific commands
│   │   │   ├── create-company/
│   │   │   ├── update-company/
│   │   │   └── delete-company/
│   │   └── candidate/                  # Candidate-specific commands
│   │       ├── update-candidate-profile/
│   │       ├── add-candidate-skill/
│   │       └── remove-candidate-skill/
│   ├── queries/
│   │   ├── get-user/
│   │   ├── get-user-by-external-auth-id/
│   │   ├── list-users/
│   │   ├── get-user-permissions/
│   │   ├── get-user-stats/
│   │   ├── candidate/
│   │   │   ├── get-candidate-profile/
│   │   │   └── get-candidate-skills/
│   │   ├── companies/
│   │   │   ├── get-company/
│   │   │   └── list-companies/
│   │   └── skills/
│   │       ├── get-skill/
│   │       ├── list-skills/
│   │       └── search-skills/
│   ├── dto/
│   │   ├── requests/
│   │   └── responses/
│   └── application.module.ts
│
├── infrastructure/                      # Infrastructure Layer
│   ├── persistence/
│   │   ├── entities/                   # TypeORM entities
│   │   │   ├── user.entity.ts
│   │   │   ├── role.entity.ts
│   │   │   ├── skill.entity.ts
│   │   │   ├── skill-category.entity.ts
│   │   │   ├── company.entity.ts
│   │   │   ├── candidate-skill.entity.ts
│   │   │   ├── user-company.entity.ts
│   │   │   └── outbox.entity.ts
│   │   ├── repositories/
│   │   │   ├── typeorm-user.repository.ts
│   │   │   ├── typeorm-role.repository.ts
│   │   │   ├── typeorm-skill.repository.ts
│   │   │   └── typeorm-company.repository.ts
│   │   ├── mappers/
│   │   │   ├── user.mapper.ts
│   │   │   ├── skill.mapper.ts
│   │   │   └── company.mapper.ts
│   │   ├── migrations/
│   │   │   └── ... (TypeORM migrations)
│   │   ├── database.module.ts
│   │   └── typeorm.config.ts
│   │
│   ├── messaging/                      # INBOX/OUTBOX Pattern
│   │   ├── outbox/
│   │   │   ├── outbox-publisher.processor.ts
│   │   │   └── outbox-scheduler.service.ts
│   │   └── messaging.module.ts
│   │
│   ├── kafka/
│   │   └── kafka.module.ts
│   │
│   ├── http/
│   │   ├── controllers/
│   │   │   ├── users.controller.ts
│   │   │   ├── candidates.controller.ts
│   │   │   ├── companies.controller.ts
│   │   │   ├── skills.controller.ts
│   │   │   ├── user-admin.controller.ts
│   │   │   └── health.controller.ts
│   │   └── http.module.ts
│   │
│   ├── storage/
│   │   ├── minio-storage.service.ts
│   │   └── storage.module.ts
│   │
│   ├── logger/
│   │   ├── logger.service.ts
│   │   └── logger.module.ts
│   │
│   └── metrics/
│       └── metrics.module.ts
│
├── app.module.ts
└── main.ts
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │   user_roles    │       │     roles       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ user_id (FK)    │       │ id (PK)         │
│ external_auth_id│       │ role_id (FK)    │──────►│ name            │
│ email           │       │ created_at      │       │ display_name    │
│ first_name      │       └─────────────────┘       └─────────────────┘
│ last_name       │
│ phone           │       ┌─────────────────┐       ┌─────────────────┐
│ avatar_url      │       │  user_companies │       │   companies     │
│ status          │◄──────│ user_id (FK)    │       ├─────────────────┤
│ selected_role   │       │ company_id (FK) │──────►│ id (PK)         │
│ created_at      │       │ position        │       │ name            │
│ updated_at      │       │ is_primary      │       │ description     │
└─────────────────┘       └─────────────────┘       │ size            │
                                                     │ industry        │
                                                     │ website         │
┌─────────────────┐       ┌─────────────────┐       │ owner_id (FK)   │
│     skills      │       │candidate_skills │       └─────────────────┘
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ skill_id (FK)   │
│ name            │       │ user_id (FK)    │──────►users
│ category_id(FK) │       │ proficiency     │
│ is_active       │       │ years_exp       │
└────────┬────────┘       │ is_primary      │
         │                └─────────────────┘
         ▼
┌─────────────────┐       ┌─────────────────┐
│skill_categories │       │     outbox      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │       │ event_type      │
│ description     │       │ payload (JSONB) │
└─────────────────┘       │ status          │
                          │ published_at    │
                          │ created_at      │
                          └─────────────────┘
```

### Tables Detail

**users**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `external_auth_id` | VARCHAR | Keycloak user ID (unique) |
| `email` | VARCHAR | Email address (unique) |
| `first_name` | VARCHAR | First name |
| `last_name` | VARCHAR | Last name |
| `phone` | VARCHAR | Phone number |
| `avatar_url` | TEXT | Avatar URL in MinIO |
| `status` | ENUM | active, suspended, deleted |
| `selected_role` | VARCHAR | Currently selected role |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**roles**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Role name (admin, hr, candidate) |
| `display_name` | VARCHAR | Human-readable name |

**companies**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Company name |
| `description` | TEXT | Company description |
| `size` | ENUM | startup, small, medium, large, enterprise |
| `industry` | VARCHAR | Industry sector |
| `website` | VARCHAR | Company website |
| `owner_id` | UUID | FK to users (HR who created) |

**skills**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Skill name |
| `category_id` | UUID | FK to skill_categories |
| `is_active` | BOOLEAN | Is skill active |

**candidate_skills**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `skill_id` | UUID | FK to skills |
| `proficiency_level` | ENUM | beginner, intermediate, advanced, expert |
| `years_of_experience` | INTEGER | Years with this skill |
| `is_primary` | BOOLEAN | Primary skill flag |

---

## CQRS Commands

### User Commands

| Command | Handler | Description |
|---------|---------|-------------|
| `CreateUserCommand` | Creates new user from Kafka event |
| `UpdateUserCommand` | Updates user profile |
| `SuspendUserCommand` | Suspends user account |
| `ActivateUserCommand` | Activates suspended user |
| `SelectRoleCommand` | Sets user's active role |
| `UploadAvatarCommand` | Uploads avatar to MinIO |

### Admin Commands

| Command | Handler | Description |
|---------|---------|-------------|
| `AdminCreateUserCommand` | Admin creates user directly |
| `AdminUpdateUserCommand` | Admin updates any user |
| `AdminDeleteUserCommand` | Admin deletes user |
| `AdminAssignRoleCommand` | Assigns role to user |
| `AdminRemoveRoleCommand` | Removes role from user |
| `AdminCreateSkillCommand` | Creates new skill |
| `AdminUpdateSkillCommand` | Updates skill |
| `AdminDeleteSkillCommand` | Deletes skill |

### HR Commands

| Command | Handler | Description |
|---------|---------|-------------|
| `CreateCompanyCommand` | HR creates company |
| `UpdateCompanyCommand` | HR updates company |
| `DeleteCompanyCommand` | HR deletes company |

### Candidate Commands

| Command | Handler | Description |
|---------|---------|-------------|
| `UpdateCandidateProfileCommand` | Updates candidate profile |
| `AddCandidateSkillCommand` | Adds skill to candidate |
| `RemoveCandidateSkillCommand` | Removes skill from candidate |
| `UpdateCandidateSkillCommand` | Updates skill proficiency |

---

## CQRS Queries

| Query | Handler | Description |
|-------|---------|-------------|
| `GetUserQuery` | Get user by ID |
| `GetUserByExternalAuthIdQuery` | Find by Keycloak ID |
| `ListUsersQuery` | Paginated user list |
| `GetUserPermissionsQuery` | Get user's permissions |
| `GetUserStatsQuery` | Get user statistics |
| `GetCandidateProfileQuery` | Get candidate profile |
| `GetCandidateSkillsQuery` | Get candidate's skills |
| `GetCompanyQuery` | Get company by ID |
| `ListCompaniesQuery` | List HR's companies |
| `GetSkillQuery` | Get skill by ID |
| `ListSkillsQuery` | List all skills |
| `SearchSkillsQuery` | Search skills by name |

---

## API Endpoints

### Internal API (Service-to-Service)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/internal/users/:id` | Get user by ID |
| `GET` | `/api/v1/internal/users/by-external-auth/:externalAuthId` | Find by Keycloak ID |
| `POST` | `/api/v1/internal/users` | Create user (from Kafka) |

### Users API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users/:id` | Get user profile |
| `PUT` | `/api/v1/users/:id` | Update user profile |
| `POST` | `/api/v1/users/:id/avatar` | Upload avatar |
| `DELETE` | `/api/v1/users/:id/avatar` | Remove avatar |
| `POST` | `/api/v1/users/:id/select-role` | Select active role |

### Candidates API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/candidates/:id/profile` | Get candidate profile |
| `PUT` | `/api/v1/candidates/:id/profile` | Update candidate profile |
| `GET` | `/api/v1/candidates/:id/skills` | Get candidate skills |
| `POST` | `/api/v1/candidates/:id/skills` | Add skill |
| `PUT` | `/api/v1/candidates/:id/skills/:skillId` | Update skill |
| `DELETE` | `/api/v1/candidates/:id/skills/:skillId` | Remove skill |

### Companies API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/companies` | List user's companies |
| `GET` | `/api/v1/companies/:id` | Get company |
| `POST` | `/api/v1/companies` | Create company |
| `PUT` | `/api/v1/companies/:id` | Update company |
| `DELETE` | `/api/v1/companies/:id` | Delete company |

### Skills API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/skills` | List all skills |
| `GET` | `/api/v1/skills/search` | Search skills |
| `GET` | `/api/v1/skills/categories` | List categories |

### Admin API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/users` | List all users (paginated) |
| `POST` | `/api/v1/admin/users` | Create user |
| `PUT` | `/api/v1/admin/users/:id` | Update user |
| `DELETE` | `/api/v1/admin/users/:id` | Delete user |
| `POST` | `/api/v1/admin/users/:id/suspend` | Suspend user |
| `POST` | `/api/v1/admin/users/:id/activate` | Activate user |
| `POST` | `/api/v1/admin/users/:id/roles` | Assign role |
| `DELETE` | `/api/v1/admin/users/:id/roles/:roleId` | Remove role |
| `POST` | `/api/v1/admin/skills` | Create skill |
| `PUT` | `/api/v1/admin/skills/:id` | Update skill |
| `DELETE` | `/api/v1/admin/skills/:id` | Delete skill |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/health/live` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe |

---

## Kafka Integration

### Consumed Topics

| Topic | Event | Action |
|-------|-------|--------|
| `user-commands` | `CREATE_USER` | Create user in database |
| `user-commands` | `UPDATE_USER` | Update user profile |
| `user-commands` | `DELETE_USER` | Soft delete user |
| `user-commands` | `SUSPEND_USER` | Suspend user account |
| `user-commands` | `ACTIVATE_USER` | Activate user account |

### Published Events (via OUTBOX)

| Topic | Event | Trigger |
|-------|-------|---------|
| `user-events` | `user.created` | User created |
| `user-events` | `user.updated` | User updated |
| `user-events` | `user.deleted` | User deleted |
| `user-events` | `user.suspended` | User suspended |
| `user-events` | `user.activated` | User activated |
| `user-events` | `user.role_selected` | Role selected |

### Event Schema

**user.created**
```json
{
  "eventId": "uuid",
  "eventType": "user.created",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "userId": "uuid",
    "externalAuthId": "keycloak-user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["candidate"]
  }
}
```

---

## OUTBOX Pattern

Ensures reliable event publishing with at-least-once delivery.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            OUTBOX Pattern Flow                                  │
│                                                                                 │
│  1. Command Handler executes business logic                                    │
│     │                                                                          │
│     ▼                                                                          │
│  2. Within SAME transaction:                                                   │
│     - Save entity to database                                                  │
│     - Save event to outbox table                                              │
│     │                                                                          │
│     ▼                                                                          │
│  3. Transaction commits (atomicity guaranteed)                                 │
│     │                                                                          │
│     ▼                                                                          │
│  4. OutboxScheduler (@Cron every 5s):                                         │
│     - Query outbox for pending events                                          │
│     - Add to BullMQ queue                                                      │
│     │                                                                          │
│     ▼                                                                          │
│  5. OutboxPublisher (BullMQ worker):                                          │
│     - Publish event to Kafka                                                   │
│     - Mark outbox record as published                                          │
│     - On failure: retry with backoff                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables

```bash
# Application
PORT=3005
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ai_video_interview_user
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=user-service
KAFKA_GROUP_ID=user-service-group

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_AVATARS=avatars

# Observability
LOG_LEVEL=debug
LOKI_HOST=http://localhost:3100
```

---

## Migrations

### Running Migrations

```bash
# Generate new migration
npm run migration:generate --filter=user-service -- -n MigrationName

# Run pending migrations
npm run migration:run --filter=user-service

# Revert last migration
npm run migration:revert --filter=user-service

# Show migration status
npm run migration:show --filter=user-service
```

### Migration Files

Located in `src/infrastructure/persistence/migrations/`

---

## Value Objects

### UserStatus
- `active` - Normal account
- `suspended` - Temporarily disabled
- `deleted` - Soft deleted

### UserRole
- `admin` - System administrator
- `hr` - HR manager
- `candidate` - Job candidate

### ExperienceLevel
- `junior` - 0-2 years
- `middle` - 2-5 years
- `senior` - 5-10 years
- `lead` - 10+ years

### ProficiencyLevel
- `beginner` - Basic knowledge
- `intermediate` - Working knowledge
- `advanced` - Deep expertise
- `expert` - Industry expert

### CompanySize
- `startup` - 1-10 employees
- `small` - 11-50 employees
- `medium` - 51-200 employees
- `large` - 201-1000 employees
- `enterprise` - 1000+ employees

---

## Metrics

### Prometheus Metrics

```
user_service_users_total{status="active|suspended"}
user_service_commands_total{command="create|update|delete"}
user_service_queries_total{query="get_user|list_users"}
user_service_outbox_events_total{status="pending|published|failed"}
user_service_avatar_uploads_total
```

---

## Development

### Running Locally

```bash
# Start dependencies
docker-compose up -d postgres redis kafka minio

# Run migrations
npm run migration:run --filter=user-service

# Start service
npm run dev --filter=user-service

# Service available at http://localhost:3005
```

### Testing

```bash
# Unit tests
npm run test --filter=user-service

# E2E tests
npm run test:e2e --filter=user-service
```

---

**Last Updated:** December 2024
