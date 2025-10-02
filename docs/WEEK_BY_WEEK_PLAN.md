# 📅 WEEK-BY-WEEK IMPLEMENTATION PLAN

## 🎯 Overview
Hybrid approach: Core services first → AI Chatbot quick win → Full AI pipeline

---

## 📆 WEEK 1: USER SERVICE (Foundation)

### Goals
- ✅ Полноценный user management
- ✅ RBAC система
- ✅ Integration с API Gateway

### Tasks Breakdown

#### Backend (user-service)
```typescript
// Day 1-2: Database & Core API
- [ ] User entity (TypeORM)
- [ ] User CRUD endpoints
- [ ] User repository pattern
- [ ] Basic validation (Zod/class-validator)

// Day 3: RBAC
- [ ] Role entity (HR, Admin, Candidate)
- [ ] Permission system
- [ ] Role guards
- [ ] User-Role association

// Day 4: Integration
- [ ] API Gateway routing to user-service
- [ ] JWT enrichment с user roles
- [ ] Kafka events (user.created, user.updated)
- [ ] Health checks

// Day 5: Testing & Docs
- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation (Swagger)
- [ ] Logging & tracing
```

#### Frontend (dashboard)
```typescript
// Day 4-5: Profile Management
- [ ] User profile page
- [ ] Edit profile form
- [ ] Avatar upload (MinIO)
- [ ] Settings page
```

### Definition of Done
- ✅ User CRUD работает через API Gateway
- ✅ RBAC enforced на всех endpoints
- ✅ Kafka events публикуются
- ✅ Tests passing (>80% coverage)
- ✅ Swagger docs доступна
- ✅ Dashboard показывает user info

---

## 📆 WEEK 2: INTERVIEW SERVICE (Core MVP)

### Goals
- ✅ HR может создавать интервью
- ✅ Генерация public links
- ✅ Dashboard UI improvements

### Tasks Breakdown

#### Backend (interview-service)
```typescript
// Day 1-2: Core Models
- [ ] Interview entity
- [ ] Question entity
- [ ] InterviewTemplate entity (опционально)
- [ ] Status enum (draft, active, closed)
- [ ] Database migrations

// Day 3: CRUD API
- [ ] POST /interviews (create)
- [ ] GET /interviews (list с pagination)
- [ ] GET /interviews/:id (get one)
- [ ] PUT /interviews/:id (update)
- [ ] DELETE /interviews/:id (soft delete)
- [ ] POST /interviews/:id/publish (activate)

// Day 4: Questions Management
- [ ] POST /interviews/:id/questions
- [ ] PUT /questions/:id
- [ ] DELETE /questions/:id
- [ ] Reorder questions API

// Day 5: Public Links
- [ ] UUID token generation
- [ ] GET /public/interview/:token (без auth)
- [ ] Token validation
- [ ] Expiration logic

// Day 6-7: Integration & Testing
- [ ] Kafka events (interview.created, interview.published)
- [ ] API Gateway routing
- [ ] Unit tests
- [ ] Integration tests
```

#### Frontend
```typescript
// Day 3-4: Dashboard Improvements
- [ ] Современный дизайн layout
- [ ] Navigation sidebar
- [ ] Empty states
- [ ] Loading skeletons

// Day 5-6: Interview Management
- [ ] /dashboard/interviews page (list)
- [ ] Create interview form
- [ ] Question builder UI (dynamic form)
- [ ] Preview modal
- [ ] Copy link button

// Day 7: Polish
- [ ] Form validation
- [ ] Error handling
- [ ] Success notifications
- [ ] Mobile responsive
```

### Definition of Done
- ✅ HR может создать интервью с вопросами
- ✅ Public link генерируется и копируется
- ✅ Dashboard UI современный и удобный
- ✅ Tests passing
- ✅ Mobile responsive

---

## 📆 WEEK 3: AI CHATBOT (Quick Win! ⚡)

### Goals
- ✅ WOW-эффект на landing page
- ✅ Demo AI capabilities
- ✅ User engagement boost

### Tasks Breakdown

#### Backend (ai-service - chatbot module)
```typescript
// Day 1: Setup AI Service
- [ ] Создать ai-service (NestJS)
- [ ] OpenAI SDK integration
- [ ] Environment config (API keys)
- [ ] Basic health checks

// Day 2: Chatbot API
- [ ] POST /chatbot/message
- [ ] Conversation context management
- [ ] Streaming responses (SSE)
- [ ] Rate limiting (per IP)
- [ ] Error handling

// Day 3: Prompts Engineering
- [ ] System prompt для интервьюера
- [ ] 5-7 prepared questions
- [ ] Follow-up логика
- [ ] Scoring algorithm (simple)

// Day 4: Caching & Optimization
- [ ] Redis для conversations
- [ ] Response caching
- [ ] Cost tracking
- [ ] Logs & monitoring
```

#### Frontend
```typescript
// Day 3: Chat Widget
- [ ] Chat UI component (shadcn/ui)
- [ ] Message list с animations
- [ ] Typing indicator
- [ ] Auto-scroll

// Day 4: Integration
- [ ] API client для chatbot
- [ ] SSE connection handling
- [ ] Error recovery
- [ ] Loading states

// Day 5: UX Polish
- [ ] Welcome message
- [ ] Suggested questions
- [ ] "Start Interview" CTA
- [ ] Mobile optimization
```

### Features
```typescript
// Chatbot Capabilities:
- 🤖 Приветствие и объяснение процесса
- 💬 5-7 behavioral questions
- 🎯 Follow-up вопросы на основе ответов
- 📊 Simple scoring в конце
- 🔗 "Sign up to save results" CTA

// Ограничения (MVP):
- ❌ Без сохранения в БД (demo только)
- ❌ Без видео/аудио (текст only)
- ❌ Без авторизации
- ❌ Rate limiting: 10 messages per IP per hour
```

### Definition of Done
- ✅ Chatbot работает на landing page
- ✅ Streaming responses smooth
- ✅ Rate limiting включен
- ✅ Mobile responsive
- ✅ CTA на регистрацию работает
- ✅ Cost tracking настроен

---

## 📆 WEEK 4: CANDIDATE FLOW

### Goals
- ✅ Кандидат может пройти интервью по ссылке
- ✅ Video/Audio запись работает
- ✅ Upload в S3/MinIO

### Tasks Breakdown

#### Backend (interview-service + media-service)
```typescript
// Day 1-2: Response API
- [ ] CandidateResponse entity
- [ ] POST /public/interview/:token/responses
- [ ] File upload endpoint (pre-signed URLs)
- [ ] Validation & security checks

// Day 3: Media Service
- [ ] Создать media-service
- [ ] MinIO/S3 integration
- [ ] Upload API с progress tracking
- [ ] File metadata storage

// Day 4: Processing Pipeline
- [ ] Kafka consumer в media-service
- [ ] Basic ffmpeg integration (compress)
- [ ] Thumbnail generation
- [ ] Status updates

// Day 5: Public API
- [ ] GET /public/interview/:token
- [ ] Rate limiting per token
- [ ] Analytics tracking (views, starts, completions)
```

#### Frontend
```typescript
// Day 2-3: Public Interview Page
- [ ] /interview/[token] route
- [ ] Question display UI
- [ ] Step-by-step wizard
- [ ] Progress indicator

// Day 4-5: MediaRecorder Integration
- [ ] Camera/Mic permission handling
- [ ] Video preview
- [ ] Record/Stop/Restart buttons
- [ ] Timer display
- [ ] Playback review

// Day 6: Upload Flow
- [ ] Upload progress bar
- [ ] Retry mechanism
- [ ] Background upload
- [ ] Success confirmation

// Day 7: Polish
- [ ] Thank you page
- [ ] Mobile optimization
- [ ] Error handling
- [ ] Loading states
```

### Definition of Done
- ✅ Кандидат может открыть link
- ✅ Запись видео/аудио работает на desktop & mobile
- ✅ Upload успешно в MinIO
- ✅ Kafka event отправляется
- ✅ Media service обрабатывает файл
- ✅ Thank you page показывается

---

## 📆 WEEK 5-6: AI ANALYSIS (Full Pipeline)

### Goals
- ✅ Speech-to-text (Whisper)
- ✅ Content analysis (GPT-4)
- ✅ Results dashboard

### Tasks Breakdown

#### Backend (ai-service - analysis module)
```typescript
// Day 1-2: Whisper Integration
- [ ] Python worker для Whisper
- [ ] Kafka consumer (media.processed events)
- [ ] Audio extraction from video (ffmpeg)
- [ ] Transcript storage

// Day 3-4: GPT-4 Analysis
- [ ] Analysis prompts engineering
- [ ] Scoring algorithm
- [ ] Soft skills detection
- [ ] Key insights extraction
- [ ] Sentiment analysis

// Day 5: Results Storage
- [ ] AnalysisResult entity
- [ ] Results API
- [ ] Caching strategy
- [ ] Aggregation for multiple questions

// Day 6: Queue Management
- [ ] Priority queue (paid users first)
- [ ] Error handling & retry
- [ ] DLQ для failed jobs
- [ ] Status updates via Kafka

// Day 7-8: Optimization
- [ ] Batch processing
- [ ] Cost optimization
- [ ] Performance tuning
- [ ] Monitoring & alerts
```

#### Frontend
```typescript
// Day 4-5: Results Dashboard
- [ ] /dashboard/interviews/[id]/results
- [ ] Candidate list с scores
- [ ] Individual candidate view
- [ ] Video playback с transcript sync

// Day 6: Visualizations
- [ ] Score charts (radar, bar)
- [ ] Key insights display
- [ ] Transcript viewer
- [ ] Highlight reel (best moments)

// Day 7-8: UX Polish
- [ ] Filters & sorting
- [ ] Comparison view (multiple candidates)
- [ ] Search transcripts
- [ ] Mobile responsive
```

### Definition of Done
- ✅ Whisper транскрибирует видео
- ✅ GPT-4 анализирует content
- ✅ Results сохраняются в БД
- ✅ HR видит результаты в dashboard
- ✅ Video playback синхронизирован с transcript
- ✅ Scoring отображается красиво

---

## 📆 WEEK 7: REPORTS & NOTIFICATIONS

### Goals
- ✅ PDF/CSV export
- ✅ Email notifications
- ✅ Analytics dashboard

### Tasks Breakdown

#### Backend
```typescript
// Day 1-2: Reporting Service
- [ ] PDF generation (puppeteer)
- [ ] CSV export
- [ ] Report templates
- [ ] S3 storage для reports

// Day 3-4: Notification Service
- [ ] Email service (Resend/SendGrid)
- [ ] Kafka consumer (analysis.completed)
- [ ] Email templates
- [ ] Webhook support

// Day 5: Analytics
- [ ] Aggregation queries
- [ ] Dashboard metrics API
- [ ] Usage tracking
- [ ] Cost monitoring
```

#### Frontend
```typescript
// Day 3-4: Export Features
- [ ] Export buttons
- [ ] Report preview
- [ ] Download progress
- [ ] Email delivery option

// Day 5: Analytics Dashboard
- [ ] /dashboard/analytics
- [ ] Usage charts
- [ ] Cost tracking
- [ ] Performance metrics
```

### Definition of Done
- ✅ PDF export работает
- ✅ Email notifications отправляются
- ✅ Analytics показывает метрики
- ✅ Mobile responsive

---

## 🎯 SUCCESS METRICS

### Week 1 (User Service)
- ✅ User registration/login works
- ✅ RBAC enforced
- ✅ API tests pass

### Week 2 (Interview Service)
- ✅ HR создал 5+ test interviews
- ✅ Public links генерируются
- ✅ Dashboard UI получил положительный feedback

### Week 3 (AI Chatbot)
- ✅ 100+ demo conversations
- ✅ Conversion to signup: >5%
- ✅ Zero downtime
- ✅ Cost < $10/day

### Week 4 (Candidate Flow)
- ✅ 10+ test submissions
- ✅ Upload success rate >95%
- ✅ Mobile works на iOS & Android

### Week 5-6 (AI Analysis)
- ✅ Analysis accuracy >80%
- ✅ Processing time <5 min per interview
- ✅ Zero data loss

### Week 7 (Reports)
- ✅ PDF export working
- ✅ Email delivery >98%
- ✅ All features integrated

---

## 📊 MILESTONE TIMELINE

```
┌────────────────────────────────────────────────────────┐
│                    7-WEEK MVP PLAN                     │
└────────────────────────────────────────────────────────┘

Week 1: USER-SERVICE ████████░░░░░░░░░░░░░░░░░░░░░░░░ 
Week 2: INTERVIEW-SERVICE ░░░░░░░░████████░░░░░░░░░░░
Week 3: AI CHATBOT ⚡ ░░░░░░░░░░░░░░░░████░░░░░░░░░░░
Week 4: CANDIDATE FLOW ░░░░░░░░░░░░░░░░░░░░████████░░
Week 5-6: AI ANALYSIS ░░░░░░░░░░░░░░░░░░░░░░░░████████
Week 7: REPORTS ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████

Legend:
████ = Development
░░░░ = Planning/Buffer
⚡ = Quick Win (parallel work possible)
```

---

## 🚀 READY TO START!

**Next Action:** 
```bash
# Create user-service branch
git checkout -b feature/user-service

# Start Week 1 tasks
cd apps/user-service
```

**Daily standups:**
- What did I complete yesterday?
- What am I working on today?
- Any blockers?

**Weekly demos:**
- Friday EOD: demo to stakeholders
- Gather feedback
- Adjust next week plan if needed

---

**Обновлено: 2025-09-30**
**Следующий update: End of Week 1**
