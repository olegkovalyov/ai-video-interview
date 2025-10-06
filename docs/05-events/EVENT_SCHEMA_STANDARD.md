# Event Schema Standard

**Стандарт для всех событий в системе**

---

## 📋 Base Event Schema

```typescript
interface BaseEvent {
  eventId: string;          // UUID v4, уникальный идентификатор
  eventType: string;        // Format: "domain.action" (user.authenticated)
  timestamp: number;        // Unix timestamp in milliseconds
  version: string;          // Schema version (e.g., "1.0")
  source: string;           // Service that published event (e.g., "api-gateway")
  payload: Record<string, any>; // Event-specific data
}
```

**Пример:**
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "user.authenticated",
  "timestamp": 1728212400000,
  "version": "1.0",
  "source": "api-gateway",
  "payload": {
    "userId": "kc-123",
    "email": "user@example.com",
    "sessionId": "sess-abc-123",
    "authMethod": "oauth2"
  }
}
```

---

## ✅ Validation Rules

1. **eventId** - MUST be UUID v4
2. **eventType** - MUST follow `domain.action` pattern (lowercase with dot)
3. **timestamp** - MUST be Unix timestamp in milliseconds
4. **version** - MUST be semantic version string (e.g., "1.0")
5. **source** - MUST be service name that published the event
6. **payload** - MUST be valid JSON object with event-specific data
7. **payload.userId** - SHOULD be present для partitioning (если применимо)

---

## 🏗️ Event Types by Domain

### Auth Events (source: api-gateway)
- `user.authenticated` - успешная аутентификация
- `user.logged_out` - logout пользователя

### User Events (source: user-service)
- `user.created` - создание нового пользователя
- `user.updated` - обновление профиля
- `user.avatar_uploaded` - загрузка аватара
- `user.deleted` - удаление пользователя

### Interview Events (source: interview-service)
- `interview.created` - создание интервью
- `interview.published` - публикация интервью
- `interview.completed` - завершение интервью

### Media Events (source: media-service)
- `media.uploaded` - загрузка файла
- `media.processed` - обработка завершена
- `media.deleted` - удаление файла

---

## 📚 Examples

См. [Event Catalog](./EVENT_CATALOG.md) для конкретных примеров каждого типа события.

---

**Последнее обновление:** 2025-10-06
