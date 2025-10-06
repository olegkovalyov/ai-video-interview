# Services Architecture Overview - AI Video Interview Platform

**Версия:** 2.0  
**Дата:** 2025-10-06  
**Статус:** ACTIVE

---

## 🎯 Введение

Платформа AI Video Interview построена на микросервисной архитектуре с четким разделением ответственности между сервисами согласно принципам Domain-Driven Design (DDD).

Каждый сервис представляет собой **Bounded Context** с собственной доменной моделью, базой данных и бизнес-логикой.

---

## 🏗️ Архитектура системы

```
┌─────────────────────────────────────────────────────────┐
│                      API GATEWAY                         │
│  - Routing                                               │
│  - Authentication (JWT validation)                       │
│  - Rate Limiting                                         │
│  - Request/Response logging                              │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┬──────────────────┐
        │                  │                  │                  │
┌───────▼───────┐  ┌──────▼──────┐  ┌────────▼────────┐ ┌──────▼──────┐
│ USER SERVICE  │  │  INTERVIEW   │  │   CANDIDATE     │ │   MEDIA     │
│               │  │  SERVICE     │  │   RESPONSE      │ │   SERVICE   │
│               │  │              │  │   SERVICE       │ │             │
└───────────────┘  └──────────────┘  └─────────────────┘ └─────────────┘
        │                  │                  │                  │
        └──────────────────┼──────────────────┴──────────────────┘
                           │
        ┌──────────────────┼──────────────────┬──────────────────┐
        │                  │                  │                  │
┌───────▼───────┐  ┌──────▼──────┐  ┌────────▼────────┐ ┌──────▼──────┐
│ AI ANALYSIS   │  │  REPORTING  │  │  NOTIFICATION   │ │   BILLING   │
│  SERVICE      │  │  SERVICE    │  │   SERVICE       │ │   SERVICE   │
└───────────────┘  └─────────────┘  └─────────────────┘ └─────────────┘
```

---

## 📋 Список сервисов

| # | Сервис | Статус | Приоритет | Описание |
|---|--------|--------|-----------|----------|
| 1 | API Gateway | ✅ Реализован | CRITICAL | Единая точка входа, routing, auth |
| 2 | User Service | ✅ Реализован | CRITICAL | Управление пользователями, профили |
| 3 | Interview Service | 🟡 Частично | CRITICAL | CRUD интервью, вопросы, шаблоны |
| 4 | Candidate Response Service | ❌ Не реализован | **CRITICAL** | Публичное прохождение интервью |
| 5 | Media Service | 🟡 Частично | HIGH | Загрузка, обработка, хранение медиа |
| 6 | AI Analysis Service | ❌ Не реализован | **HIGH** | Транскрипция, анализ, оценка |
| 7 | Notification Service | ❌ Не реализован | MEDIUM | Email, webhooks, templates |
| 8 | Reporting Service | ❌ Не реализован | MEDIUM | PDF отчеты, дашборды, экспорт |
| 9 | Billing Service | ❌ Не реализован | LOW | Stripe, подписки, квоты |

---

## 🔍 Детальное описание сервисов

### 1️⃣ API Gateway

**Назначение:** Единая точка входа для всех клиентских запросов

**Ответственность:**
- HTTP routing к микросервисам
- JWT token validation (Keycloak)
- Rate limiting и throttling
- Request/Response logging
- CORS handling
- Health checks aggregation

**Технологии:**
- NestJS
- Passport JWT
- Winston logging
- OpenTelemetry tracing

**База данных:** Нет (stateless)

**Порт:** 3001

**Статус:** ✅ Реализован

**Детали:** См. `/services/API_GATEWAY.md`

---

### 2️⃣ User Service

**Назначение:** Управление пользователями и их профилями

**Ответственность:**
- User profiles (CRUD)
- Avatar management
- User statistics (interviews created, storage used)
- Quota tracking
- User preferences

**Что НЕ входит:**
- ❌ Аутентификация (это зона Keycloak)
- ❌ Авторизация на уровне permissions (это API Gateway)
- ❌ Billing и подписки (это Billing Service)

**Технологии:**
- NestJS
- TypeORM
- PostgreSQL
- MinIO (avatars)
- Kafka (events)

**База данных:** PostgreSQL (`users`, `user_profiles`, `user_stats`)

**Порт:** 3003

**Статус:** ✅ Реализован

**Детали:** См. `/services/USER_SERVICE.md`

---

### 3️⃣ Interview Service

**Назначение:** Управление интервью со стороны HR/рекрутера

**Ответственность:**
- CRUD интервью (создание, редактирование, удаление)
- Управление вопросами (добавление, порядок, настройки)
- Шаблоны интервью (библиотека, клонирование)
- Генерация публичных ссылок (UUID)
- Настройки интервью (дедлайны, брендинг, требования)
- Tracking кандидатов (статусы: invited, in_progress, completed)
- Метаданные прохождения (когда начал, сколько времени)

**Что НЕ входит:**
- ❌ Прохождение интервью кандидатом (Candidate Response Service)
- ❌ Запись видео/аудио (Candidate Response Service)
- ❌ Хранение медиафайлов (Media Service)
- ❌ AI анализ (AI Analysis Service)
- ❌ Отчеты и PDF (Reporting Service)

**Технологии:**
- NestJS
- TypeORM
- PostgreSQL
- Kafka (events)

**База данных:** PostgreSQL (`interviews`, `questions`, `templates`, `candidate_sessions`)

**Порт:** 3004

**Статус:** 🟡 Частично реализован (базовый CRUD есть, нужны templates, questions ordering)

**Детали:** См. `/services/INTERVIEW_SERVICE.md`

---

### 4️⃣ Candidate Response Service

**Назначение:** Публичная часть для прохождения интервью кандидатами

**Ответственность:**
- Публичная страница интервью (БЕЗ авторизации)
- Валидация публичной ссылки
- WebRTC запись видео/аудио в браузере
- Сохранение промежуточных ответов (resume later)
- Submission финальных ответов
- Candidate profile (имя, email, resume, доп. инфо)
- Прогресс-бар прохождения
- Thank you screen

**Что НЕ входит:**
- ❌ Создание интервью (Interview Service)
- ❌ Просмотр результатов (Reporting Service)
- ❌ Обработка медиа (Media Service)

**Технологии:**
- Next.js (отдельный frontend)
- NestJS backend
- PostgreSQL
- WebRTC (MediaRecorder API)
- MinIO pre-signed URLs

**База данных:** PostgreSQL (`candidate_sessions`, `responses`, `candidate_profiles`)

**Порт:** 3005 (backend), 3100 (frontend)

**Статус:** ❌ НЕ РЕАЛИЗОВАН

**Приоритет:** **КРИТИЧЕСКИЙ** (без этого кандидаты не могут проходить интервью!)

**Детали:** См. `/services/CANDIDATE_RESPONSE_SERVICE.md`

---

### 5️⃣ Media Service

**Назначение:** Обработка и хранение медиафайлов

**Ответственность:**
- Pre-signed URLs для прямой загрузки в S3/MinIO
- Метаданные файлов (duration, size, format)
- FFmpeg processing (конвертация, сжатие)
- Генерация thumbnails
- Streaming URLs
- CDN integration
- Cleanup старых файлов

**Что НЕ входит:**
- ❌ Бизнес-логика интервью (Interview Service)
- ❌ AI анализ контента (AI Analysis Service)

**Технологии:**
- NestJS
- FFmpeg
- MinIO/S3
- PostgreSQL (metadata)
- Kafka (processing jobs)

**База данных:** PostgreSQL (`media_files`, `processing_jobs`)

**Хранилище:** MinIO/S3

**Порт:** 3006

**Статус:** 🟡 Частично реализован (базовая загрузка есть, нужен FFmpeg processing)

**Детали:** См. `/services/MEDIA_SERVICE.md`

---

### 6️⃣ AI Analysis Service

**Назначение:** AI-анализ ответов кандидатов

**Ответственность:**
- Speech-to-text транскрипция (Whisper API)
- Content analysis (GPT-4)
- Skills extraction
- Sentiment analysis
- Job description matching (embeddings + LlamaIndex)
- Scoring algorithms
- Comparative analysis

**Что НЕ входит:**
- ❌ Хранение медиафайлов (Media Service)
- ❌ Генерация PDF отчетов (Reporting Service)

**Технологии:**
- **Python** (FastAPI) - лучше для ML
- OpenAI API (Whisper, GPT-4)
- LlamaIndex
- PostgreSQL (results)
- Vector DB (Pinecone/Qdrant для embeddings)
- Kafka (async processing)

**База данных:** 
- PostgreSQL (`analysis_results`, `transcriptions`)
- Vector DB для embeddings

**Порт:** 3007

**Статус:** ❌ НЕ РЕАЛИЗОВАН

**Приоритет:** **HIGH** (это core value proposition платформы!)

**Детали:** См. `/services/AI_ANALYSIS_SERVICE.md`

---

### 7️⃣ Notification Service

**Назначение:** Отправка уведомлений и интеграций

**Ответственность:**
- Email отправка (Resend/SendGrid)
- Email templates (invite, reminder, completion)
- Webhook интеграции (ATS системы)
- Retry logic для failed deliveries
- Delivery tracking и статусы
- Push notifications (в будущем)

**Что НЕ входит:**
- ❌ Бизнес-логика триггеров (сервисы сами решают когда отправлять)

**Технологии:**
- NestJS
- Resend/SendGrid
- Handlebars (templates)
- PostgreSQL (logs, templates)
- Redis (queue)
- Kafka (events)

**База данных:** PostgreSQL (`notifications`, `templates`, `delivery_logs`)

**Порт:** 3008

**Статус:** ❌ НЕ РЕАЛИЗОВАН

**Приоритет:** MEDIUM (нужен для приглашений кандидатов)

**Детали:** См. `/services/NOTIFICATION_SERVICE.md`

---

### 8️⃣ Reporting Service

**Назначение:** Отчеты и аналитика для HR

**Ответственность:**
- PDF reports generation (Puppeteer)
- Candidate comparison
- HR dashboards (metrics, charts)
- Data export (CSV, Excel)
- Analytics aggregation
- Custom report templates

**Что НЕ входит:**
- ❌ Сырые данные интервью (Interview Service)
- ❌ AI анализ (AI Analysis Service)

**Технологии:**
- NestJS
- Puppeteer (PDF)
- PostgreSQL (reports)
- ClickHouse (analytics, optional)
- Chart.js/D3.js

**База данных:** 
- PostgreSQL (`reports`, `dashboards`)
- ClickHouse (опционально для больших объемов)

**Порт:** 3009

**Статус:** ❌ НЕ РЕАЛИЗОВАН

**Приоритет:** MEDIUM

**Детали:** См. `/services/REPORTING_SERVICE.md`

---

### 9️⃣ Billing Service

**Назначение:** Подписки, платежи, квоты

**Ответственность:**
- Stripe integration
- Subscription management (create, upgrade, cancel)
- Usage tracking (interviews, storage, API calls)
- Quota enforcement
- Invoicing
- Payment webhooks
- Billing history

**Что НЕ входит:**
- ❌ User management (User Service)
- ❌ Feature access control (API Gateway)

**Технологии:**
- NestJS
- Stripe API
- PostgreSQL (subscriptions, invoices)
- Redis (quota cache)
- Kafka (usage events)

**База данных:** PostgreSQL (`subscriptions`, `plans`, `invoices`, `usage`)

**Порт:** 3010

**Статус:** ❌ НЕ РЕАЛИЗОВАН

**Приоритет:** LOW (можно стартовать с Free tier)

**Детали:** См. `/services/BILLING_SERVICE.md`

---

## 🔗 Взаимодействие между сервисами

### Синхронное взаимодействие (REST/HTTP)
- Клиент → API Gateway → Микросервисы
- Service-to-service через API Gateway (прямые вызовы запрещены)

### Асинхронное взаимодействие (Kafka Events)

**Основные топики:**
```
user-events               # User created/updated/deleted
interview-events          # Interview created/published/completed
candidate-events          # Candidate started/completed interview
media-events              # File uploaded/processed/ready
analysis-events           # Analysis completed
notification-events       # Notification sent/failed
billing-events            # Subscription created/payment received
```

**Примеры event flow:**

#### Flow 1: Создание интервью
```
1. HR создает interview (Interview Service)
   ↓
2. Публикует event: interview.created
   ↓
3. User Service обновляет quota
4. Notification Service (опционально) отправляет подтверждение
```

#### Flow 2: Кандидат проходит интервью
```
1. Candidate записывает ответ (Candidate Response Service)
   ↓
2. Публикует event: response.submitted
   ↓
3. Media Service получает файл, обрабатывает
   ↓
4. Публикует event: media.ready
   ↓
5. AI Analysis Service анализирует
   ↓
6. Публикует event: analysis.completed
   ↓
7. Interview Service обновляет статус
8. Notification Service уведомляет HR
```

---

## 📊 Приоритеты разработки

### **MVP (Минимально жизнеспособный продукт):**
1. ✅ **API Gateway** - DONE
2. ✅ **User Service** - DONE
3. 🟡 **Interview Service** - Частично DONE (нужны templates, questions)
4. 🔴 **Candidate Response Service** - **КРИТИЧНО!**
5. 🟡 **Media Service** - Частично DONE (нужен FFmpeg)
6. 🔴 **AI Analysis Service** - **КРИТИЧНО!** (хотя бы транскрипция)

### **Phase 1 - Public Launch:**
7. **Notification Service** - для email invites
8. **Billing Service** - для monetization
9. **Reporting Service** - базовые PDF

### **Phase 2 - Scale:**
10. AI Analysis улучшения (GPT-4 evaluation, embeddings)
11. Advanced analytics и dashboards
12. Webhook integrations для ATS
13. Mobile app

---

## 🎯 Следующие шаги

1. **IMMEDIATE:** Начать разработку **Candidate Response Service** (критический gap)
2. **HIGH:** Доделать **Interview Service** (templates, questions ordering)
3. **HIGH:** Реализовать **AI Analysis Service** (базовая транскрипция Whisper)
4. **MEDIUM:** Добавить FFmpeg processing в **Media Service**
5. **MEDIUM:** Создать **Notification Service** для invites

---

## 📚 Дополнительная документация

- **Детали каждого сервиса:** `/docs/v2/services/<SERVICE_NAME>.md`
- **API спецификации:** `/docs/v2/api/<SERVICE_NAME>_API.md`
- **Event schemas:** `/docs/v2/events/EVENT_CATALOG.md`
- **Database schemas:** `/docs/v2/database/<SERVICE_NAME>_SCHEMA.md`

---

**Последнее обновление:** 2025-10-06  
**Автор:** AI Video Interview Team
