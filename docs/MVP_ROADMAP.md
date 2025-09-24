# MVP Roadmap - AI Video Interview Platform

## 🎯 Цель MVP
Создать минимальную рабочую версию платформы для асинхронных AI видео-интервью с основными функциями:
- HR может создавать интервью и получать ссылки
- Кандидаты проходят интервью через браузер
- Базовый AI анализ ответов
- Простые отчеты

## 📊 Текущий статус проекта

### ✅ Готово
- Микросервисная архитектура (API Gateway, User Service, Interview Service)
- Аутентификация через Authentik + OAuth
- Observability стек (Prometheus, Grafana, Loki, Jaeger)
- Kafka интеграция для событий
- Базовый фронтенд (Landing, Login, Register)
- Docker containerization

### 🔨 В работе
- Dashboard интерфейс
- CRUD операции для интервью

### ❌ Отсутствует
- Создание и управление интервью
- Запись видео/аудио в браузере
- Обработка медиа файлов
- AI анализ (Whisper + GPT)
- Отчеты и результаты

## 🗺️ MVP Feature Map

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HR DASHBOARD  │    │ CANDIDATE FLOW  │    │  AI ANALYSIS    │
│                 │    │                 │    │                 │
│ • Create Interview │  │ • Open Link     │    │ • Speech-to-Text│
│ • Manage Questions │  │ • Record Video  │    │ • Content Analysis │
│ • View Results  │    │ • Submit Answers│    │ • Generate Report│
│ • Generate Links│    │ • Thank You     │    │ • Store Results │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 MVP Task List (Приоритет)

### 🚀 PHASE 1: Core Interview Management (Week 1-2)

#### Frontend Tasks
- [ ] **F1.1** - Улучшить Dashboard UI (современный дизайн)
- [ ] **F1.2** - Создать страницу "My Interviews" (список интервью)
- [ ] **F1.3** - Форма создания нового интервью
- [ ] **F1.4** - Управление вопросами (добавление/удаление/редактирование)
- [ ] **F1.5** - Генерация и копирование публичной ссылки
- [ ] **F1.6** - Preview интервью перед публикацией

#### Backend Tasks  
- [ ] **B1.1** - Interview CRUD API (создание, чтение, обновление, удаление)
- [ ] **B1.2** - Questions management API
- [ ] **B1.3** - Public link generation с UUID токенами
- [ ] **B1.4** - Permission система (только создатель может редактировать)
- [ ] **B1.5** - Interview status management (draft, active, closed)

### 🎥 PHASE 2: Candidate Experience (Week 3)

#### Frontend Tasks
- [ ] **F2.1** - Public interview page (по ссылке без авторизации)
- [ ] **F2.2** - Step-by-step interview flow UI
- [ ] **F2.3** - MediaRecorder API интеграция (видео/аудио запись)
- [ ] **F2.4** - Upload progress и retry механизм
- [ ] **F2.5** - Thank you page с подтверждением
- [ ] **F2.6** - Mobile-responsive дизайн для кандидатов

#### Backend Tasks
- [ ] **B2.1** - Public API для получения интервью по токену
- [ ] **B2.2** - Media upload API с pre-signed URLs
- [ ] **B2.3** - Response submission API
- [ ] **B2.4** - File validation и security checks
- [ ] **B2.5** - Kafka events для новых ответов

### 🤖 PHASE 3: AI Analysis Pipeline (Week 4-5)

#### Backend Tasks
- [ ] **B3.1** - Media processing service (ffmpeg containerization)
- [ ] **B3.2** - Whisper integration для speech-to-text
- [ ] **B3.3** - GPT-4 API интеграция для анализа
- [ ] **B3.4** - AI Analysis service с queue processing
- [ ] **B3.5** - Results storage и caching
- [ ] **B3.6** - Error handling и retry logic

#### AI Tasks
- [ ] **AI3.1** - Prompt engineering для оценки ответов
- [ ] **AI3.2** - Scoring algorithm (soft skills, communication, technical)
- [ ] **AI3.3** - Sentiment analysis
- [ ] **AI3.4** - Key insights extraction

### 📊 PHASE 4: Results & Reports (Week 6)

#### Frontend Tasks
- [ ] **F4.1** - Results dashboard для HR
- [ ] **F4.2** - Individual candidate report view
- [ ] **F4.3** - Video playback с transcript синхронизацией
- [ ] **F4.4** - AI analysis visualization (charts, scores)
- [ ] **F4.5** - Export reports (PDF/CSV)
- [ ] **F4.6** - Comparison view для multiple кандидатов

#### Backend Tasks
- [ ] **B4.1** - Results API с pagination
- [ ] **B4.2** - Report generation service
- [ ] **B4.3** - Analytics aggregation
- [ ] **B4.4** - Notification system (email alerts)

## 🎨 Frontend Architecture Improvements

### Current State Analysis
```typescript
// Текущая структура
apps/web/app/
├── auth/           // OAuth callback
├── dashboard/      // Базовый dashboard
├── login/          // Login форма  
├── register/       // Registration форма
├── lib/            // API utilities
└── page.tsx        // Landing page
```

### Proposed MVP Structure
```typescript
apps/web/app/
├── auth/                    // ✅ Готово
├── dashboard/               // 🔨 Улучшить
│   ├── interviews/          // 📝 Создать
│   │   ├── page.tsx         // Список интервью
│   │   ├── create/          // Форма создания
│   │   ├── [id]/            // Просмотр/редактирование
│   │   └── [id]/results/    // Результаты
│   ├── analytics/           // 📊 Аналитика
│   └── settings/            // ⚙️ Настройки
├── interview/               // 📝 Создать - Public интервью
│   └── [token]/             // Прохождение по токену
├── components/              // 🧩 UI Components
│   ├── interview/           // Interview-specific компоненты
│   ├── media/               // Video/Audio записи
│   └── ui/                  // Общие UI компоненты
└── lib/
    ├── api/                 // API clients
    ├── media/               // MediaRecorder utilities  
    └── types/               // TypeScript типы
```

## 🎯 Week 1 Sprint Plan

### Day 1-2: Dashboard Improvements
1. Современный дизайн dashboard
2. Navigation menu
3. Empty states для новых пользователей

### Day 3-4: Interview Management  
1. Список интервью с фильтрами
2. Форма создания интервью
3. CRUD операции

### Day 5-7: Question Management
1. Dynamic question forms
2. Question types (text, video, audio)
3. Preview functionality

## 🛠️ Technical Stack Decisions

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + HeadlessUI
- **State**: React Query + Zustand
- **Media**: MediaRecorder API + WebRTC
- **Forms**: React Hook Form + Zod validation

### Backend  
- **Framework**: NestJS (microservices)
- **Database**: PostgreSQL + TypeORM
- **File Storage**: MinIO (dev) / S3 (prod)
- **Message Queue**: Kafka
- **AI**: OpenAI API + Whisper

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Monitoring**: Prometheus + Grafana
- **Logging**: Loki + Promtail
- **Tracing**: Jaeger + OpenTelemetry

## 📏 Definition of Done - MVP

### For HR Users:
- [ ] Можно создать интервью с кастомными вопросами
- [ ] Получить публичную ссылку для кандидатов
- [ ] Просмотреть все ответы кандидатов
- [ ] Получить базовый AI анализ каждого ответа
- [ ] Экспортировать простой отчет

### For Candidates:
- [ ] Открыть ссылку в любом браузере
- [ ] Записать видео/аудио ответы на вопросы
- [ ] Загрузить ответы без ошибок
- [ ] Получить подтверждение об успешной отправке

### Technical:
- [ ] Все API покрыты тестами
- [ ] Frontend responsive для мобильных
- [ ] Обработка ошибок и edge cases
- [ ] Мониторинг и логирование работает
- [ ] Безопасность (валидация, авторизация)

## 🚀 Next Steps

1. **Начинаем с фронтенда** - улучшение dashboard UI
2. Параллельно дорабатываем Interview Service API
3. Итеративная разработка с еженедельными демо
4. Continuous deployment для быстрой итерации

---

**Готовы начать с Phase 1 - Frontend Dashboard improvements!** 🎯
