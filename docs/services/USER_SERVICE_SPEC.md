# 👤 USER SERVICE - Technical Specification

## 🎯 Service Purpose

**User Service** - это микросервис, отвечающий **ТОЛЬКО** за управление пользователями, их профилями, ролями и разрешениями. Это single source of truth для всей user-related информации в системе.

**Архитектурный подход:** CQRS + DDD + Clean Architecture  
**Цель:** Создать правильный фундамент для обучения enterprise паттернам и будущего масштабирования.

---

## 🔍 Service Boundaries (Что входит / Что НЕ входит)

### ✅ ЧТО ВХОДИТ В USER-SERVICE:

1. **User Management**
   - Создание, чтение, обновление, удаление пользователей
   - User profiles (имя, email, avatar, bio, etc.)
   - User metadata (preferences, settings)
   - Soft delete пользователей

2. **RBAC (Role-Based Access Control)**
   - Управление ролями (HR, Admin, Candidate, Viewer)
   - Назначение ролей пользователям
   - Проверка permissions
   - Role hierarchy

3. **User State Management**
   - Account status (active, suspended, deleted)
   - Email verification status
   - Last login tracking
   - User activity timestamps

4. **Profile Management**
   - Avatar upload/update
   - Profile fields update
   - User preferences
   - Timezone, language settings

5. **User Search & Filtering**
   - Search users by email, name
   - Filter by role, status
   - Pagination support

6. **Analytics & Stats**
   - User count by role
   - Registration trends
   - Active users metrics

### ❌ ЧТО НЕ ВХОДИТ (делают другие сервисы):

1. **Authentication** - делает API Gateway
   - Login/Logout
   - OAuth flow
   - JWT generation
   - Session management
   - Token refresh

2. **Authorization on endpoints** - делает API Gateway
   - JWT validation
   - Route protection
   - Token refresh logic

3. **Billing** - делает Billing Service
   - Subscription management
   - Payment processing
   - Usage limits

4. **Notifications** - делает Notification Service
   - Email отправка
   - Push notifications
   - SMS

5. **Business Logic** - делают domain services
   - Interview management (Interview Service)
   - Media processing (Media Service)
   - AI analysis (AI Service)

---

## 📊 Database Schema

```typescript
// PostgreSQL Database: user_service_db

// ========================================
// USERS TABLE
// ========================================
Table: users
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
├── keycloak_id           VARCHAR(255) UNIQUE NOT NULL  // ID от Keycloak
├── email                 VARCHAR(255) UNIQUE NOT NULL
├── username              VARCHAR(100) UNIQUE
├── first_name            VARCHAR(100)
├── last_name             VARCHAR(100)
├── avatar_url            TEXT                          // URL в MinIO/S3
├── bio                   TEXT
├── phone                 VARCHAR(50)
├── timezone              VARCHAR(50) DEFAULT 'UTC'
├── language              VARCHAR(10) DEFAULT 'en'
├── email_verified        BOOLEAN DEFAULT FALSE
├── status                ENUM('active', 'suspended', 'deleted') DEFAULT 'active'
├── last_login_at         TIMESTAMP
├── created_at            TIMESTAMP DEFAULT NOW()
├── updated_at            TIMESTAMP DEFAULT NOW()
├── deleted_at            TIMESTAMP NULL                // Soft delete
└── metadata              JSONB DEFAULT '{}'            // Flexible data

// ========================================
// ROLES TABLE
// ========================================
Table: roles
├── id                    UUID PRIMARY KEY
├── name                  VARCHAR(50) UNIQUE NOT NULL   // 'HR', 'Admin', 'Candidate', 'Viewer'
├── display_name          VARCHAR(100)
├── description           TEXT
├── permissions           JSONB                         // Array of permission strings
├── created_at            TIMESTAMP DEFAULT NOW()
└── updated_at            TIMESTAMP DEFAULT NOW()

// ========================================
// USER_ROLES TABLE (Many-to-Many)
// ========================================
Table: user_roles
├── id                    UUID PRIMARY KEY
├── user_id               UUID REFERENCES users(id) ON DELETE CASCADE
├── role_id               UUID REFERENCES roles(id) ON DELETE CASCADE
├── assigned_at           TIMESTAMP DEFAULT NOW()
├── assigned_by           UUID REFERENCES users(id)    // Who assigned this role
└── UNIQUE(user_id, role_id)

// ========================================
// USER_PREFERENCES TABLE
// ========================================
Table: user_preferences
├── id                    UUID PRIMARY KEY
├── user_id               UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE
├── theme                 VARCHAR(20) DEFAULT 'light'   // 'light', 'dark', 'auto'
├── notifications_email   BOOLEAN DEFAULT TRUE
├── notifications_push    BOOLEAN DEFAULT TRUE
├── dashboard_layout      JSONB                         // Custom dashboard config
├── created_at            TIMESTAMP DEFAULT NOW()
└── updated_at            TIMESTAMP DEFAULT NOW()

// ========================================
// INDEXES
// ========================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
```

---

## 🚀 API Endpoints

### **User Management**

```typescript
// ========================================
// USER CRUD
// ========================================

// Get current user (from JWT)
GET /users/me
Response: {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  roles: string[];
  status: string;
  createdAt: string;
}

// Update current user profile
PUT /users/me
Body: {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  timezone?: string;
  language?: string;
}

// Upload avatar
POST /users/me/avatar
Body: multipart/form-data (file)
Response: { avatarUrl: string }

// Delete avatar
DELETE /users/me/avatar

// ========================================
// ADMIN: User Management
// ========================================

// List all users (Admin only)
GET /users
Query: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;  // search by email, name
}
Response: {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

// Get user by ID (Admin only)
GET /users/:id
Response: User

// Update user (Admin only)
PUT /users/:id
Body: {
  firstName?: string;
  lastName?: string;
  status?: 'active' | 'suspended' | 'deleted';
}

// Delete user (Admin only - soft delete)
DELETE /users/:id

// ========================================
// ROLE MANAGEMENT
// ========================================

// List all roles (Admin only)
GET /roles
Response: Role[]

// Get user roles
GET /users/:id/roles
Response: Role[]

// Assign role to user (Admin only)
POST /users/:id/roles
Body: {
  roleId: string;
}

// Remove role from user (Admin only)
DELETE /users/:id/roles/:roleId

// ========================================
// PREFERENCES
// ========================================

// Get user preferences
GET /users/me/preferences
Response: UserPreferences

// Update preferences
PUT /users/me/preferences
Body: Partial<UserPreferences>

// ========================================
// ANALYTICS (Admin only)
// ========================================

// User statistics
GET /users/stats
Response: {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
  newUsersThisMonth: number;
  trends: {
    registrations: Array<{ date: string; count: number }>;
  }
}

// ========================================
// HEALTH & INTERNAL
// ========================================

// Health check
GET /health
Response: { status: 'ok', timestamp: string }

// Internal: Get user by Keycloak ID (for API Gateway)
GET /internal/users/by-keycloak/:keycloakId
Response: User
```

---

## 📡 Kafka Events (Producer)

User Service **публикует** следующие события:

```typescript
// ========================================
// TOPIC: user-events
// ========================================

// Event 1: User Created
{
  eventType: 'user.created',
  eventId: string,           // UUID
  timestamp: string,         // ISO 8601
  version: '1.0',
  data: {
    userId: string,
    email: string,
    keycloakId: string,
    roles: string[],
    createdAt: string,
  }
}

// Event 2: User Updated
{
  eventType: 'user.updated',
  eventId: string,
  timestamp: string,
  version: '1.0',
  data: {
    userId: string,
    changes: {
      firstName?: string,
      lastName?: string,
      avatarUrl?: string,
      // ... other changed fields
    },
    updatedBy: string,       // Admin user ID who made the change
  }
}

// Event 3: User Deleted
{
  eventType: 'user.deleted',
  eventId: string,
  timestamp: string,
  version: '1.0',
  data: {
    userId: string,
    email: string,
    deletedAt: string,
    deletedBy: string,       // Admin user ID
  }
}

// Event 4: User Role Assigned
{
  eventType: 'user.role_assigned',
  eventId: string,
  timestamp: string,
  version: '1.0',
  data: {
    userId: string,
    roleId: string,
    roleName: string,
    assignedBy: string,
  }
}

// Event 5: User Status Changed
{
  eventType: 'user.status_changed',
  eventId: string,
  timestamp: string,
  version: '1.0',
  data: {
    userId: string,
    oldStatus: string,
    newStatus: string,
    reason?: string,
    changedBy: string,
  }
}
```

---

## 📥 Kafka Events (Consumer)

User Service **подписывается** на следующие события:

```typescript
// ========================================
// TOPIC: auth-events (от API Gateway)
// ========================================

// Event: user_authenticated
// Цель: Создать user record если его нет (first login)
{
  eventType: 'user_authenticated',
  data: {
    keycloakId: string,
    email: string,
    username: string,
    firstName: string,
    lastName: string,
  }
}
// Action: Создать user в БД если не существует

// Event: user_logged_in
// Цель: Update last_login_at
{
  eventType: 'user_logged_in',
  data: {
    userId: string,
    timestamp: string,
  }
}
// Action: Update users.last_login_at
```

---

## 🔐 Security & Permissions

### **Role Definitions:**

```typescript
// ========================================
// ROLES & PERMISSIONS
// ========================================

const ROLES = {
  ADMIN: {
    name: 'Admin',
    permissions: [
      'users:read',
      'users:write',
      'users:delete',
      'roles:manage',
      'analytics:view',
      '*', // Full access
    ]
  },
  
  HR: {
    name: 'HR',
    permissions: [
      'users:read',         // Can view users
      'interviews:*',       // Full interview access
      'candidates:*',       // Full candidate access
      'analytics:view',     // View analytics
    ]
  },
  
  CANDIDATE: {
    name: 'Candidate',
    permissions: [
      'users:read_own',     // Can only read own profile
      'users:write_own',    // Can only update own profile
      'interviews:take',    // Can take interviews
    ]
  },
  
  VIEWER: {
    name: 'Viewer',
    permissions: [
      'users:read',         // Read-only user access
      'interviews:read',    // Read-only interview access
      'analytics:view',     // View analytics
    ]
  }
};
```

### **Permission Checks:**

```typescript
// User Service предоставляет endpoint для проверки permissions
GET /users/:userId/permissions
Response: {
  userId: string,
  roles: string[],
  permissions: string[],
}

// API Gateway использует это для authorization
```

---

## 🏗️ Service Architecture (CQRS + DDD + Clean Architecture)

```typescript
// ========================================
// FOLDER STRUCTURE
// ========================================

apps/user-service/
├── src/
│   ├── main.ts                                    // Bootstrap
│   ├── app.module.ts                              // Root module
│   │
│   ├── domain/                                    // 📦 DOMAIN LAYER (Business Logic)
│   │   ├── aggregates/
│   │   │   └── user.aggregate.ts                  // User Aggregate Root
│   │   │
│   │   ├── entities/
│   │   │   ├── profile.entity.ts                  // Profile Entity (part of User aggregate)
│   │   │   └── preference.entity.ts               // Preference Entity
│   │   │
│   │   ├── value-objects/
│   │   │   ├── email.vo.ts                        // Email Value Object
│   │   │   ├── user-status.vo.ts                  // UserStatus enum as VO
│   │   │   └── full-name.vo.ts                    // FullName Value Object
│   │   │
│   │   ├── events/
│   │   │   ├── user-created.event.ts              // Domain Event
│   │   │   ├── user-updated.event.ts
│   │   │   ├── user-suspended.event.ts
│   │   │   ├── user-deleted.event.ts
│   │   │   ├── role-assigned.event.ts
│   │   │   └── role-removed.event.ts
│   │   │
│   │   ├── repositories/                          // Repository Interfaces
│   │   │   ├── user.repository.interface.ts
│   │   │   ├── role.repository.interface.ts
│   │   │   └── user-read.repository.interface.ts  // Read-only queries
│   │   │
│   │   ├── services/                              // Domain Services
│   │   │   └── user-permission.service.ts         // Complex permission logic
│   │   │
│   │   └── exceptions/
│   │       ├── user.exceptions.ts                 // User-specific exceptions
│   │       └── role.exceptions.ts
│   │
│   ├── application/                               // 📦 APPLICATION LAYER (Use Cases)
│   │   ├── commands/
│   │   │   ├── create-user/
│   │   │   │   ├── create-user.command.ts
│   │   │   │   ├── create-user.handler.ts
│   │   │   │   └── create-user.handler.spec.ts
│   │   │   ├── update-user/
│   │   │   │   ├── update-user.command.ts
│   │   │   │   ├── update-user.handler.ts
│   │   │   │   └── update-user.handler.spec.ts
│   │   │   ├── suspend-user/
│   │   │   │   ├── suspend-user.command.ts
│   │   │   │   └── suspend-user.handler.ts
│   │   │   ├── delete-user/
│   │   │   │   ├── delete-user.command.ts
│   │   │   │   └── delete-user.handler.ts
│   │   │   ├── assign-role/
│   │   │   │   ├── assign-role.command.ts
│   │   │   │   └── assign-role.handler.ts
│   │   │   ├── remove-role/
│   │   │   │   ├── remove-role.command.ts
│   │   │   │   └── remove-role.handler.ts
│   │   │   ├── upload-avatar/
│   │   │   │   ├── upload-avatar.command.ts
│   │   │   │   └── upload-avatar.handler.ts
│   │   │   └── update-preferences/
│   │   │       ├── update-preferences.command.ts
│   │   │       └── update-preferences.handler.ts
│   │   │
│   │   ├── queries/
│   │   │   ├── get-user/
│   │   │   │   ├── get-user.query.ts
│   │   │   │   ├── get-user.handler.ts
│   │   │   │   └── get-user.handler.spec.ts
│   │   │   ├── get-current-user/
│   │   │   │   ├── get-current-user.query.ts
│   │   │   │   └── get-current-user.handler.ts
│   │   │   ├── list-users/
│   │   │   │   ├── list-users.query.ts
│   │   │   │   └── list-users.handler.ts
│   │   │   ├── get-user-permissions/
│   │   │   │   ├── get-user-permissions.query.ts
│   │   │   │   └── get-user-permissions.handler.ts
│   │   │   ├── get-user-by-keycloak-id/
│   │   │   │   ├── get-user-by-keycloak-id.query.ts
│   │   │   │   └── get-user-by-keycloak-id.handler.ts
│   │   │   └── get-user-stats/
│   │   │       ├── get-user-stats.query.ts
│   │   │       └── get-user-stats.handler.ts
│   │   │
│   │   ├── dto/                                   // DTOs for API
│   │   │   ├── requests/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   ├── assign-role.dto.ts
│   │   │   │   └── update-preferences.dto.ts
│   │   │   └── responses/
│   │   │       ├── user.response.dto.ts
│   │   │       ├── user-list.response.dto.ts
│   │   │       ├── user-permissions.response.dto.ts
│   │   │       └── user-stats.response.dto.ts
│   │   │
│   │   ├── event-handlers/                        // Application Event Handlers
│   │   │   ├── user-created.handler.ts            // Handles UserCreatedEvent
│   │   │   ├── user-updated.handler.ts
│   │   │   └── role-assigned.handler.ts
│   │   │
│   │   └── application.module.ts
│   │
│   ├── infrastructure/                            // 📦 INFRASTRUCTURE LAYER
│   │   ├── persistence/
│   │   │   ├── database.module.ts
│   │   │   ├── entities/
│   │   │   │   ├── user.entity.ts                 // TypeORM Entity (DB schema)
│   │   │   │   ├── role.entity.ts
│   │   │   │   ├── user-role.entity.ts
│   │   │   │   ├── preference.entity.ts
│   │   │   │   └── processed-event.entity.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── typeorm-user.repository.ts     // Implementation of IUserRepository
│   │   │   │   ├── typeorm-user-read.repository.ts
│   │   │   │   ├── typeorm-role.repository.ts
│   │   │   │   └── repository.providers.ts        // DI providers
│   │   │   │
│   │   │   ├── mappers/
│   │   │   │   ├── user.mapper.ts                 // Entity ↔ Domain Model
│   │   │   │   └── role.mapper.ts
│   │   │   │
│   │   │   └── migrations/
│   │   │       ├── 1234567890123-CreateUsersTable.ts
│   │   │       ├── 1234567890124-CreateRolesTable.ts
│   │   │       ├── 1234567890125-CreateUserRolesTable.ts
│   │   │       └── 1234567890126-CreateProcessedEventsTable.ts
│   │   │
│   │   ├── kafka/
│   │   │   ├── kafka.module.ts
│   │   │   ├── producers/
│   │   │   │   ├── user-event.producer.ts
│   │   │   │   └── kafka.producer.interface.ts
│   │   │   └── consumers/
│   │   │       ├── auth-event.consumer.ts
│   │   │       └── consumer.providers.ts
│   │   │
│   │   ├── storage/
│   │   │   ├── storage.module.ts
│   │   │   ├── minio.service.ts                   // MinIO implementation
│   │   │   └── storage.interface.ts               // Storage abstraction
│   │   │
│   │   └── http/
│   │       ├── controllers/
│   │       │   ├── users.controller.ts            // REST endpoints
│   │       │   ├── roles.controller.ts
│   │       │   ├── internal.controller.ts         // Internal API
│   │       │   └── health.controller.ts
│   │       │
│   │       ├── guards/
│   │       │   ├── roles.guard.ts
│   │       │   ├── permissions.guard.ts
│   │       │   └── internal-service.guard.ts
│   │       │
│   │       └── decorators/
│   │           ├── roles.decorator.ts
│   │           ├── permissions.decorator.ts
│   │           └── current-user.decorator.ts
│   │
│   ├── shared/                                    // 📦 SHARED (Cross-cutting)
│   │   ├── base/
│   │   │   ├── base.aggregate-root.ts             // Abstract Aggregate Root
│   │   │   ├── base.entity.ts
│   │   │   └── base.value-object.ts
│   │   │
│   │   ├── exceptions/
│   │   │   ├── domain.exception.ts
│   │   │   └── application.exception.ts
│   │   │
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── tracing.interceptor.ts
│   │   │
│   │   └── utils/
│   │       ├── result.ts                          // Result<T, E> pattern
│   │       └── uuid.generator.ts
│   │
│   └── config/
│       ├── database.config.ts
│       ├── kafka.config.ts
│       ├── storage.config.ts
│       └── app.config.ts
│
├── test/
│   ├── unit/
│   │   ├── domain/
│   │   │   ├── aggregates/
│   │   │   │   └── user.aggregate.spec.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── email.vo.spec.ts
│   │   │   │   └── full-name.vo.spec.ts
│   │   │   └── services/
│   │   │       └── user-permission.service.spec.ts
│   │   │
│   │   └── application/
│   │       ├── commands/
│   │       │   └── create-user.handler.spec.ts
│   │       └── queries/
│   │           └── get-user.handler.spec.ts
│   │
│   ├── integration/
│   │   ├── repositories/
│   │   │   └── user.repository.spec.ts
│   │   ├── kafka/
│   │   │   ├── producer.spec.ts
│   │   │   └── consumer.spec.ts
│   │   └── storage/
│   │       └── minio.service.spec.ts
│   │
│   └── e2e/
│       ├── user-crud.e2e-spec.ts
│       ├── role-assignment.e2e-spec.ts
│       ├── avatar-upload.e2e-spec.ts
│       └── permissions.e2e-spec.ts
│
├── docs/
│   ├── architecture.md
│   ├── domain-model.md
│   └── api-contracts.md
│
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## 🔄 Integration Points

### **With API Gateway:**

```typescript
// API Gateway вызывает User Service для:

1. Get user by Keycloak ID (after OAuth login)
   GET /internal/users/by-keycloak/:id
   
2. Get user permissions (for authorization)
   GET /users/:userId/permissions
   
3. Enrich JWT с user data
   GET /users/:userId/roles
```

### **With Other Services:**

```typescript
// User Service НЕ вызывает другие сервисы напрямую
// Все коммуникации через Kafka events

// Другие сервисы подписываются на user-events:
- Interview Service слушает user.created (для owner validation)
- Notification Service слушает user.created (для welcome email)
- Billing Service слушает user.created (для trial setup)
- Analytics Service слушает все user events
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "kafkajs": "^2.2.4",
    "minio": "^7.1.3",
    "multer": "^1.4.5-lts.1",
    "winston": "^3.11.0",
    "@opentelemetry/api": "^1.7.0"
  }
}
```

---

## 📐 CQRS + DDD Implementation Examples

### **1. Domain Layer - User Aggregate**

```typescript
// domain/aggregates/user.aggregate.ts
import { AggregateRoot } from '@nestjs/cqrs';
import { Email } from '../value-objects/email.vo';
import { FullName } from '../value-objects/full-name.vo';
import { UserStatus } from '../value-objects/user-status.vo';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserUpdatedEvent } from '../events/user-updated.event';
import { UserSuspendedEvent } from '../events/user-suspended.event';
import { DomainException } from '../../shared/exceptions/domain.exception';

export class User extends AggregateRoot {
  private constructor(
    private readonly _id: string,
    private readonly _keycloakId: string,
    private _email: Email,
    private _fullName: FullName,
    private _status: UserStatus,
    private _avatarUrl?: string,
    private _bio?: string,
    private _emailVerified: boolean = false,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {
    super();
  }

  // ========================================
  // FACTORY METHODS
  // ========================================
  
  static create(
    id: string,
    keycloakId: string,
    email: Email,
    fullName: FullName,
  ): User {
    const user = new User(
      id,
      keycloakId,
      email,
      fullName,
      UserStatus.active(),
    );
    
    // Domain Event
    user.apply(new UserCreatedEvent(
      user.id,
      user.email.value,
      user.keycloakId,
      user.fullName.firstName,
      user.fullName.lastName,
    ));
    
    return user;
  }

  static reconstitute(
    id: string,
    keycloakId: string,
    email: Email,
    fullName: FullName,
    status: UserStatus,
    avatarUrl?: string,
    bio?: string,
    emailVerified?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
  ): User {
    // Reconstitute from DB without emitting events
    return new User(
      id,
      keycloakId,
      email,
      fullName,
      status,
      avatarUrl,
      bio,
      emailVerified,
      createdAt,
      updatedAt,
    );
  }

  // ========================================
  // BUSINESS LOGIC (Domain Methods)
  // ========================================
  
  updateProfile(fullName: FullName, bio?: string): void {
    this.ensureNotDeleted();
    this.ensureNotSuspended();
    
    const changes: any = {};
    
    if (!this._fullName.equals(fullName)) {
      this._fullName = fullName;
      changes.fullName = { firstName: fullName.firstName, lastName: fullName.lastName };
    }
    
    if (bio !== undefined && bio !== this._bio) {
      this._bio = bio;
      changes.bio = bio;
    }
    
    if (Object.keys(changes).length > 0) {
      this._updatedAt = new Date();
      this.apply(new UserUpdatedEvent(this._id, changes));
    }
  }

  changeEmail(email: Email): void {
    this.ensureNotDeleted();
    
    if (this._email.equals(email)) {
      return; // No change
    }
    
    this._email = email;
    this._emailVerified = false; // Reset verification
    this._updatedAt = new Date();
    
    this.apply(new UserUpdatedEvent(this._id, { 
      email: email.value,
      emailVerified: false,
    }));
  }

  suspend(reason: string, suspendedBy: string): void {
    this.ensureNotDeleted();
    
    if (this._status.isSuspended()) {
      throw new DomainException('User is already suspended');
    }
    
    this._status = UserStatus.suspended();
    this._updatedAt = new Date();
    
    this.apply(new UserSuspendedEvent(
      this._id,
      reason,
      suspendedBy,
    ));
  }

  activate(): void {
    this.ensureNotDeleted();
    
    this._status = UserStatus.active();
    this._updatedAt = new Date();
    
    this.apply(new UserUpdatedEvent(this._id, { status: 'active' }));
  }

  uploadAvatar(avatarUrl: string): void {
    this.ensureNotDeleted();
    this.ensureNotSuspended();
    
    this._avatarUrl = avatarUrl;
    this._updatedAt = new Date();
    
    this.apply(new UserUpdatedEvent(this._id, { avatarUrl }));
  }

  // ========================================
  // INVARIANTS (Business Rules)
  // ========================================
  
  private ensureNotDeleted(): void {
    if (this._status.isDeleted()) {
      throw new DomainException('Cannot perform operation on deleted user');
    }
  }

  private ensureNotSuspended(): void {
    if (this._status.isSuspended()) {
      throw new DomainException('Cannot perform operation on suspended user');
    }
  }

  // ========================================
  // GETTERS (No setters - immutability!)
  // ========================================
  
  get id(): string { return this._id; }
  get keycloakId(): string { return this._keycloakId; }
  get email(): Email { return this._email; }
  get fullName(): FullName { return this._fullName; }
  get status(): UserStatus { return this._status; }
  get avatarUrl(): string | undefined { return this._avatarUrl; }
  get bio(): string | undefined { return this._bio; }
  get emailVerified(): boolean { return this._emailVerified; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  
  get isActive(): boolean { return this._status.isActive(); }
  get isSuspended(): boolean { return this._status.isSuspended(); }
  get isDeleted(): boolean { return this._status.isDeleted(); }
}
```

---

### **2. Value Objects**

```typescript
// domain/value-objects/email.vo.ts
import { ValueObject } from '../../shared/base/base.value-object';
import { DomainException } from '../../shared/exceptions/domain.exception';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  static create(email: string): Email {
    if (!email) {
      throw new DomainException('Email is required');
    }

    const normalized = email.toLowerCase().trim();

    if (!this.EMAIL_REGEX.test(normalized)) {
      throw new DomainException('Invalid email format');
    }

    return new Email({ value: normalized });
  }

  get value(): string {
    return this.props.value;
  }
}

// domain/value-objects/full-name.vo.ts
import { ValueObject } from '../../shared/base/base.value-object';
import { DomainException } from '../../shared/exceptions/domain.exception';

interface FullNameProps {
  firstName: string;
  lastName: string;
}

export class FullName extends ValueObject<FullNameProps> {
  private constructor(props: FullNameProps) {
    super(props);
  }

  static create(firstName: string, lastName: string): FullName {
    if (!firstName || !lastName) {
      throw new DomainException('First name and last name are required');
    }

    if (firstName.length > 50 || lastName.length > 50) {
      throw new DomainException('Name is too long');
    }

    return new FullName({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

// domain/value-objects/user-status.vo.ts
import { ValueObject } from '../../shared/base/base.value-object';

type UserStatusValue = 'active' | 'suspended' | 'deleted';

interface UserStatusProps {
  value: UserStatusValue;
}

export class UserStatus extends ValueObject<UserStatusProps> {
  private constructor(props: UserStatusProps) {
    super(props);
  }

  static active(): UserStatus {
    return new UserStatus({ value: 'active' });
  }

  static suspended(): UserStatus {
    return new UserStatus({ value: 'suspended' });
  }

  static deleted(): UserStatus {
    return new UserStatus({ value: 'deleted' });
  }

  static fromString(value: string): UserStatus {
    if (!['active', 'suspended', 'deleted'].includes(value)) {
      throw new Error('Invalid user status');
    }
    return new UserStatus({ value: value as UserStatusValue });
  }

  isActive(): boolean {
    return this.props.value === 'active';
  }

  isSuspended(): boolean {
    return this.props.value === 'suspended';
  }

  isDeleted(): boolean {
    return this.props.value === 'deleted';
  }

  get value(): UserStatusValue {
    return this.props.value;
  }
}
```

---

### **3. Commands & Handlers**

```typescript
// application/commands/create-user/create-user.command.ts
export class CreateUserCommand {
  constructor(
    public readonly keycloakId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {}
}

// application/commands/create-user/create-user.handler.ts
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateUserCommand } from './create-user.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { Email } from '../../../domain/value-objects/email.vo';
import { FullName } from '../../../domain/value-objects/full-name.vo';
import { UserAlreadyExistsException } from '../../../domain/exceptions/user.exceptions';
import { v4 as uuid } from 'uuid';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    // 1. Check if user already exists
    const existingUser = await this.userRepository.findByKeycloakId(
      command.keycloakId,
    );

    if (existingUser) {
      throw new UserAlreadyExistsException(command.email);
    }

    // 2. Create Value Objects
    const email = Email.create(command.email);
    const fullName = FullName.create(command.firstName, command.lastName);

    // 3. Create Aggregate
    const user = User.create(
      uuid(),
      command.keycloakId,
      email,
      fullName,
    );

    // 4. Save to repository
    await this.userRepository.save(user);

    // 5. Publish domain events
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    user.clearEvents();

    return user;
  }
}
```

---

### **4. Queries & Handlers**

```typescript
// application/queries/get-user/get-user.query.ts
export class GetUserQuery {
  constructor(public readonly userId: string) {}
}

// application/queries/get-user/get-user.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserQuery } from './get-user.query';
import { User } from '../../../domain/aggregates/user.aggregate';
import { IUserReadRepository } from '../../../domain/repositories/user-read.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUserQuery): Promise<User> {
    const user = await this.userReadRepository.findById(query.userId);

    if (!user) {
      throw new UserNotFoundException(query.userId);
    }

    return user;
  }
}
```

---

### **5. Repository Interfaces & Implementations**

```typescript
// domain/repositories/user.repository.interface.ts
import { User } from '../aggregates/user.aggregate';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByKeycloakId(keycloakId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  delete(id: string): Promise<void>;
}

// infrastructure/persistence/repositories/typeorm-user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/aggregates/user.aggregate';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly mapper: UserMapper,
  ) {}

  async save(user: User): Promise<void> {
    const entity = this.mapper.toEntity(user);
    await this.repository.save(entity);
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { keycloakId } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
```

---

### **6. Controller using CQRS**

```typescript
// infrastructure/http/controllers/users.controller.ts
import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../../../application/commands/create-user/create-user.command';
import { UpdateUserCommand } from '../../../application/commands/update-user/update-user.command';
import { GetUserQuery } from '../../../application/queries/get-user/get-user.query';
import { GetCurrentUserQuery } from '../../../application/queries/get-current-user/get-current-user.query';
import { CreateUserDto } from '../../../application/dto/requests/create-user.dto';
import { UpdateUserDto } from '../../../application/dto/requests/update-user.dto';
import { UserResponseDto } from '../../../application/dto/responses/user.response.dto';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('me')
  async getCurrentUser(@CurrentUser() userId: string): Promise<UserResponseDto> {
    const user = await this.queryBus.execute(
      new GetCurrentUserQuery(userId),
    );
    return UserResponseDto.fromDomain(user);
  }

  @Put('me')
  async updateCurrentUser(
    @CurrentUser() userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.commandBus.execute(
      new UpdateUserCommand(
        userId,
        dto.firstName,
        dto.lastName,
        dto.bio,
      ),
    );
    return UserResponseDto.fromDomain(user);
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.queryBus.execute(new GetUserQuery(id));
    return UserResponseDto.fromDomain(user);
  }
}
```

---

## 🧪 Testing Strategy (Comprehensive)

### **Unit Tests**

```typescript
// ========================================
// DOMAIN TESTS (Pure Business Logic)
// ========================================

// test/unit/domain/aggregates/user.aggregate.spec.ts
describe('User Aggregate', () => {
  describe('create', () => {
    it('should create user with valid data', () => {
      const email = Email.create('test@example.com');
      const fullName = FullName.create('John', 'Doe');
      
      const user = User.create('id', 'keycloak-id', email, fullName);
      
      expect(user.email.value).toBe('test@example.com');
      expect(user.isActive).toBe(true);
    });

    it('should emit UserCreatedEvent', () => {
      const user = User.create(...);
      const events = user.getUncommittedEvents();
      
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
    });
  });

  describe('suspend', () => {
    it('should suspend active user', () => {
      const user = User.create(...);
      
      user.suspend('Policy violation', 'admin-id');
      
      expect(user.isSuspended).toBe(true);
    });

    it('should throw if user already suspended', () => {
      const user = User.create(...);
      user.suspend('reason', 'admin');
      
      expect(() => user.suspend('reason', 'admin'))
        .toThrow('User is already suspended');
    });

    it('should emit UserSuspendedEvent', () => {
      const user = User.create(...);
      user.clearEvents(); // Clear creation event
      
      user.suspend('reason', 'admin');
      const events = user.getUncommittedEvents();
      
      expect(events[0]).toBeInstanceOf(UserSuspendedEvent);
    });
  });
});

// test/unit/domain/value-objects/email.vo.spec.ts
describe('Email Value Object', () => {
  it('should create valid email', () => {
    const email = Email.create('test@example.com');
    expect(email.value).toBe('test@example.com');
  });

  it('should normalize email to lowercase', () => {
    const email = Email.create('TEST@EXAMPLE.COM');
    expect(email.value).toBe('test@example.com');
  });

  it('should throw on invalid format', () => {
    expect(() => Email.create('invalid-email'))
      .toThrow('Invalid email format');
  });

  it('should be equal to another email with same value', () => {
    const email1 = Email.create('test@example.com');
    const email2 = Email.create('test@example.com');
    
    expect(email1.equals(email2)).toBe(true);
  });
});

// ========================================
// APPLICATION TESTS (Command/Query Handlers)
// ========================================

// test/unit/application/commands/create-user.handler.spec.ts
describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findByKeycloakId: jest.fn(),
    } as any;

    mockEventBus = {
      publish: jest.fn(),
    } as any;

    handler = new CreateUserHandler(mockRepository, mockEventBus);
  });

  it('should create user successfully', async () => {
    mockRepository.findByKeycloakId.mockResolvedValue(null);
    
    const command = new CreateUserCommand(
      'keycloak-123',
      'test@example.com',
      'John',
      'Doe',
    );

    const user = await handler.execute(command);

    expect(user.email.value).toBe('test@example.com');
    expect(mockRepository.save).toHaveBeenCalledWith(user);
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('should throw if user already exists', async () => {
    mockRepository.findByKeycloakId.mockResolvedValue({} as User);

    const command = new CreateUserCommand(...);

    await expect(handler.execute(command))
      .rejects
      .toThrow(UserAlreadyExistsException);
  });
});
```

---

### **Integration Tests**

```typescript
// ========================================
// REPOSITORY TESTS (with real DB)
// ========================================

// test/integration/repositories/user.repository.spec.ts
describe('TypeOrmUserRepository (Integration)', () => {
  let repository: TypeOrmUserRepository;
  let connection: DataSource;

  beforeAll(async () => {
    connection = await createTestDatabaseConnection();
    repository = new TypeOrmUserRepository(...);
  });

  afterAll(async () => {
    await connection.destroy();
  });

  afterEach(async () => {
    await connection.query('TRUNCATE TABLE users CASCADE');
  });

  it('should save and retrieve user', async () => {
    const user = User.create(...);
    
    await repository.save(user);
    const found = await repository.findById(user.id);

    expect(found).toBeDefined();
    expect(found.id).toBe(user.id);
  });

  it('should update existing user', async () => {
    const user = User.create(...);
    await repository.save(user);

    user.updateProfile(FullName.create('Jane', 'Smith'));
    await repository.save(user);

    const updated = await repository.findById(user.id);
    expect(updated.fullName.firstName).toBe('Jane');
  });
});

// ========================================
// KAFKA TESTS
// ========================================

// test/integration/kafka/producer.spec.ts
describe('Kafka Producer (Integration)', () => {
  let producer: UserEventProducer;
  let kafka: Kafka;

  beforeAll(async () => {
    kafka = new Kafka({ brokers: ['localhost:9092'] });
    producer = new UserEventProducer(...);
  });

  it('should publish user.created event', async () => {
    const event = new UserCreatedEvent(...);

    await producer.publish(event);

    // Verify event was published (consume it back)
    const consumer = kafka.consumer({ groupId: 'test' });
    await consumer.subscribe({ topic: 'user-events' });
    
    const messages = [];
    await consumer.run({
      eachMessage: async ({ message }) => {
        messages.push(JSON.parse(message.value.toString()));
      },
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(messages[0].eventType).toBe('user.created');
  });
});
```

---

### **E2E Tests**

```typescript
// ========================================
// END-TO-END TESTS (Full flow)
// ========================================

// test/e2e/user-crud.e2e-spec.ts
describe('User CRUD (E2E)', () => {
  let app: INestApplication;
  let userService: UsersService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users/me (GET)', async () => {
    // Mock JWT token
    const token = createMockJWT({ userId: 'test-id' });

    return request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', `access_token=${token}`)
      .expect(200)
      .expect(res => {
        expect(res.body.email).toBeDefined();
        expect(res.body.firstName).toBeDefined();
      });
  });

  it('/users/me (PUT) - should update profile', async () => {
    const token = createMockJWT({ userId: 'test-id' });

    return request(app.getHttpServer())
      .put('/users/me')
      .set('Cookie', `access_token=${token}`)
      .send({
        firstName: 'UpdatedName',
        lastName: 'UpdatedLastName',
        bio: 'New bio',
      })
      .expect(200)
      .expect(res => {
        expect(res.body.firstName).toBe('UpdatedName');
      });
  });

  it('should publish Kafka event on user update', async () => {
    const kafkaConsumer = setupTestKafkaConsumer('user-events');
    const events = [];

    kafkaConsumer.on('message', msg => {
      events.push(JSON.parse(msg));
    });

    // Update user via API
    await request(app.getHttpServer())
      .put('/users/me')
      .send({ firstName: 'New' });

    // Wait for Kafka event
    await waitFor(() => events.length > 0);

    expect(events[0].eventType).toBe('user.updated');
  });
});
```

---

### **Coverage Targets**

```typescript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/domain/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/application/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
```

---

## 🚀 Initial Data Seeds

```typescript
// ========================================
// ROLES SEED (database/seeds/roles.seed.ts)
// ========================================

const initialRoles = [
  {
    name: 'Admin',
    displayName: 'Administrator',
    description: 'Full system access',
    permissions: ['*'],
  },
  {
    name: 'HR',
    displayName: 'HR Manager',
    description: 'Manage interviews and candidates',
    permissions: [
      'users:read',
      'interviews:*',
      'candidates:*',
      'analytics:view',
    ],
  },
  {
    name: 'Candidate',
    displayName: 'Candidate',
    description: 'Take interviews',
    permissions: [
      'users:read_own',
      'users:write_own',
      'interviews:take',
    ],
  },
  {
    name: 'Viewer',
    displayName: 'Viewer',
    description: 'Read-only access',
    permissions: [
      'users:read',
      'interviews:read',
      'analytics:view',
    ],
  },
];
```

---

## 📊 Metrics & Monitoring

```typescript
// ========================================
// PROMETHEUS METRICS
// ========================================

- user_service_users_total                 // Total users count
- user_service_users_by_role               // Users count by role (gauge)
- user_service_users_by_status             // Users count by status (gauge)
- user_service_api_requests_total          // API requests count
- user_service_api_duration_seconds        // API response time
- user_service_kafka_events_published      // Kafka events published
- user_service_kafka_events_consumed       // Kafka events consumed
- user_service_avatar_uploads_total        // Avatar uploads count
- user_service_avatar_upload_size_bytes    // Avatar file sizes

// ========================================
// LOKI LOGS
// ========================================

{service_name="user-service", level="ERROR"}  // All errors
{service_name="user-service", category="kafka"}  // Kafka events
{service_name="user-service", action="user_created"}  // User creation logs
```

---

## ⚙️ Configuration

```typescript
// ========================================
// ENVIRONMENT VARIABLES
// ========================================

// Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=user_service_db
DATABASE_USER=user_service
DATABASE_PASSWORD=<secret>

// Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=user-service
KAFKA_CONSUMER_GROUP=user-service-group

// MinIO (Avatar Storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=<key>
MINIO_SECRET_KEY=<secret>
MINIO_BUCKET=user-avatars
MINIO_USE_SSL=false

// Service
PORT=3003
NODE_ENV=development
LOG_LEVEL=debug

// Limits
MAX_AVATAR_SIZE_MB=5
```

---

## 📅 ENHANCED WEEK-BY-WEEK PLAN (with CQRS + DDD)

### **Day 1-2: Foundation & Domain Layer**

```typescript
✅ TASKS:

1. Setup Project Structure
   - Create folder structure (domain, application, infrastructure, shared)
   - Install dependencies (@nestjs/cqrs, typeorm, uuid, etc.)
   - Setup TypeORM configuration
   - Setup migrations

2. Domain Layer - Core Models
   - User Aggregate (domain/aggregates/user.aggregate.ts)
   - Value Objects (Email, FullName, UserStatus)
   - Domain Events (UserCreatedEvent, UserUpdatedEvent, etc.)
   - Domain Exceptions (user.exceptions.ts)
   - Repository Interfaces (domain/repositories/)

3. Shared Infrastructure
   - Base classes (BaseAggregateRoot, BaseEntity, BaseValueObject)
   - Result<T, E> pattern implementation
   - Domain Exception classes

📦 DELIVERABLE: Domain model реализован и покрыт unit тестами
```

---

### **Day 3: Application Layer - CQRS**

```typescript
✅ TASKS:

1. Commands
   - CreateUserCommand + Handler
   - UpdateUserCommand + Handler
   - SuspendUserCommand + Handler
   - AssignRoleCommand + Handler
   - UploadAvatarCommand + Handler

2. Queries
   - GetUserQuery + Handler
   - GetCurrentUserQuery + Handler
   - ListUsersQuery + Handler
   - GetUserPermissionsQuery + Handler
   - GetUserByKeycloakIdQuery + Handler

3. DTOs
   - Request DTOs (CreateUserDto, UpdateUserDto, etc.)
   - Response DTOs (UserResponseDto, UserListResponseDto)

4. Event Handlers
   - UserCreatedEventHandler (publish to Kafka)
   - UserUpdatedEventHandler (publish to Kafka)

📦 DELIVERABLE: CQRS handlers покрыты unit тестами
```

---

### **Day 4: Infrastructure Layer**

```typescript
✅ TASKS:

1. Persistence
   - TypeORM Entities (UserEntity, RoleEntity, etc.)
   - Mappers (UserMapper - Domain ↔ Entity)
   - TypeORM Repositories (TypeOrmUserRepository)
   - Migrations (CreateUsersTable, CreateRolesTable, etc.)
   - Seeds (Initial roles)

2. HTTP Layer
   - Controllers (UsersController, RolesController, InternalController)
   - Guards (RolesGuard, PermissionsGuard, InternalServiceGuard)
   - Decorators (CurrentUser, Roles, Permissions)

3. Kafka Integration
   - UserEventProducer (publish domain events)
   - AuthEventConsumer (consume auth events)
   - Event idempotency (ProcessedEventEntity)

4. Storage
   - MinIO service (avatar upload)
   - Storage interface abstraction

📦 DELIVERABLE: Infrastructure working, integration tests passing
```

---

### **Day 5: API Gateway Integration & RBAC**

```typescript
✅ TASKS:

1. API Gateway Routing
   - Add user-service proxy routes
   - JWT enrichment с user data
   - Internal endpoints protection

2. RBAC Implementation
   - Role guards на endpoints
   - Permission checks
   - Default role assignment (Candidate)

3. Kafka Event Flow
   - user_authenticated → create user (first login)
   - user_logged_in → update last_login_at
   - user.created → publish to Kafka
   - Verify idempotency works

📦 DELIVERABLE: Full integration working end-to-end
```

---

### **Day 6-7: Testing & Documentation**

```typescript
✅ TASKS:

1. Tests
   - Unit tests для Domain (Aggregate, VOs, Domain Services)
   - Unit tests для Application (Command/Query handlers)
   - Integration tests (Repositories, Kafka)
   - E2E tests (Full flows через API)
   - Coverage >85%

2. Documentation
   - Architecture diagram
   - Domain model documentation
   - API documentation (Swagger)
   - Testing guide
   - Deployment guide

3. Monitoring & Logging
   - Prometheus metrics
   - Loki logs integration
   - Health checks
   - Tracing setup

📦 DELIVERABLE: Production-ready service с полной документацией
```

---

## 🎯 Success Criteria (Enhanced)

### **Functional:**
- ✅ User CRUD works через API Gateway (CQRS pattern)
- ✅ RBAC enforced на всех endpoints
- ✅ Avatar upload работает (MinIO)
- ✅ Kafka events публикуются (domain events)
- ✅ Auth events обрабатываются (idempotent)
- ✅ Value Objects validate business rules
- ✅ Aggregates enforce invariants
- ✅ Commands separated from Queries

### **Non-Functional:**
- ✅ API response time <100ms (p95)
- ✅ Test coverage >85% (domain >90%)
- ✅ Zero data loss на Kafka events
- ✅ Swagger documentation доступна
- ✅ Health checks работают
- ✅ Graceful shutdown implemented

### **Architecture:**
- ✅ Clean separation of concerns (Domain, Application, Infrastructure)
- ✅ Domain logic isolated from infrastructure
- ✅ Repository pattern implemented
- ✅ CQRS pattern implemented
- ✅ DDD tactical patterns used (Aggregates, VOs, Domain Events)
- ✅ Dependency Inversion Principle followed

### **Integration:**
- ✅ API Gateway проксирует к user-service
- ✅ JWT enrichment с user roles работает
- ✅ Frontend может получить user profile
- ✅ Kafka exactly-once delivery guaranteed

### **Testing:**
- ✅ Unit tests для domain logic (isolated, fast)
- ✅ Unit tests для application handlers (with mocks)
- ✅ Integration tests для repositories (real DB)
- ✅ Integration tests для Kafka (real broker)
- ✅ E2E tests для full flows
- ✅ Test coverage reports generated

---

## 📚 Learning Outcomes

После завершения User Service ты будешь знать:

### **DDD Patterns:**
- ✅ Как создавать Aggregates и защищать invariants
- ✅ Как использовать Value Objects для бизнес-правил
- ✅ Как применять Domain Events для loose coupling
- ✅ Когда использовать Domain Services

### **CQRS:**
- ✅ Как разделить Commands и Queries
- ✅ Как организовать handlers
- ✅ Как тестировать CQRS handlers
- ✅ Когда CQRS оправдан

### **Clean Architecture:**
- ✅ Как организовать слои (Domain → Application → Infrastructure)
- ✅ Как применять Dependency Inversion
- ✅ Как изолировать domain logic от frameworks
- ✅ Как использовать Repository pattern

### **Testing:**
- ✅ Как тестировать domain logic (isolated unit tests)
- ✅ Как тестировать handlers (with mocks)
- ✅ Как писать integration tests
- ✅ Как писать E2E tests

### **Enterprise Patterns:**
- ✅ Event Sourcing basics (domain events)
- ✅ Idempotency patterns
- ✅ Mappers (Domain ↔ Persistence)
- ✅ Result pattern для error handling

---

## 🚀 Post-Week 1 Roadmap

### **Week 2-3: Interview Service (применяем те же паттерны)**
- Interview Aggregate с business logic
- CQRS для interview operations
- Integration с User Service
- Public API для кандидатов

### **Week 4+: Advanced Patterns**
- Event Sourcing для AI analysis history
- Saga pattern для multi-step processes
- Read models optimization (CQRS read side)
- Eventual consistency handling

---

## 💡 Best Practices & Tips

### **Domain Layer:**
```typescript
✅ DO:
- Keep domain logic pure (no dependencies on infrastructure)
- Use Value Objects для validation
- Emit Domain Events для side effects
- Protect invariants в Aggregates

❌ DON'T:
- Don't inject repositories в domain models
- Don't use ORMs в domain layer
- Don't leak infrastructure concerns
- Don't create anemic domain models
```

### **Application Layer:**
```typescript
✅ DO:
- Keep handlers thin (orchestration only)
- Use CommandBus/QueryBus для dispatching
- Test handlers с mocked repositories
- Return domain models from handlers

❌ DON'T:
- Don't put business logic в handlers
- Don't bypass CQRS (direct repository calls)
- Don't mix commands and queries
- Don't return entities directly to controllers
```

### **Infrastructure Layer:**
```typescript
✅ DO:
- Implement interfaces defined в domain
- Use Mappers для Entity ↔ Domain conversion
- Isolate infrastructure concerns
- Make adapters swappable

❌ DON'T:
- Don't expose ORM entities outside infrastructure
- Don't pollute domain with infrastructure
- Don't hardcode infrastructure details
- Don't skip integration tests
```

### **Testing:**
```typescript
✅ DO:
- Test domain logic thoroughly (>90% coverage)
- Use real DB для integration tests
- Test full flows в E2E tests
- Mock external dependencies

❌ DON'T:
- Don't mock domain logic
- Don't skip integration tests
- Don't test implementation details
- Don't write brittle tests
```

---

## 📝 Next Steps After Week 1

### **1. Interview Service** будет использовать user-service для:
   - Validation что user существует (Query: GetUserQuery)
   - Проверка что user имеет HR role (Query: GetUserPermissionsQuery)
   - Owner assignment для interviews
   - **Применить те же CQRS + DDD паттерны!**

### **2. Frontend** получит:
   - User profile page (через QueryBus)
   - Edit profile form (через CommandBus)
   - Avatar upload UI (через UploadAvatarCommand)
   - Role badges в UI

### **3. Monitoring** покажет:
   - User growth metrics
   - Role distribution
   - API performance
   - Command/Query execution times
   - Event publishing metrics

### **4. Documentation** будет включать:
   - Domain model diagram
   - CQRS flow diagrams
   - API contracts
   - Testing guide
   - Deployment guide

---

## 🎓 Recommended Resources

**Books:**
- "Domain-Driven Design" by Eric Evans
- "Implementing Domain-Driven Design" by Vaughn Vernon
- "Clean Architecture" by Robert Martin

**Articles:**
- Martin Fowler - CQRS pattern
- Martin Fowler - Event Sourcing
- Microsoft - CQRS + DDD patterns

**NestJS:**
- NestJS CQRS module documentation
- NestJS Microservices documentation

---

**Документация обновлена: 2025-10-01**
**Архитектура: CQRS + DDD + Clean Architecture**
**Готов к началу разработки enterprise-grade User Service! 🚀**
