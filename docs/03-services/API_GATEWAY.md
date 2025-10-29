# API Gateway Service

**Статус:** ✅ Реализован  
**Порт:** 3001  
**Технологии:** NestJS, Passport JWT, Winston  
**Версия:** 1.0

---

## 🎯 Назначение

API Gateway — единая точка входа для всех клиентских запросов. Обрабатывает routing, authentication, rate limiting и логирование.

---

## ✅ Ответственность

### Что входит:
- **HTTP Routing** к микросервисам (proxy pattern)
- **JWT Token Validation** (Keycloak integration)
- **Rate Limiting** и throttling
- **Request/Response Logging** (structured logs)
- **CORS handling**
- **Health checks** aggregation
- **Metrics export** (Prometheus)
- **Distributed tracing** (Jaeger)

### Что НЕ входит:
- ❌ Бизнес-логика (это зона микросервисов)
- ❌ Хранение данных (stateless)
- ❌ Token generation (это Keycloak)
- ❌ User management (User Service)

---

## 🏗️ Архитектура

```
┌──────────────┐
│   Client     │
│ (Browser/App)│
└──────┬───────┘
       │ HTTP/HTTPS
       ▼
┌─────────────────────────────────────┐
│        API GATEWAY (3001)           │
│                                     │
│  ┌─────────────────────────────┐  │
│  │   JWT Auth Guard            │  │
│  │   (Passport JWT Strategy)   │  │
│  └─────────────┬───────────────┘  │
│                │ validated         │
│  ┌─────────────▼───────────────┐  │
│  │   Controllers               │  │
│  │   - AuthController          │  │
│  │   - UsersController         │  │
│  │   - InterviewsController    │  │
│  └─────────────┬───────────────┘  │
│                │                   │
│  ┌─────────────▼───────────────┐  │
│  │   Service Proxies           │  │
│  │   - UserServiceProxy        │  │
│  │   - InterviewServiceProxy   │  │
│  └─────────────┬───────────────┘  │
│                │                   │
└────────────────┼───────────────────┘
                 │ Internal HTTP
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌───────┐  ┌──────────┐  ┌────────┐
│ User  │  │Interview │  │ Media  │
│Service│  │ Service  │  │Service │
└───────┘  └──────────┘  └────────┘
```

---

## 📡 API Endpoints

### Authentication (`/auth`)

#### `POST /auth/login`
Инициализация OAuth login flow
```typescript
Request: {
  redirectUri?: string  // Optional, default from env
}

Response: {
  authUrl: string      // Keycloak auth URL
  state: string        // CSRF token
}
```

#### `GET /auth/callback`
OAuth callback handler
```typescript
Query: {
  code: string
  state: string
}

Response: {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: "Bearer"
}
```

#### `POST /auth/refresh`
Refresh access token
```typescript
Request: {
  refreshToken: string
}

Response: {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
```

#### `POST /auth/logout`
Logout и revoke tokens
```typescript
Headers: {
  Authorization: "Bearer <token>"
}

Response: {
  message: "Logged out successfully"
  endSessionUrl?: string  // Keycloak end session URL
}
```

---

### Users (`/users`)

#### `GET /users/me`
Получить профиль текущего пользователя
```typescript
Headers: {
  Authorization: "Bearer <token>"
}

Response: {
  id: string
  email: string
  profile: {
    fullName: string
    avatarUrl?: string
    companyName?: string
  }
  stats: {
    interviewsCreated: number
    storageUsed: number
  }
}
```

#### `PUT /users/me`
Обновить профиль
```typescript
Headers: {
  Authorization: "Bearer <token>"
}

Request: {
  profile: {
    fullName?: string
    companyName?: string
    phone?: string
  }
}

Response: User
```

---

### Interviews (`/interviews`)

> ⚠️ В разработке - базовый CRUD реализован

#### `GET /interviews`
Список интервью текущего пользователя

#### `POST /interviews`
Создать интервью

#### `GET /interviews/:id`
Получить интервью

#### `PUT /interviews/:id`
Обновить интервью

#### `DELETE /interviews/:id`
Удалить интервью

---

## 🔐 Authentication Flow

### 1. Login Flow
```
User → Frontend
        │
        ▼ POST /auth/login
     API Gateway
        │
        ▼ Return authUrl
     Frontend
        │
        ▼ Redirect
    Keycloak Login Page
        │ User enters credentials
        ▼ Callback with code
     API Gateway (/auth/callback)
        │ Exchange code for tokens
        ▼ POST /token
    Keycloak
        │
        ▼ Return tokens
     API Gateway
        │
        ▼ Set cookies + return
     Frontend (logged in)
```

### 2. Request Flow with JWT
```
User → Frontend
        │ API call with token
        ▼ GET /users/me
     API Gateway
        │
        ▼ JwtAuthGuard validates
    Passport JWT
        │ Verify signature
        │ Check expiration
        │ Extract user ID
        ▼ Success
     Controller
        │
        ▼ Proxy to service
    User Service
        │
        ▼ Return data
     Frontend
```

### 3. Token Refresh Flow
```
Frontend → Detects 401
           │
           ▼ POST /auth/refresh
        API Gateway
           │
           ▼ Validate refresh token
        Keycloak
           │
           ▼ Return new tokens
        API Gateway
           │
           ▼ Update cookies
        Frontend (retry original request)
```

---

## 🗄️ Database

**Нет собственной базы данных** - API Gateway stateless.

Использует:
- **Redis** - для rate limiting counters (опционально)
- **Keycloak PostgreSQL** - для хранения tokens (внешний сервис)

---

## 📨 Events

### Published Events:

#### `auth-events` topic

API Gateway публикует authentication events через `AuthEventPublisher`:

**user.authenticated**
```typescript
{
  eventId: string,
  eventType: "user.authenticated",
  timestamp: string,
  userId: string,
  data: {
    email: string,
    sessionId: string,
    authMethod: "oauth2" | "jwt_refresh",
    firstName?: string,
    lastName?: string
  }
}
```
Публикуется при:
- Успешном login через OAuth (callback)
- JWT token refresh (если есть userInfo)

**user.logged_out**
```typescript
{
  eventId: string,
  eventType: "user.logged_out", 
  timestamp: string,
  userId: string,
  data: {
    sessionId: string,
    logoutReason: "user_action" | "token_expired" | "admin_action"
  }
}
```
Публикуется при logout пользователя.

**Важно:** Kafka errors не блокируют auth flow. Если Kafka недоступен, аутентификация продолжается.

### Subscribed Events:
Нет - API Gateway не слушает события.

> API Gateway фокусируется на HTTP routing и публикует только auth events.

---

## 🔧 Configuration

### Environment Variables

```bash
# Application
PORT=3001
NODE_ENV=development

# Keycloak OAuth
KEYCLOAK_ISSUER_URL=http://localhost:8090/realms/ai-video-interview
KEYCLOAK_CLIENT_ID=ai-video-interview-app
KEYCLOAK_CLIENT_SECRET=your-secret
KEYCLOAK_REDIRECT_URI=http://localhost:3001/auth/callback

# JWT
JWT_SECRET=your-jwt-secret
JWT_AUDIENCE=ai-video-interview-app

# Services URLs (internal)
USER_SERVICE_URL=http://localhost:3003
INTERVIEW_SERVICE_URL=http://localhost:3004
MEDIA_SERVICE_URL=http://localhost:3006

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=api-gateway
# Note: API Gateway only publishes events, no consumer group needed

# Logging
LOG_LEVEL=debug

# Observability
LOKI_HOST=http://localhost:3100
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

---

## 📊 Metrics & Health

### Health Check Endpoint
```
GET /health

Response:
{
  status: "ok",
  timestamp: "2025-10-06T10:00:00Z",
  uptime: 12345,
  services: {
    userService: "healthy",
    interviewService: "healthy",
    keycloak: "healthy"
  }
}
```

### Prometheus Metrics Endpoint
```
GET /metrics

# Metrics exposed:
- http_request_duration_seconds (histogram)
- http_requests_total (counter)
- http_request_errors_total (counter)
- jwt_validation_duration_seconds (histogram)
- service_proxy_duration_seconds (histogram by service)
- active_connections (gauge)
```

### Key Metrics to Monitor:
- **Request latency** (P50, P95, P99)
- **Error rate** (4xx, 5xx)
- **JWT validation errors**
- **Service proxy errors** (downstream failures)
- **Rate limit hits**

---

## 🚨 Error Handling

### Standard Error Response
```typescript
{
  statusCode: number
  message: string
  error?: string          // Error type
  timestamp: string
  path: string
  traceId?: string        // Jaeger trace ID
}
```

### Error Codes

| Status | Scenario | Message |
|--------|----------|---------|
| 401 | Token missing/invalid | "Unauthorized" |
| 401 | Token expired | "Token expired" |
| 403 | Insufficient permissions | "Forbidden" |
| 404 | Route not found | "Not found" |
| 429 | Rate limit exceeded | "Too many requests" |
| 500 | Internal error | "Internal server error" |
| 502 | Service unavailable | "Bad gateway" |
| 504 | Service timeout | "Gateway timeout" |

---

## 🔒 Security

### Rate Limiting
```typescript
// Global rate limit: 100 requests per 15 minutes
@UseGuards(ThrottlerGuard)

// Per-endpoint overrides:
@Throttle(5, 60)  // 5 requests per minute
async sensitiveEndpoint() {}
```

### CORS Configuration
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### JWT Validation
```typescript
// Validates:
- Signature (using Keycloak public key)
- Expiration (exp claim)
- Audience (aud claim)
- Issuer (iss claim)
```

---

## 📝 Logging

### Log Levels
- **debug:** Request/response details, JWT validation
- **info:** Successful requests, auth events
- **warn:** Rate limit hits, retry attempts
- **error:** Failed requests, service errors

### Log Format (JSON)
```json
{
  "timestamp": "2025-10-06T10:00:00.000Z",
  "level": "info",
  "service": "api-gateway",
  "message": "HTTP: GET /users/me 200",
  "method": "GET",
  "url": "/users/me",
  "statusCode": 200,
  "duration": 45,
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "traceId": "abc123def456"
}
```

### Structured Logging
```typescript
// Все логи идут в Loki через winston-loki transport
this.logger.info('Auth: token_refresh_success', {
  userId: user.id,
  action: 'token_refresh',
  traceId: this.traceService.getTraceId()
});
```

---

## 🧪 Testing

### Unit Tests
```bash
cd apps/api-gateway
npm run test
```

### Integration Tests
```bash
npm run test:e2e
```

### Key Test Cases
- ✅ JWT validation (valid/expired/invalid tokens)
- ✅ OAuth flow (login, callback, refresh, logout)
- ✅ Service proxy routing
- ✅ Rate limiting
- ✅ Error handling
- ✅ Health checks

---

## 🐛 Troubleshooting

### Keycloak connection issues
```bash
# Check Keycloak is running
curl http://localhost:8090/realms/ai-video-interview/.well-known/openid-configuration

# Verify client credentials in Keycloak Admin Console
```

### JWT validation errors
```bash
# Check JWT secret matches
# Check audience claim: aud: ["ai-video-interview-app"]
# Verify token hasn't expired
```

### Service proxy timeouts
```bash
# Check downstream services are running
docker-compose ps

# Check internal URLs are correct
echo $USER_SERVICE_URL
```

### Port already in use
```bash
npm run cleanup:ports
# or
lsof -ti:3001 | xargs kill -9
```

---

## 📂 Project Structure

```
apps/api-gateway/
├── src/
│   ├── main.ts                    # Bootstrap
│   ├── app.module.ts              # Root module
│   │
│   ├── auth/                      # Authentication
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts     # Auth endpoints
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts  # JWT validation
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts    # Passport JWT
│   │   └── services/
│   │       ├── auth-orchestrator.service.ts
│   │       ├── session-manager.service.ts
│   │       └── token.service.ts
│   │
│   ├── users/                     # User endpoints
│   │   ├── users.controller.ts
│   │   └── users.module.ts
│   │
│   ├── interviews/                # Interview endpoints
│   │   ├── interviews.controller.ts
│   │   └── interviews.module.ts
│   │
│   ├── proxies/                   # Service proxies
│   │   ├── base/
│   │   │   └── base-service-proxy.ts
│   │   ├── user-service.proxy.ts
│   │   └── interview-service.proxy.ts
│   │
│   ├── logger/                    # Logging
│   │   ├── logger.module.ts
│   │   └── logger.service.ts      # Winston + Loki
│   │
│   ├── metrics/                   # Observability
│   │   ├── metrics.module.ts
│   │   └── metrics.service.ts     # Prometheus
│   │
│   └── tracing/                   # Distributed tracing
│       ├── tracing.module.ts
│       └── tracing.service.ts     # Jaeger
│
├── test/
│   └── e2e/
│       ├── auth.e2e-spec.ts
│       └── users.e2e-spec.ts
│
├── package.json
├── tsconfig.json
└── nest-cli.json
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

### Docker
```bash
docker build -t ai-interview/api-gateway:latest .
docker run -p 3001:3001 --env-file .env ai-interview/api-gateway
```

---

## 🔗 Dependencies

### Internal Services:
- **User Service** (3003) - user profiles, stats
- **Interview Service** (3004) - interviews, questions
- **Media Service** (3006) - file uploads

### External Services:
- **Keycloak** (8090) - OAuth, JWT validation
- **Kafka** (9092) - auth events publishing
- **Loki** (3100) - log aggregation
- **Jaeger** (14268) - distributed tracing
- **Prometheus** (9090) - metrics scraping

---

## 📚 Additional Resources

- [Authentication Flow](../09-security/AUTHENTICATION_FLOW.md)
- [API Conventions](../04-api/REST_CONVENTIONS.md)
- [Observability Guide](../08-observability/OVERVIEW.md)

---

**Последнее обновление:** 2025-10-06
