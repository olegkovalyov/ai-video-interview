# Event Catalog

**Полный каталог всех событий в системе**

---

## 📋 Auth Events

**Topic:** `auth-events`  
**Partition Key:** `userId`

### user.authenticated
Публикуется при успешной аутентификации

**Producer:** API Gateway  
**Consumers:** Analytics Service (future), Audit Service (future)

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
    "sessionId": "sess-550e8400-...",
    "authMethod": "oauth2",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### user.logged_out
Публикуется при logout

**Producer:** API Gateway  
**Consumers:** Analytics Service (future), Audit Service (future)

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "user.logged_out",
  "timestamp": 1728212400000,
  "version": "1.0",
  "source": "api-gateway",
  "payload": {
    "userId": "kc-123",
    "sessionId": "sess-550e8400-...",
    "logoutReason": "user_action"
  }
}
```

---

## 📋 User Events

**Topic:** `user-events`  
**Partition Key:** `userId`

### user.created
Публикуется при создании нового пользователя

**Producer:** User Service  
**Consumers:** Interview Service (для инициализации квот)

```json
{
  "eventId": "evt-550e8400-e29b-41d4-a716-446655440000",
  "eventType": "user.created",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "keycloakId": "kc-123",
    "email": "user@example.com",
    "fullName": "John Doe",
    "createdAt": "2025-10-06T10:00:00.000Z"
  }
}
```

### user.updated
Публикуется при обновлении профиля

**Producer:** User Service  
**Consumers:** -

```json
{
  "eventId": "evt-...",
  "eventType": "user.updated",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-...",
  "data": {
    "changes": {
      "fullName": "John Smith",
      "companyName": "Acme Inc"
    }
  }
}
```

### user.avatar_uploaded
Публикуется при загрузке аватара

**Producer:** User Service  
**Consumers:** User Service (для обновления storage_used)

```json
{
  "eventId": "evt-...",
  "eventType": "user.avatar_uploaded",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-...",
  "data": {
    "avatarUrl": "https://minio.example.com/avatars/user-123.jpg",
    "fileSize": 524288
  }
}
```

### user.deleted
Публикуется при удалении пользователя (soft delete)

**Producer:** User Service  
**Consumers:** Interview Service (удалить интервью), Media Service (удалить файлы)

```json
{
  "eventId": "evt-...",
  "eventType": "user.deleted",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-...",
  "data": {
    "deletedAt": "2025-10-06T10:00:00.000Z",
    "reason": "user_request"
  }
}
```

---

## 📋 Interview Events

**Topic:** `interview-events`  
**Partition Key:** `userId`

### interview.created
Публикуется при создании интервью

**Producer:** Interview Service  
**Consumers:** User Service (increment interviews_created)

```json
{
  "eventId": "evt-...",
  "eventType": "interview.created",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-...",
  "data": {
    "interviewId": "int-550e8400-...",
    "title": "Frontend Developer Interview",
    "questionsCount": 5,
    "createdAt": "2025-10-06T10:00:00.000Z"
  }
}
```

### interview.published
Публикуется когда интервью становится доступным для кандидатов

**Producer:** Interview Service  
**Consumers:** Notification Service (отправить invites)

```json
{
  "eventId": "evt-...",
  "eventType": "interview.published",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-...",
  "data": {
    "interviewId": "int-...",
    "publicLink": "https://app.example.com/i/abc123",
    "expiresAt": "2025-10-13T10:00:00.000Z"
  }
}
```

### interview.completed
Публикуется когда все кандидаты завершили интервью

**Producer:** Interview Service  
**Consumers:** Reporting Service (generate report)

```json
{
  "eventId": "evt-...",
  "eventType": "interview.completed",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-...",
  "data": {
    "interviewId": "int-...",
    "completedCandidates": 10,
    "completedAt": "2025-10-06T10:00:00.000Z"
  }
}
```

---

## 📋 Candidate Events

**Topic:** `candidate-events`  
**Partition Key:** `sessionId`

### candidate.started
Публикуется когда кандидат начинает интервью

**Producer:** Candidate Response Service  
**Consumers:** Interview Service (update session status)

```json
{
  "eventId": "evt-...",
  "eventType": "candidate.started",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "sessionId": "sess-550e8400-...",
  "data": {
    "interviewId": "int-...",
    "candidateEmail": "candidate@example.com",
    "startedAt": "2025-10-06T10:00:00.000Z",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### candidate.response_submitted
Публикуется при отправке ответа на вопрос

**Producer:** Candidate Response Service  
**Consumers:** Media Service (process video), Interview Service (update progress)

```json
{
  "eventId": "evt-...",
  "eventType": "candidate.response_submitted",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "sessionId": "sess-...",
  "data": {
    "responseId": "resp-...",
    "questionId": "q-...",
    "mediaFileId": "file-...",
    "duration": 120
  }
}
```

### candidate.completed
Публикуется когда кандидат завершает интервью

**Producer:** Candidate Response Service  
**Consumers:** Interview Service, Notification Service (notify HR), AI Analysis Service (start analysis)

```json
{
  "eventId": "evt-...",
  "eventType": "candidate.completed",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "sessionId": "sess-...",
  "data": {
    "interviewId": "int-...",
    "candidateEmail": "candidate@example.com",
    "completedAt": "2025-10-06T10:00:00.000Z",
    "responsesCount": 5,
    "totalDuration": 600
  }
}
```

---

## 📋 Media Events

**Topic:** `media-events`  
**Partition Key:** `userId`

### media.uploaded
Публикуется при успешной загрузке файла

**Producer:** Media Service  
**Consumers:** User Service (update storage_used), AI Analysis Service (if video/audio)

```json
{
  "eventId": "evt-...",
  "eventType": "media.uploaded",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-...",
  "data": {
    "fileId": "file-550e8400-...",
    "fileName": "response-video.mp4",
    "fileSize": 10485760,
    "mimeType": "video/mp4",
    "bucket": "interviews",
    "path": "/interviews/int-123/file-456.mp4"
  }
}
```

### media.processed
Публикуется после обработки медиа (конвертация, сжатие)

**Producer:** Media Service  
**Consumers:** Candidate Response Service (update status), Interview Service (mark ready)

```json
{
  "eventId": "evt-...",
  "eventType": "media.processed",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-...",
  "data": {
    "fileId": "file-...",
    "originalSize": 10485760,
    "processedSize": 5242880,
    "processingDuration": 45,
    "thumbnailUrl": "https://cdn.example.com/thumbnails/file-456.jpg"
  }
}
```

### media.deleted
Публикуется при удалении файла

**Producer:** Media Service  
**Consumers:** User Service (decrement storage_used)

```json
{
  "eventId": "evt-...",
  "eventType": "media.deleted",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-...",
  "data": {
    "fileId": "file-...",
    "fileSize": 5242880,
    "deletedAt": "2025-10-06T10:00:00.000Z"
  }
}
```

---

## 📋 AI Analysis Events

**Topic:** `analysis-events`  
**Partition Key:** `userId`

### analysis.started
Публикуется когда начинается AI анализ

**Producer:** AI Analysis Service  
**Consumers:** Interview Service (update analysis status)

```json
{
  "eventId": "evt-...",
  "eventType": "analysis.started",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-...",
  "data": {
    "analysisId": "analysis-...",
    "sessionId": "sess-...",
    "responseId": "resp-...",
    "analysisType": "transcription"
  }
}
```

### analysis.completed
Публикуется когда анализ завершен

**Producer:** AI Analysis Service  
**Consumers:** Interview Service, Reporting Service, Notification Service (notify HR)

```json
{
  "eventId": "evt-...",
  "eventType": "analysis.completed",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-...",
  "data": {
    "analysisId": "analysis-...",
    "sessionId": "sess-...",
    "transcription": "...",
    "sentiment": "positive",
    "skills": ["React", "TypeScript", "Problem Solving"],
    "overallScore": 8.5,
    "completedAt": "2025-10-06T10:05:00.000Z"
  }
}
```

---

## 📋 Notification Events

**Topic:** `notification-events`  
**Partition Key:** `userId`

### notification.sent
Публикуется при успешной отправке уведомления

**Producer:** Notification Service  
**Consumers:** -

```json
{
  "eventId": "evt-...",
  "eventType": "notification.sent",
  "timestamp": "2025-10-06T10:00:00.000Z",
  "userId": "123e4567-...",
  "data": {
    "notificationId": "notif-...",
    "type": "email",
    "to": "user@example.com",
    "subject": "Interview completed",
    "sentAt": "2025-10-06T10:00:00.000Z"
  }
}
```

---

## 📊 Event Schema Standard

Все события следуют единому формату:

```typescript
interface DomainEvent {
  eventId: string;          // UUID
  eventType: string;        // domain.action
  timestamp: string;        // ISO 8601
  userId?: string;          // Partition key (если есть)
  sessionId?: string;       // Alternative partition key
  data: Record<string, any>; // Event-specific data
  metadata?: {
    service: string;        // Сервис-publisher
    version: string;        // Event schema version
    correlationId?: string; // Request correlation
    causationId?: string;   // Parent event
  };
}
```

---

**Последнее обновление:** 2025-10-06
