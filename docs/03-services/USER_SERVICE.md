# User Service

**Статус:** ✅ Реализован  
**Порт:** 3003  
**Технологии:** NestJS, TypeORM, PostgreSQL, CQRS  
**Версия:** 1.0

---

## 🎯 Назначение

User Service управляет пользовательскими профилями, статистикой и квотами. Построен на принципах DDD (Domain-Driven Design) и CQRS.

---

## ✅ Ответственность

### Что входит:
- **User Profiles (CRUD)** - создание, чтение, обновление профилей
- **Avatar Management** - загрузка и хранение аватаров
- **User Statistics** - interviews created, storage used
- **Quota Tracking** - отслеживание лимитов пользователя
- **User Preferences** - настройки уведомлений, языка
- **Kafka Events** - публикация user events

### Что НЕ входит:
- ❌ **Аутентификация** (Keycloak)
- ❌ **Authorization/Permissions** (API Gateway)
- ❌ **Billing/Subscriptions** (Billing Service)
- ❌ **Interview management** (Interview Service)

---

## 🏗️ Архитектура (CQRS + DDD)

```
┌─────────────────────────────────────────────┐
│          USER SERVICE (3003)                │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │      HTTP Layer (Controllers)       │   │
│  │  - UsersController                  │   │
│  │  - ProfilesController               │   │
│  │  - StatsController                  │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│  ┌──────────────▼──────────────────────┐   │
│  │    Application Layer (CQRS)         │   │
│  │  ┌────────────┐  ┌───────────────┐  │   │
│  │  │ Commands   │  │   Queries     │  │   │
│  │  ├────────────┤  ├───────────────┤  │   │
│  │  │ CreateUser │  │ GetUserById   │  │   │
│  │  │ UpdateUser │  │ GetUserByEmail│  │   │
│  │  │ UploadAvatar│  │ GetUserStats  │  │   │
│  │  └────────────┘  └───────────────┘  │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│  ┌──────────────▼──────────────────────┐   │
│  │     Domain Layer (Entities)         │   │
│  │  - User (Aggregate Root)            │   │
│  │  - Profile (Value Object)           │   │
│  │  - Stats (Value Object)             │   │
│  │  - Quota (Value Object)             │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│  ┌──────────────▼──────────────────────┐   │
│  │   Infrastructure Layer              │   │
│  │  - TypeORM Repositories             │   │
│  │  - KafkaService (Event Publishing)  │   │
│  │  - MinIO (Avatar Storage)           │   │
│  │  - LoggerService                    │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
           │              │
           ▼              ▼
     PostgreSQL        Kafka
    (users DB)      (user-events)
```

---

## 📡 API Endpoints

### Users CRUD

#### `POST /api/v1/users`
Создать нового пользователя (вызывается после регистрации в Keycloak)
```typescript
Request: {
  keycloakId: string
  email: string
  profile: {
    fullName: string
  }
}

Response: {
  id: string
  keycloakId: string
  email: string
  profile: {
    fullName: string
    avatarUrl: null
  }
  stats: {
    interviewsCreated: 0
    storageUsed: 0
  }
  createdAt: string
}
```

#### `GET /api/v1/users/:id`
Получить пользователя по ID
```typescript
Response: User
```

#### `GET /api/v1/users/by-keycloak/:keycloakId`
Получить пользователя по Keycloak ID
```typescript
Response: User
```

#### `PATCH /api/v1/users/:id`
Обновить профиль пользователя
```typescript
Request: {
  profile?: {
    fullName?: string
    companyName?: string
    phone?: string
  }
}

Response: User
```

#### `DELETE /api/v1/users/:id`
Удалить пользователя (soft delete)
```typescript
Response: {
  message: "User deleted successfully"
}
```

---

### Profile Management

#### `PUT /api/v1/users/:id/profile`
Полное обновление профиля
```typescript
Request: {
  fullName: string
  companyName?: string
  phone?: string
  bio?: string
}

Response: User
```

---

### Avatar Management

#### `POST /api/v1/users/:id/avatar`
Загрузить аватар (multipart/form-data)
```typescript
Request: multipart/form-data
  file: File (jpeg, png, max 5MB)

Response: {
  avatarUrl: string
}
```

#### `DELETE /api/v1/users/:id/avatar`
Удалить аватар
```typescript
Response: {
  message: "Avatar deleted successfully"
}
```

---

### Statistics

#### `GET /api/v1/users/:id/stats`
Получить статистику пользователя
```typescript
Response: {
  interviewsCreated: number
  interviewsActive: number
  candidatesTotal: number
  storageUsed: number          // bytes
  storageUsedFormatted: string // "1.5 GB"
}
```

#### `POST /api/v1/users/:id/stats/increment-interviews`
Инкремент счетчика интервью (внутренний endpoint)
```typescript
Response: Stats
```

---

### Health & Metrics

#### `GET /health`
Health check
```typescript
Response: {
  status: "ok",
  database: "connected",
  kafka: "connected"
}
```

#### `GET /metrics`
Prometheus metrics

---

## 🗄️ Database Schema

### Table: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keycloak_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- Profile (embedded)
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  phone VARCHAR(50),
  bio TEXT,
  avatar_url TEXT,
  
  -- Stats (embedded)
  interviews_created INTEGER DEFAULT 0,
  storage_used BIGINT DEFAULT 0,
  
  -- Quotas (embedded)
  max_interviews INTEGER DEFAULT 10,
  max_storage BIGINT DEFAULT 5368709120, -- 5GB
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### Table: `processed_events` (Idempotency)
```sql
CREATE TABLE processed_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_event_per_service UNIQUE (event_id, service_name)
);

CREATE INDEX idx_processed_events_event_id ON processed_events(event_id);
```

---

## 📨 Events

### Published Events

#### `user.created`
Публикуется при создании пользователя
```typescript
{
  eventId: string            // UUID
  eventType: "user.created"
  timestamp: string          // ISO 8601
  userId: string
  data: {
    keycloakId: string
    email: string
    fullName: string
  }
}
```

#### `user.updated`
Публикуется при обновлении профиля
```typescript
{
  eventId: string
  eventType: "user.updated"
  timestamp: string
  userId: string
  data: {
    changes: {
      fullName?: string
      companyName?: string
      phone?: string
    }
  }
}
```

#### `user.avatar_uploaded`
Публикуется при загрузке аватара
```typescript
{
  eventId: string
  eventType: "user.avatar_uploaded"
  timestamp: string
  userId: string
  data: {
    avatarUrl: string
    fileSize: number
  }
}
```

#### `user.deleted`
Публикуется при удалении пользователя (soft delete)
```typescript
{
  eventId: string
  eventType: "user.deleted"
  timestamp: string
  userId: string
  data: {
    deletedAt: string
  }
}
```

### Subscribed Events

#### `interview.created` (from Interview Service)
Обрабатывает создание интервью для инкремента статистики
```typescript
{
  eventType: "interview.created"
  userId: string
  data: {
    interviewId: string
  }
}

// Action: Increment users.interviews_created
```

#### `media.uploaded` (from Media Service)
Обрабатывает загрузку медиа для обновления storage_used
```typescript
{
  eventType: "media.uploaded"
  userId: string
  data: {
    fileId: string
    fileSize: number
  }
}

// Action: Increment users.storage_used
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Application
PORT=3003
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ai_video_interview
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_SCHEMA=user_service

# MinIO (Avatar Storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=avatars
MINIO_USE_SSL=false

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=user-service
KAFKA_GROUP_ID=user-service-group

# Logging
LOG_LEVEL=debug
LOKI_HOST=http://localhost:3100

# Observability
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

---

## 📊 Metrics & Health

### Health Check
```
GET /health

Response:
{
  status: "ok",
  timestamp: "2025-10-06T10:00:00Z",
  database: {
    status: "connected",
    connections: 5
  },
  kafka: {
    status: "connected",
    broker: "localhost:9092"
  }
}
```

### Prometheus Metrics
```
GET /metrics

# Custom Metrics:
- user_service_users_total (counter)
- user_service_profiles_updated_total (counter)
- user_service_avatars_uploaded_total (counter)
- user_service_storage_used_bytes (gauge by userId)
- user_service_database_query_duration_seconds (histogram)
- user_service_kafka_events_published_total (counter by event_type)
```

---

## 🚨 Error Handling

### Error Response Format
```typescript
{
  statusCode: number
  message: string
  error: string
  timestamp: string
  path: string
  traceId?: string
}
```

### Common Errors

| Status | Scenario | Message |
|--------|----------|---------|
| 400 | Invalid input | "Validation failed" |
| 404 | User not found | "User with ID {id} not found" |
| 409 | Email already exists | "User with email {email} already exists" |
| 413 | File too large | "Avatar file size exceeds 5MB limit" |
| 415 | Invalid file type | "Only JPEG and PNG images are supported" |
| 500 | Database error | "Internal server error" |

---

## 🔒 Security

### Authentication
All endpoints require JWT token from API Gateway (except internal endpoints).

### Authorization
- Users can only access/modify their own data
- Internal endpoints (stats increment) require internal-token header

### Data Validation
```typescript
// CreateUserDto
class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  keycloakId: string;

  @IsEmail()
  email: string;

  @ValidateNested()
  profile: ProfileDto;
}

// ProfileDto
class ProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName?: string;
}
```

---

## 📝 Logging

### Log Format
```json
{
  "timestamp": "2025-10-06T10:00:00.000Z",
  "level": "info",
  "service": "user-service",
  "message": "User created successfully",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "action": "user_create",
  "traceId": "abc123"
}
```

### Logged Events
- User CRUD operations
- Avatar uploads/deletes
- Kafka event publishing
- Database query errors
- Stats updates

---

## 🧪 Testing

### Unit Tests
```bash
cd apps/user-service
npm run test
```

### Integration Tests
```bash
npm run test:e2e
```

### Key Test Coverage
- ✅ User CRUD operations
- ✅ Profile updates
- ✅ Avatar upload/delete
- ✅ Stats tracking
- ✅ Kafka event publishing
- ✅ Event idempotency
- ✅ Database transactions

---

## 🐛 Troubleshooting

### Database connection issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
psql -h localhost -U postgres -d ai_video_interview
\c user_service
\dt
```

### Kafka connection issues
```bash
# Check Kafka is running
docker-compose ps kafka

# List topics
docker exec -it ai-interview-kafka kafka-topics --list --bootstrap-server localhost:9092
```

### MinIO connection issues
```bash
# Check MinIO is running
curl http://localhost:9000/minio/health/live

# Access MinIO Console
# http://localhost:9001
```

### Duplicate event processing
```bash
# Check processed_events table
SELECT * FROM processed_events ORDER BY processed_at DESC LIMIT 10;
```

---

## 📂 Project Structure

```
apps/user-service/
├── src/
│   ├── main.ts                     # Bootstrap
│   ├── app.module.ts               # Root module
│   │
│   ├── application/                # CQRS Application Layer
│   │   ├── application.module.ts
│   │   ├── commands/               # Write operations
│   │   │   ├── handlers/
│   │   │   │   ├── create-user.handler.ts
│   │   │   │   ├── update-user.handler.ts
│   │   │   │   └── upload-avatar.handler.ts
│   │   │   └── impl/
│   │   │       ├── create-user.command.ts
│   │   │       └── update-user.command.ts
│   │   └── queries/                # Read operations
│   │       ├── handlers/
│   │       │   ├── get-user-by-id.handler.ts
│   │       │   └── get-user-stats.handler.ts
│   │       └── impl/
│   │           └── get-user-by-id.query.ts
│   │
│   ├── domain/                     # Domain Layer (DDD)
│   │   ├── entities/
│   │   │   └── user.entity.ts      # Aggregate Root
│   │   ├── value-objects/
│   │   │   ├── profile.vo.ts
│   │   │   ├── stats.vo.ts
│   │   │   └── quota.vo.ts
│   │   └── repositories/
│   │       └── user.repository.interface.ts
│   │
│   ├── infrastructure/             # Infrastructure Layer
│   │   ├── persistence/
│   │   │   ├── database.module.ts
│   │   │   ├── typeorm.config.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts  # TypeORM Entity
│   │   │   ├── repositories/
│   │   │   │   └── user.repository.ts
│   │   │   └── migrations/
│   │   │       └── 1234567890-CreateUsersTable.ts
│   │   │
│   │   ├── kafka/                  # Event Publishing
│   │   │   ├── kafka.module.ts
│   │   │   ├── kafka.service.ts
│   │   │   └── consumers/
│   │   │       └── interview-events.consumer.ts
│   │   │
│   │   ├── storage/                # MinIO Integration
│   │   │   ├── storage.module.ts
│   │   │   └── storage.service.ts
│   │   │
│   │   ├── logger/                 # Logging
│   │   │   ├── logger.module.ts
│   │   │   └── logger.service.ts
│   │   │
│   │   └── http/                   # HTTP Controllers
│   │       ├── http.module.ts
│   │       └── controllers/
│   │           ├── users.controller.ts
│   │           └── health.controller.ts
│   │
│   └── shared/                     # Shared utilities
│       ├── dto/
│       ├── guards/
│       └── interceptors/
│
├── test/
│   └── e2e/
│       └── users.e2e-spec.ts
│
├── package.json
└── tsconfig.json
```

---

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start:prod
```

### Database Migrations
```bash
# Generate migration
npm run migration:generate -- CreateUsersTable

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

---

## 🔗 Dependencies

### Internal Services:
- **API Gateway** (3001) - HTTP routing
- **Interview Service** (3004) - subscribes to interview events
- **Media Service** (3006) - subscribes to media events

### External Services:
- **PostgreSQL** (5432) - database
- **Kafka** (9092) - event streaming
- **MinIO** (9000) - avatar storage
- **Loki** (3100) - log aggregation
- **Jaeger** (14268) - distributed tracing

---

## 📚 Additional Resources

- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [DDD Aggregates](https://martinfowler.com/bliki/DDD_Aggregate.html)
- [Event-Driven Architecture](../05-events/EVENT_CATALOG.md)
- [Database Migrations](../06-database/MIGRATIONS.md)

---

**Последнее обновление:** 2025-10-06
