# Authentication Services Architecture

## 📋 Overview

Рефакторинг `auth.service.ts` (584 строки) в несколько специализированных сервисов для лучшей maintainability и separation of concerns.

## 🏗️ Service Structure

```
auth/services/
├── auth-orchestrator.service.ts    # Координация auth flows (150 lines)
├── session-manager.service.ts      # Управление сессиями (100 lines)
├── auth-event-publisher.service.ts # Kafka события (120 lines)
├── redirect-uri.helper.ts          # Redirect URIs (50 lines)
└── index.ts                        # Public exports
```

---

## 🎯 Responsibilities

### 1. **AuthOrchestrator**

**Роль:** Главный координатор всех authentication flows

**Методы:**
- `initiateLogin()` - Инициирует OAuth2 login
- `initiateRegister()` - Инициирует OAuth2 registration
- `handleCallback()` - Обрабатывает OAuth2 callback
- `refreshTokens()` - Обновляет токены
- `logout()` - Выполняет logout
- `validateSession()` - Валидирует сессию

**Dependencies:**
- TokenService
- CookieService
- KeycloakService
- MetricsService
- LoggerService
- TraceService
- SessionManager
- AuthEventPublisher
- RedirectUriHelper

---

### 2. **SessionManager**

**Роль:** Управление пользовательскими сессиями

**Методы:**
- `validateSession()` - Валидирует access token из cookies
- `createSession()` - Создаёт сессию (устанавливает cookies)
- `destroySession()` - Уничтожает сессию (logout)
- `clearSession()` - Очищает cookies

**Dependencies:**
- TokenService
- CookieService
- KeycloakService
- LoggerService
- RedirectUriHelper

**Features:**
- Token extraction (body/cookies)
- UserInfo extraction before logout
- Token revocation
- End Session URL building

---

### 3. **AuthEventPublisher**

**Роль:** Публикация authentication событий в Kafka

**Методы:**
- `publishUserAuthenticated()` - Публикует событие аутентификации
- `publishUserLoggedOut()` - Публикует событие logout
- `logTokenRefresh()` - Логирует refresh (не публикует)

**Dependencies:**
- KafkaService
- LoggerService
- TraceService

**Features:**
- Automatic firstName/lastName extraction
- Error handling (не прерывает auth flow)
- Distributed tracing integration

---

### 4. **RedirectUriHelper**

**Роль:** Централизованное управление redirect URIs

**Методы:**
- `getDefaultCallbackUri()` - Возвращает дефолтный callback URI
- `getActualRedirectUri()` - Возвращает actual redirect URI
- `getPostLogoutRedirectUri()` - Возвращает post-logout URI
- `getFrontendOrigin()` - Возвращает frontend origin

**Dependencies:**
- ConfigService

**Features:**
- Централизованная конфигурация
- Fallback значения

---

## 🔄 Flow Diagram

### Login Flow:
```
AuthController
    ↓
AuthOrchestrator.initiateLogin()
    ↓
KeycloakService.getAuthorizationUrl()
    ↓
Return authUrl to frontend
```

### Callback Flow:
```
AuthController
    ↓
AuthOrchestrator.handleCallback()
    ├→ TokenService.exchangeCodeForTokens()
    ├→ SessionManager.createSession()
    └→ AuthEventPublisher.publishUserAuthenticated()
```

### Logout Flow:
```
AuthController
    ↓
AuthOrchestrator.logout()
    ├→ SessionManager.destroySession()
    │   ├→ TokenService.revokeTokens()
    │   └→ CookieService.clearAuthCookies()
    └→ AuthEventPublisher.publishUserLoggedOut()
```

---

## 🧪 Testing Strategy

### Unit Tests:
- ✅ **RedirectUriHelper** - Pure logic, no dependencies
- ✅ **AuthEventPublisher** - Mock KafkaService
- ✅ **SessionManager** - Mock Token/Cookie services
- ✅ **AuthOrchestrator** - Integration tests

### Integration Tests:
- ✅ Full auth flow (login → callback → refresh → logout)
- ✅ Kafka event publishing
- ✅ Session management

---

## 📝 Migration Guide

### Old Code (deprecated):
```typescript
import { AuthService } from './auth/auth.service';

constructor(private authService: AuthService) {}

await this.authService.initiateLogin();
```

### New Code (recommended):
```typescript
import { AuthOrchestrator } from './auth/services';

constructor(private authOrchestrator: AuthOrchestrator) {}

await this.authOrchestrator.initiateLogin();
```

---

## ⚠️ Backward Compatibility

`AuthService` оставлен для обратной совместимости и делегирует все вызовы к `AuthOrchestrator`.

**Deprecated:** Планируется удалить в версии 2.0

---

## 🚀 Future Improvements

1. **Service Proxy Layer** - для вызовов user-service/interview-service
2. **Circuit Breaker** - отказоустойчивость
3. **Rate Limiting** - защита endpoints
4. **Aggregation Services** - для dashboard/сложных view

---

## 📚 Related Documentation

- [Authentication Flow](../../docs/AUTHENTICATION_FLOW_DETAILED.md)
- [Kafka Events](../../docs/KAFKA_LOGGING_COMPLETE.md)
- [Session Management](../../docs/SESSION_MANAGEMENT.md)
