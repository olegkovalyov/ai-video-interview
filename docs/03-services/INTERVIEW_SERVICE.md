# Interview Service

**Статус:** ✅ Templates API готов (Phase 9)  
**Порт:** 3004  
**База данных:** PostgreSQL (ai_video_interview_interview)  
**Технологии:** NestJS, TypeORM, PostgreSQL, Kafka, CQRS, DDD  

---

## 📋 Обзор

Interview Service управляет шаблонами интервью и вопросами. Реализован на основе Clean Architecture с применением паттернов CQRS и DDD.

**Основные возможности:**
- ✅ Управление шаблонами интервью (CRUD)
- ✅ Управление вопросами в шаблонах
- ✅ Публикация шаблонов
- ✅ RBAC (HR и Admin роли)
- ✅ Пагинация и фильтрация
- ✅ Ownership checks для HR

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:3004/api
```

### Authentication
Все endpoints требуют JWT токен в header:
```
Authorization: Bearer <jwt_token>
```

---

## 📚 Templates API

### 1. Create Template
**Endpoint:** `POST /api/templates`  
**Roles:** HR, Admin  
**Description:** Создание нового шаблона интервью

**Request Body:**
```json
{
  "title": "Frontend Developer Interview",
  "description": "Questions about React and TypeScript",
  "settings": {
    "totalTimeLimit": 3600,
    "allowRetakes": false,
    "showTimer": true,
    "randomizeQuestions": false
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid"
}
```

**Validation Rules:**
- `title`: 5-200 символов, обязательное
- `description`: 10-1000 символов, обязательное
- `settings`: опциональное

---

### 2. List Templates
**Endpoint:** `GET /api/templates`  
**Roles:** HR, Admin  
**Description:** Получение списка шаблонов с пагинацией

**Query Parameters:**
```typescript
{
  status?: 'draft' | 'active' | 'archived',  // Фильтр по статусу
  page?: number,     // Номер страницы (по умолчанию 1)
  limit?: number     // Размер страницы (по умолчанию 10, макс 100)
}
```

**Response:** `200 OK`
```json
{
  "templates": [
    {
      "id": "uuid",
      "title": "Frontend Developer Interview",
      "description": "Questions about React and TypeScript",
      "status": "draft",
      "createdBy": "uuid",
      "createdAt": "2025-11-05T20:00:00Z",
      "updatedAt": "2025-11-05T20:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

**RBAC:**
- HR видит только свои шаблоны
- Admin видит все шаблоны

---

### 3. Get Template by ID
**Endpoint:** `GET /api/templates/:id`  
**Roles:** HR, Admin  
**Description:** Получение шаблона по ID с вопросами

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Frontend Developer Interview",
  "description": "Questions about React and TypeScript",
  "status": "draft",
  "createdBy": "uuid",
  "settings": {
    "totalTimeLimit": 3600,
    "allowRetakes": false,
    "showTimer": true,
    "randomizeQuestions": false
  },
  "questions": [
    {
      "id": "uuid",
      "text": "Describe your experience with React",
      "type": "video",
      "order": 1,
      "timeLimit": 120,
      "required": true,
      "hints": "Focus on hooks and state management"
    }
  ],
  "createdAt": "2025-11-05T20:00:00Z",
  "updatedAt": "2025-11-05T20:00:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Шаблон не найден
- `403 Forbidden` - HR пытается получить чужой шаблон

---

### 4. Add Question to Template
**Endpoint:** `POST /api/templates/:id/questions`  
**Roles:** HR, Admin  
**Description:** Добавление вопроса в шаблон

**Request Body:**
```json
{
  "text": "Describe your experience with React",
  "type": "video",
  "order": 1,
  "timeLimit": 120,
  "required": true,
  "hints": "Focus on hooks and state management"
}
```

**Field Constraints:**
- `text`: 10-500 символов, обязательное
- `type`: enum ['video', 'text', 'multiple_choice'], обязательное
- `order`: number >= 1, обязательное
- `timeLimit`: 30-600 секунд, обязательное
- `required`: boolean, обязательное
- `hints`: 0-200 символов, опциональное

**Response:** `201 Created`
```json
{
  "id": "uuid"
}
```

**Error Responses:**
- `400 Bad Request` - Невалидные данные
- `403 Forbidden` - HR пытается изменить чужой шаблон
- `404 Not Found` - Шаблон не найден

---

### 5. Remove Question from Template
**Endpoint:** `DELETE /api/templates/:id/questions/:questionId`  
**Roles:** HR, Admin  
**Description:** Удаление вопроса из шаблона

**Response:** `204 No Content`

**Error Responses:**
- `403 Forbidden` - HR пытается изменить чужой шаблон
- `404 Not Found` - Шаблон или вопрос не найден

---

### 6. Publish Template
**Endpoint:** `PUT /api/templates/:id/publish`  
**Roles:** HR, Admin  
**Description:** Публикация шаблона (статус draft → active)

**Business Rules:**
- Можно публиковать только draft шаблоны
- Шаблон должен содержать хотя бы 1 вопрос

**Response:** `200 OK`
```json
{
  "status": "active"
}
```

**Error Responses:**
- `403 Forbidden` - HR пытается опубликовать чужой шаблон
- `500 Internal Server Error` - Domain validation error (нет вопросов, неправильный статус)

---

### 7. Update Template
**Endpoint:** `PUT /api/templates/:id`  
**Roles:** HR, Admin  
**Description:** Обновление метаданных шаблона

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "settings": {
    "totalTimeLimit": 7200,
    "allowRetakes": true,
    "showTimer": false,
    "randomizeQuestions": true
  }
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "description": "Updated description",
  "status": "draft",
  // ... full template object
}
```

**Error Responses:**
- `400 Bad Request` - Невалидные данные
- `403 Forbidden` - HR пытается изменить чужой шаблон

---

### 8. Archive Template
**Endpoint:** `DELETE /api/templates/:id`  
**Roles:** HR, Admin  
**Description:** Архивирование шаблона (soft delete, статус → archived)

**Response:** `204 No Content`

**Error Responses:**
- `403 Forbidden` - HR пытается удалить чужой шаблон

---

### 9. Get Template Questions
**Endpoint:** `GET /api/templates/:id/questions`  
**Roles:** HR, Admin  
**Description:** Получение всех вопросов шаблона

**Response:** `200 OK`
```json
{
  "questions": [
    {
      "id": "uuid",
      "text": "Describe your experience with React",
      "type": "video",
      "order": 1,
      "timeLimit": 120,
      "required": true,
      "hints": "Focus on hooks and state management",
      "createdAt": "2025-11-05T20:00:00Z"
    }
  ]
}
```

**Note:** Вопросы отсортированы по полю `order` (ASC)

---

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "userId": "uuid",
  "role": "hr",
  "roles": ["hr"]
}
```

### Roles
- **HR**: Может создавать и управлять только своими шаблонами
- **Admin**: Может видеть и управлять всеми шаблонами

### Guards
1. **JwtAuthGuard** - Проверка наличия валидного JWT токена
2. **RolesGuard** - Проверка роли пользователя (@Roles decorator)

---

## ❌ Error Responses

### Standard Error Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### HTTP Status Codes
- `200 OK` - Успешный запрос
- `201 Created` - Ресурс создан
- `204 No Content` - Успешное удаление
- `400 Bad Request` - Невалидные данные
- `401 Unauthorized` - Отсутствует токен
- `403 Forbidden` - Нет прав доступа
- `404 Not Found` - Ресурс не найден
- `500 Internal Server Error` - Внутренняя ошибка (domain validation)

---

## 📊 Data Models

### TemplateStatus
```typescript
type TemplateStatus = 'draft' | 'active' | 'archived';
```

### QuestionType
```typescript
type QuestionType = 'video' | 'text' | 'multiple_choice';
```

### InterviewSettings
```typescript
interface InterviewSettings {
  totalTimeLimit: number;      // Секунды, общее время на интервью
  allowRetakes: boolean;        // Разрешить повторные попытки
  showTimer: boolean;           // Показывать таймер кандидату
  randomizeQuestions: boolean;  // Случайный порядок вопросов
}
```

---

## 🔗 Integration Points

### Incoming Events (Kafka)
**Пока не реализовано** - будет добавлено в Phase 14

### Outgoing Events (Kafka)
**Пока не реализовано** - будет добавлено в Phase 14

Планируемые события:
- `TemplateCreated`
- `TemplatePublished`
- `TemplateArchived`
- `QuestionAdded`
- `QuestionRemoved`

---

## 🧪 Testing

### Test Coverage
```
✅ Unit Tests:        231/231 (100%)
✅ Integration Tests:  52/52  (100%)
✅ E2E Tests:          28/28  (100%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TOTAL:             311/311 (100%)
```

### Running Tests
```bash
# Все тесты последовательно
npm run test:all

# Только unit тесты
npm run test

# Только integration тесты
npm run test:integration

# Только E2E тесты
npm run test:e2e
```

---

## 📝 Database Schema

### Tables
- `interview_templates` - Шаблоны интервью
- `questions` - Вопросы (связаны с templates)
- `outbox` - Outbox pattern для Kafka events

### Migrations
```bash
# Запустить миграции
npm run migration:run

# Откатить миграцию
npm run migration:revert

# Показать статус миграций
npm run migration:show
```

---

## 🚀 Next Steps (Phase 10-14)

- [ ] **Phase 10:** Invitations Domain Layer
- [ ] **Phase 11:** Invitations Application Layer
- [ ] **Phase 12:** Invitations Infrastructure
- [ ] **Phase 13:** Invitations API Layer
- [ ] **Phase 14:** Kafka Integration (Events)
