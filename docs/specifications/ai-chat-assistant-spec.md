# 🤖 AI CHAT ASSISTANT - ТЕХНИЧЕСКОЕ ЗАДАНИЕ

## 📋 **МЕТАДАННЫЕ**

| Параметр | Значение |
|----------|----------|
| **Проект** | AI Video Interview Platform |
| **Компонент** | AI Chat Assistant |
| **Статус** | 🔴 NOT STARTED |
| **Приоритет** | 🟡 MEDIUM (после регистрации и core микросервисов) |
| **Цель** | Обучение AI integration + улучшение UX |
| **Бюджет** | $0 (бесплатные API) |
| **Версия** | 1.0 |
| **Дата создания** | 2025-09-30 |

---

## 🎯 **ЦЕЛИ И ЗАДАЧИ**

### **Основная цель:**
Создать AI-powered chat assistant для помощи посетителям платформы с использованием бесплатных LLM APIs.

### **Обучающие цели:**
- ✅ Изучить интеграцию LLM (Gemini, Groq)
- ✅ Научиться работать с RAG (Retrieval Augmented Generation)
- ✅ Понять streaming responses в real-time
- ✅ Реализовать fallback механизмы для AI services
- ✅ Практика prompt engineering

### **Бизнес-цели:**
- ✅ Улучшить onboarding новых посетителей
- ✅ Автоматизировать ответы на FAQ
- ✅ Квалифицировать leads для demo
- ✅ Показать AI capabilities платформы

---

## 🏗️ **АРХИТЕКТУРА**

### **Microservice Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│                     Chat Widget UI                           │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/SSE
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API GATEWAY (NestJS)                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Proxy: /ai/* → AI Service                         │    │
│  │  Auth: JWT validation                              │    │
│  │  Rate Limiting                                     │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ Internal HTTP
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AI SERVICE (NestJS) - Port 3006                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           AI Chat Module                             │  │
│  │  - Chat Controller                                   │  │
│  │  - Chat Service                                      │  │
│  │  - Provider Factory (Gemini → Groq fallback)        │  │
│  │  - RAG Context Builder                               │  │
│  │  - Conversation Manager                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Future AI Features:                                         │
│  - Whisper Transcription Module                             │
│  - Interview Analysis Module                                │
│  - Candidate Evaluation Module                              │
└────────────────────────┬────────────────────────────────────┘
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
    ┌────────────────┐      ┌────────────────┐
    │ Gemini API     │      │  Groq API      │
    │ (PRIMARY)      │      │  (FALLBACK)    │
    └────────────────┘      └────────────────┘
             │                       │
             └───────────┬───────────┘
                         ▼
             ┌────────────────────────┐
             │   Redis Cache          │
             │   - Conversations      │
             │   - Context            │
             └────────────────────────┘
```

### **Why Separate Microservice:**

**✅ Advantages:**
1. **Isolation:** AI workload не влияет на API Gateway performance
2. **Scaling:** Можно scale AI service independently
3. **Technology:** AI dependencies изолированы
4. **Future-proof:** Единый hub для всех AI features
5. **Monitoring:** Отдельные метрики и cost tracking
6. **Development:** Можно разрабатывать параллельно
7. **Deployment:** Independent deployment cycles

**Service Communication:**
- API Gateway → AI Service: Internal HTTP (service-to-service)
- External clients → API Gateway → AI Service (proxy pattern)
- Auth handled by API Gateway, AI Service trusts gateway

### **AI Providers Strategy:**

#### **1️⃣ Google Gemini (PRIMARY)**
```yaml
Provider: Google AI Studio
Model: gemini-1.5-flash
Library: @google/generative-ai
Cost: FREE
Limits:
  requests_per_minute: 60
  requests_per_day: 1500
  tokens_per_day: 1000000
API_Key: https://aistudio.google.com/app/apikey
```

**Почему Gemini:**
- Лучшее качество среди бесплатных
- Щедрые лимиты для dev/testing
- Отличная поддержка русского языка
- Streaming support
- Google reliability

#### **2️⃣ Groq (FALLBACK)**
```yaml
Provider: Groq Cloud
Model: llama-3.1-8b-instant
Library: openai (compatible)
Cost: FREE
Limits:
  requests_per_day: 14400
  tokens_per_minute: 7000
API_Key: https://console.groq.com/
```

**Почему Groq:**
- Самый быстрый streaming (500+ tokens/sec)
- OpenAI-compatible API
- Хорошие лимиты
- Отличный fallback option

### **Fallback Strategy:**
```typescript
Request Flow:
1. Try Gemini (primary)
   ↓ If quota exceeded or error
2. Try Groq (fallback)
   ↓ If both fail
3. Return cached response or error message
```

---

## 📦 **КОМПОНЕНТЫ**

### **1. AI Service (NEW Microservice)**

**Location:** `apps/ai-service/`

**Port:** `3006`

**Структура:**
```
apps/ai-service/
├── src/
│   ├── main.ts                      # Service entry point
│   ├── app.module.ts
│   ├── config/
│   │   └── ai.config.ts             # AI providers config
│   ├── chat/
│   │   ├── chat.module.ts
│   │   ├── chat.controller.ts       # Chat endpoints
│   │   ├── chat.service.ts          # Business logic
│   │   ├── conversation.service.ts  # Context management
│   │   └── dto/
│   │       ├── chat-message.dto.ts
│   │       └── chat-response.dto.ts
│   ├── providers/
│   │   ├── base.provider.interface.ts
│   │   ├── gemini.provider.ts       # PRIMARY
│   │   ├── groq.provider.ts         # FALLBACK
│   │   └── provider.factory.ts
│   ├── rag/
│   │   ├── document-loader.service.ts
│   │   ├── context-builder.service.ts
│   │   └── embeddings.service.ts (optional)
│   ├── health/
│   │   └── health.controller.ts     # Health checks
│   └── shared/
│       ├── logger/
│       ├── metrics/
│       └── tracing/
├── test/
├── tsconfig.json
└── package.json
```

**Endpoints:**
```
POST   /chat/message            # Send message, get response
GET    /chat/stream             # SSE streaming
GET    /chat/history/:id        # Conversation history
DELETE /chat/clear/:id          # Clear conversation
GET    /health                  # Service health
GET    /health/providers        # Providers status (Gemini, Groq)
GET    /metrics                 # Prometheus metrics
```

### **2. API Gateway (Proxy Layer)**

**Новые роуты:**
```typescript
// apps/api-gateway/src/proxy/ai-proxy.controller.ts

@Controller('ai')
export class AIProxyController {
  constructor(private httpService: HttpService) {}
  
  // Proxy all /ai/* requests to AI Service
  @All('*')
  async proxyToAIService(
    @Req() req: Request,
    @Res() res: Response
  ) {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3006';
    // Forward request with auth context
    // Handle streaming responses
  }
}
```

**Ответственность:**
- Auth validation (JWT)
- Rate limiting
- Request proxying
- Load balancing (future)

### **3. Frontend: Chat Widget**

**Структура:**
```
apps/web/components/ai-chat/
├── chat-widget.tsx              # Main component
├── chat-button.tsx              # Floating button
├── chat-window.tsx              # Chat interface
├── message-list.tsx             # Messages display
├── message-input.tsx            # User input
├── typing-indicator.tsx         # AI thinking animation
└── hooks/
    └── use-chat.ts              # Chat state management
```

**API Calls:**
```typescript
// Frontend всегда обращается через API Gateway
const API_BASE = 'http://localhost:3002';

// API Gateway проксирует на AI Service
POST ${API_BASE}/ai/chat/message
  ↓ Proxy
POST http://localhost:3006/chat/message
```

---

## 🔧 **ТЕХНИЧЕСКИЙ СТЕК**

### **Dependencies:**

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "openai": "^4.67.0",
    "ioredis": "^5.4.1"
  }
}
```

### **Configuration:**

```bash
# .env for AI Service
GEMINI_API_KEY=your_free_gemini_key
GROQ_API_KEY=your_free_groq_key

AI_CHAT_ENABLED=true
AI_PRIMARY_PROVIDER=gemini
AI_FALLBACK_PROVIDER=groq
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.7

# Rate Limiting
AI_RATE_LIMIT_MESSAGES=20
AI_RATE_LIMIT_CONVERSATIONS=5

# Service Configuration
AI_SERVICE_PORT=3006
AI_SERVICE_HOST=0.0.0.0

# Redis for conversation context
REDIS_HOST=localhost
REDIS_PORT=6379

# .env for API Gateway
AI_SERVICE_URL=http://localhost:3006
AI_SERVICE_TIMEOUT=30000
```

### **Docker Compose:**

```yaml
# Add to docker-compose.yml

services:
  # ... existing services ...
  
  ai-service:
    build:
      context: .
      dockerfile: apps/ai-service/Dockerfile
    ports:
      - "3006:3006"
    environment:
      - NODE_ENV=development
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis
    networks:
      - ai-interview-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3006/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 🎨 **UI/UX ДИЗАЙН**

### **Floating Button (Minimized):**
```
Position: Bottom-right corner (20px from edges)
Size: 64px × 64px
Style: Gradient background, pulse animation
Icon: 💬 или custom AI icon
```

### **Chat Window (Expanded):**
```
Size: 400px × 600px
Style: Glass morphism
Position: Above floating button
Components:
  - Header (title + close button)
  - Messages area (scrollable)
  - Input area (textarea + send)
```

### **Message Styles:**
```
User Messages: Right-aligned, gradient background
AI Messages: Left-aligned, white background
Streaming: Typing cursor animation
```

---

## 🔄 **ФУНКЦИОНАЛЬНОСТЬ**

### **MVP (Phase 1):**

1. **Basic Q&A**
   - Ответы на вопросы о платформе
   - RAG на основе документации
   - Context-aware responses

2. **FAQ Automation**
   - Автоответы на частые вопросы
   - Цены, features, интеграции

3. **Demo Qualification**
   - Сбор информации о потребностях
   - Направление на форму demo

4. **Streaming Responses**
   - Real-time typing animation
   - SSE for smooth UX

### **Advanced (Phase 2+):**

5. **Multi-turn Conversations**
   - Context сохранение в Redis
   - Memory across messages

6. **Analytics**
   - Track user questions
   - Measure satisfaction
   - Conversion funnel

7. **Personalization**
   - Адаптация под роль пользователя
   - История взаимодействий

---

## 📊 **МОНИТОРИНГ**

### **Metrics:**
```
AI Service Metrics (port 3006/metrics):
- ai_service_response_time_seconds
- ai_service_tokens_used_total (by provider)
- ai_service_provider_errors_total
- ai_service_fallback_triggers_total
- ai_service_conversations_active
- ai_service_requests_total

Business Metrics:
- ai_chat_conversations_started_total
- ai_chat_messages_sent_total
- ai_chat_demo_requests_total
- ai_chat_user_satisfaction_avg

API Gateway Proxy Metrics:
- ai_proxy_requests_total
- ai_proxy_response_time_seconds
- ai_proxy_errors_total
```

### **Grafana Dashboard:**
```
ai-service-dashboard.json:
  Row 1: Service Health
    - AI Service status
    - Provider availability (Gemini, Groq)
    - Active connections
  
  Row 2: Performance
    - Response time (by provider)
    - Tokens usage
    - Fallback rate
  
  Row 3: Business Metrics
    - Conversations per hour
    - Messages per hour
    - Demo requests
```

---

## 🧪 **ТЕСТИРОВАНИЕ**

### **Unit Tests:**
```typescript
ai-chat.service.spec.ts
  ✅ Provider selection logic
  ✅ Fallback mechanism
  ✅ Error handling

gemini.provider.spec.ts
  ✅ API integration
  ✅ Streaming responses
  ✅ Error scenarios
```

### **Integration Tests:**
```typescript
ai-chat.e2e.spec.ts
  ✅ End-to-end chat flow
  ✅ SSE streaming
  ✅ Context persistence
  ✅ Rate limiting
```

---

## 📈 **ЭТАПЫ РАЗРАБОТКИ**

### **Phase 0: Prerequisites (BEFORE START)**
```
Status: 🔴 WAITING

Checklist:
□ Registration flow завершен
□ User/Interview services стабильны  
□ API Gateway работает корректно
□ Документация подготовлена для RAG
□ Redis доступен
```

### **Phase 1: AI Service Setup (Week 1)**
```
Tasks:
□ Create new NestJS app: apps/ai-service
□ Setup project structure
□ Configure Gemini provider
□ Configure Groq provider  
□ Implement fallback logic
□ Basic chat endpoint
□ RAG context builder
□ Redis integration for conversations
□ Health checks
□ Unit tests

Deliverable: Standalone AI Service running on port 3006
```

### **Phase 1.5: API Gateway Proxy (2 days)**
```
Tasks:
□ Create AI proxy controller in API Gateway
□ Implement request forwarding
□ Add auth middleware
□ Add rate limiting
□ Handle SSE streaming proxy
□ Integration tests

Deliverable: API Gateway proxying to AI Service
```

### **Phase 2: Frontend MVP (Week 2)**
```
Tasks:
□ Chat widget UI
□ Floating button component
□ Message components
□ API integration
□ State management
□ Styling

Deliverable: Working chat widget
```

### **Phase 3: Streaming (Week 3)**
```
Tasks:
□ SSE endpoint
□ Frontend EventSource
□ Typing animations
□ Error handling

Deliverable: Real-time responses
```

### **Phase 4: Production Ready (Week 4+)**
```
Tasks:
□ Analytics integration
□ Monitoring setup
□ Load testing
□ Documentation
□ Deployment

Deliverable: Production deployment
```

---

## 💰 **COST ESTIMATION**

### **Development Time:**
```
AI Service Setup: 1 week
API Gateway Proxy: 2 days
Frontend MVP: 1 week
Streaming: 1 week
Polish & Deploy: 1 week

Total: ~4.5 weeks part-time
```

### **Infrastructure Cost:**
```
Gemini API: $0/month (free tier sufficient)
Groq API: $0/month (free tier sufficient)
Redis: $0 (already have)
Hosting: $0 (one more container)
Additional resources: Minimal (AI Service lightweight)

Total: $0/month during development 🎉
```

### **Service Ports:**
```
API Gateway: 3002
User Service: 3003
Interview Service: 3004
Media Service: 3005
AI Service: 3006 ← NEW!
```

### **Production Scale (hypothetical):**
```
10K conversations/month:
  Gemini cost: ~$5-10/month
  Still cheaper than support team!
```

---

## 📚 **ДОКУМЕНТАЦИЯ**

### **To Create:**
```
docs/user-guides/ai-chat-guide.md
  - Как использовать
  - Примеры вопросов

docs/technical/ai-chat-architecture.md
  - Архитектура
  - API reference

docs/operations/ai-chat-monitoring.md
  - Метрики
  - Troubleshooting
```

---

## ✅ **SUCCESS CRITERIA**

### **Technical:**
```
✅ Response time < 3s (p95)
✅ Uptime > 99% (with fallback)
✅ Error rate < 1%
✅ Zero cost in dev phase
```

### **User Experience:**
```
✅ Понятные ответы
✅ Релевантный контекст
✅ Smooth streaming
✅ Mobile friendly
```

### **Learning Goals:**
```
✅ LLM integration mastery
✅ RAG implementation
✅ Streaming patterns
✅ Production AI deployment
```

---

## 🔮 **БУДУЩИЕ УЛУЧШЕНИЯ**

### **Advanced Features:**
```
□ Voice input (Web Speech API)
□ Multi-language auto-detect
□ Function calling (book demos, create interviews)
□ Admin dashboard for analytics
□ Custom fine-tuning
□ Proactive suggestions
```

---

## 📝 **ЗАМЕТКИ**

**Ключевые решения:**
- **Отдельный микросервис** = isolation, scalability, future-proof
- **Gemini primary** = лучшее quality/cost соотношение
- **Groq fallback** = fastest streaming, OpenAI-compatible
- **Бесплатные API** = zero cost для обучения
- **RAG на docs** = relevant context
- **Redis context** = stateful conversations
- **API Gateway proxy** = centralized auth + routing

**Преимущества микросервисной архитектуры:**
1. AI workload изолирован от critical gateway
2. Можно scale AI service независимо
3. Единый hub для всех AI features (chat, Whisper, analysis)
4. Легче testing и deployment
5. Technology stack isolation

**Возврат к проекту:**
После завершения registration flow и стабилизации core микросервисов.

---

**STATUS: 🔴 READY FOR FUTURE IMPLEMENTATION**

**NEXT STEPS:**
1. Завершить registration
2. Стабилизировать микросервисы
3. Вернуться к этому ТЗ
4. Start Phase 1
