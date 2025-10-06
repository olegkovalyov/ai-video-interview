# Logging Guide - Structured Logging с Winston и Loki

**Версия:** 1.0  
**Дата:** 2025-10-06

---

## 🎯 Обзор

Платформа использует **structured logging** с Winston для генерации логов и **Loki** для агрегации и хранения.

**Ключевые особенности:**
- ✅ JSON formatted logs для машинной обработки
- ✅ Прямая отправка в Loki через winston-loki transport (real-time)
- ✅ Разные форматы для console (красиво) и файлов (JSON)
- ✅ Автоматический трейсинг с traceId
- ✅ Level-based logging (debug, info, warn, error)

---

## 🏗️ Архитектура Logging

```
┌──────────────────────────────────────────┐
│          NestJS Application              │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │      LoggerService (Winston)       │  │
│  │                                    │  │
│  │  ┌──────────┐    ┌──────────────┐ │  │
│  │  │ Console  │    │ Loki Direct  │ │  │
│  │  │ Transport│    │ Transport    │ │  │
│  │  │ (pretty) │    │ (JSON, RT)   │ │  │
│  │  └────┬─────┘    └──────┬───────┘ │  │
│  └───────┼─────────────────┼─────────┘  │
└──────────┼─────────────────┼────────────┘
           │                 │
           ▼                 ▼
      Terminal         Loki :3100
                            │
                            ▼
                      Grafana :3002
```

---

## 📝 Формат логов

### Console (Development)
```
[info] api-gateway - HTTP: GET /users/me 200
[debug] user-service - Query executed in 45ms
[error] api-gateway - Auth failed: Token expired
```

### File & Loki (JSON)
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
  "traceId": "abc123def456",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## 🔧 LoggerService API

### Основные методы

#### `info(message, context?)`
```typescript
this.logger.info('User logged in', {
  userId: user.id,
  email: user.email,
  ip: req.ip
});
```

#### `debug(message, context?)`
```typescript
this.logger.debug('Database query executed', {
  query: 'SELECT * FROM users',
  duration: 45,
  rows: 1
});
```

#### `warn(message, context?)`
```typescript
this.logger.warn('API rate limit approaching', {
  userId: user.id,
  currentRate: 95,
  limit: 100
});
```

#### `error(message, error?, context?)`
```typescript
this.logger.error('Failed to create user', error, {
  userId: data.id,
  action: 'user_create'
});
```

---

### Специальные методы для структурированных данных

#### `debugObject(message, data, context?)`
Для логирования сложных объектов:
```typescript
this.logger.debugObject('OIDC Discovery config', {
  issuerUrl: this.issuerUrl,
  discoveryUrl: this.discoveryUrl,
  clientId: this.clientId,
  clientSecretPresent: !!this.clientSecret
});
```

**Результат в Grafana:**
```json
{
  "message": "OIDC Discovery config",
  "data": {
    "issuerUrl": "http://localhost:8090/realms/ai-video-interview",
    "discoveryUrl": "...",
    "clientId": "ai-video-interview-app",
    "clientSecretPresent": false
  }
}
```

#### `infoObject(message, data, context?)`
То же для info level:
```typescript
this.logger.infoObject('User profile updated', {
  userId: user.id,
  changes: {
    fullName: 'John Doe',
    companyName: 'Acme Inc'
  },
  timestamp: new Date()
});
```

---

### Domain-specific методы

#### `authLog(action, context)`
```typescript
this.logger.authLog('login_success', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});
```

#### `httpLog(method, url, statusCode, duration, context?)`
```typescript
this.logger.httpLog('POST', '/api/users', 201, 150, {
  userId: user.id
});
```

#### `kafkaLog(action, topic, success, context?)`
```typescript
this.logger.kafkaLog('publish', 'user-events', true, {
  eventId: event.id,
  eventType: 'user.created'
});
```

#### `performanceLog(operation, duration, context?)`
```typescript
this.logger.performanceLog('database_query', 1250, {
  query: 'Complex join query',
  rows: 1000
});
```

---

## 📊 Log Levels

### Debug
**Когда использовать:** Детальная отладочная информация
```typescript
this.logger.debug('JWT token validation started');
this.logger.debug('Cookie value extracted', { cookies });
this.logger.debugObject('Request headers', req.headers);
```

### Info
**Когда использовать:** Важные события в нормальном flow
```typescript
this.logger.info('User logged in successfully');
this.logger.info('Interview created', { interviewId });
this.logger.authLog('token_refresh_success', { userId });
```

### Warn
**Когда использовать:** Потенциальные проблемы, не критичные
```typescript
this.logger.warn('Token expiring soon', { expiresIn: 60 });
this.logger.warn('Rate limit approaching', { currentRate: 95 });
this.logger.warn('Slow query detected', { duration: 1200 });
```

### Error
**Когда использовать:** Ошибки и исключения
```typescript
this.logger.error('Failed to authenticate user', error, {
  userId: user?.id,
  action: 'auth_failed'
});

this.logger.error('Database connection lost', error);
```

---

## 🚀 Best Practices

### ✅ DO: Используй structured logging

```typescript
// ✅ GOOD: Структурированный лог
this.logger.info('User created', {
  userId: user.id,
  email: user.email,
  action: 'user_create'
});

// ❌ BAD: Строка без структуры
this.logger.info(`User ${user.id} created with email ${user.email}`);
```

### ✅ DO: Добавляй context

```typescript
// ✅ GOOD: Контекст присутствует
this.logger.error('Payment failed', error, {
  userId: user.id,
  orderId: order.id,
  amount: order.amount,
  paymentMethod: 'stripe'
});

// ❌ BAD: Нет контекста
this.logger.error('Payment failed', error);
```

### ✅ DO: Используй правильные levels

```typescript
// ✅ GOOD
this.logger.debug('Processing request');  // Debug level
this.logger.info('User logged in');       // Info level
this.logger.warn('Cache miss');           // Warn level
this.logger.error('DB error', error);     // Error level

// ❌ BAD: Всё на info
this.logger.info('Processing request');
this.logger.info('User logged in');
this.logger.info('Cache miss');
this.logger.info('DB error');
```

### ✅ DO: Логируй важные события

```typescript
// Auth events
this.logger.authLog('login_success', { userId });
this.logger.authLog('logout', { userId });

// Business events
this.logger.info('Interview created', { interviewId, userId });
this.logger.info('Candidate submitted response', { sessionId });

// Errors
this.logger.error('Failed to process payment', error, { orderId });
```

### ❌ DON'T: Логируй sensitive data

```typescript
// ❌ BAD: Пароли, токены
this.logger.debug('User credentials', {
  password: user.password,  // NEVER!
  token: accessToken        // NEVER!
});

// ✅ GOOD: Только безопасные данные
this.logger.debug('User authenticated', {
  userId: user.id,
  tokenPresent: !!accessToken
});
```

### ❌ DON'T: Используй console.log

```typescript
// ❌ BAD: Не попадает в Loki
console.log('User created:', user);

// ✅ GOOD: Попадает везде
this.logger.infoObject('User created', user);
```

---

## 🔍 Поиск логов в Grafana

### Базовые queries

#### Все логи сервиса:
```logql
{service="api-gateway"}
```

#### По уровню:
```logql
{service="api-gateway"} | json | level="error"
```

#### По сообщению:
```logql
{service="api-gateway"} | json | message=~"auth.*"
```

#### По userId:
```logql
{service="api-gateway"} | json | userId="123e4567-..."
```

### Продвинутые queries

#### Все ошибки аутентификации:
```logql
{service="api-gateway"} 
  | json 
  | category="authentication"
  | level="ERROR"
```

#### Медленные запросы (> 1s):
```logql
{service="user-service"} 
  | json 
  | category="performance"
  | duration > 1000
```

#### Trace по request ID:
```logql
{service="api-gateway"} 
  | json 
  | traceId="abc123def456"
  | line_format "{{.timestamp}} [{{.level}}] {{.message}}"
```

#### Структурированные данные:
```logql
{service="api-gateway"} 
  | json 
  | data!=""
  | line_format "{{.message}} | Data: {{.data}}"
```

---

## 🎨 Grafana Dashboard Panels

### Panel 1: Error Rate
```logql
sum(rate({service="api-gateway"} | json | level="ERROR" [5m])) by (service)
```

### Panel 2: Auth Events
```logql
{service="api-gateway"} | json | category="authentication"
```

### Panel 3: Slow Operations
```logql
{service=~".*"} 
  | json 
  | category="performance"
  | duration > 500
  | line_format "{{.service}}: {{.message}} ({{.duration}}ms)"
```

### Panel 4: Top Users by Activity
```logql
sum by (userId) (
  count_over_time({service="api-gateway"} | json | userId!="" [1h])
)
```

---

## 🛠️ Configuration

### Winston Logger Setup

```typescript
// apps/api-gateway/src/logger/logger.service.ts

// Формат для файлов - чистый JSON для Loki
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Формат для консоли - красивый вывод
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ level, message, service, ...meta }) => {
    return `[${level}] ${service} - ${message}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  defaultMeta: {
    service: 'api-gateway',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  },
  transports: [
    // Console для разработки
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat
    }),
    
    // Loki transport - прямая отправка (REAL-TIME)
    new LokiTransport({
      host: 'http://localhost:3100',
      labels: { 
        service: 'api-gateway', 
        environment: process.env.NODE_ENV || 'development' 
      },
      json: true,
      format: fileFormat,
      replaceTimestamp: true,
      level: 'debug',
      onConnectionError: (err) => console.error('Loki error:', err)
    }),
    
    // Файл (fallback)
    new winston.transports.File({
      filename: 'logs/api-gateway.log',
      level: 'debug',
      format: fileFormat,
      maxsize: 100 * 1024 * 1024, // 100MB
    })
  ]
});
```

---

## 🐛 Troubleshooting

### Логи не появляются в Grafana

**Проверь:**
1. Winston-Loki transport настроен:
```typescript
new LokiTransport({
  host: 'http://localhost:3100',
  level: 'debug'
})
```

2. Loki работает:
```bash
curl http://localhost:3100/ready
```

3. Логи отправляются:
```bash
# Должны быть в консоли при запуске
# "Loki transport initialized"
```

### Структурированные данные не видны

**Используй `debugObject()` вместо обычных методов:**
```typescript
// ❌ BAD
this.logger.debug('Data', { some: 'object' });

// ✅ GOOD
this.logger.debugObject('Data description', { some: 'object' });
```

### Слишком много debug логов

**Измени LOG_LEVEL:**
```bash
# .env
LOG_LEVEL=info  # Только info, warn, error
```

---

## 📚 Дополнительные ресурсы

- [Loki Queries](./queries/loki-queries.md) - Полезные LogQL queries
- [Grafana Dashboard Setup](./grafana-dashboards/) - Pre-configured dashboards
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)

---

**Последнее обновление:** 2025-10-06
