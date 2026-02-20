# Changelog - Documentation v2

Все изменения в документации будут отражены в этом файле.

---

## [2.0.0] - 2025-10-06

### 🎉 Initial Release

#### Added
- ✅ Новая структура документации с 14 секциями
- ✅ [README.md](./README.md) - главная навигация
- ✅ [Quick Start](./01-getting-started/QUICK_START.md) - запуск за 5 минут

#### Architecture
- ✅ [Services Overview](./02-architecture/SERVICES_OVERVIEW.md) - все 9 сервисов
- ✅ [Containers Infrastructure](./02-architecture/CONTAINERS_INFRASTRUCTURE.md) - 15 контейнеров

#### Services (Detailed)
- ✅ [API Gateway](./03-services/API_GATEWAY.md) - полная документация
- ✅ [User Service](./03-services/USER_SERVICE.md) - полная документация
- 🟡 [Interview Service](./03-services/INTERVIEW_SERVICE.md) - placeholder
- 🟡 Остальные сервисы - placeholders (будут детализированы при разработке)

#### Placeholders Created
- 📁 `11-operations/` - operational runbooks
- 📁 `12-decisions/` - ADRs
- 📁 `13-roadmap/` - roadmap & backlog
- 📁 `14-resources/` - external resources

#### Migration from v1
- Удалены outdated документы:
  - `MVP_ROADMAP.md`
  - `WEEK_BY_WEEK_PLAN.md`
  - `OBSERVABILITY.md` (дубликат)
  - `USE_CASES_AND_FLOWS.md`
  - `architecture/04-implementation-roadmap.md`
  - `architecture/CQRS_READ_DATABASE_ANALYSIS.md`
  - `specifications/ai-chat-assistant-spec.md`
  - `infrastructure/containerization-k8s-strategy.md`
  - `manuals/ai_video_interview_plan.md`

---

## How to Update Changelog

При внесении изменений в документацию:

1. Добавь запись в формате:
```markdown
### [Секция] - YYYY-MM-DD
#### Changed/Added/Removed
- Описание изменения
```

2. Типы изменений:
   - **Added** - новые документы/секции
   - **Changed** - обновление существующих
   - **Removed** - удаление устаревших
   - **Fixed** - исправление ошибок

3. Всегда указывай дату и автора (опционально)

---

## [2.0.1] - 2025-10-06

### Added - Observability Documentation

#### 08-observability/
- ✅ [OVERVIEW.md](./08-observability/OVERVIEW.md) - 3 столпа observability, архитектура стека
- ✅ [LOGGING_GUIDE.md](./08-observability/LOGGING_GUIDE.md) - Winston, Loki, structured logging
- ✅ [queries/prometheus-queries.md](./08-observability/queries/prometheus-queries.md) - PromQL queries
- ✅ [queries/loki-queries.md](./08-observability/queries/loki-queries.md) - LogQL queries
- 🟡 METRICS_GUIDE.md - placeholder
- 🟡 TRACING_GUIDE.md - placeholder  
- 🟡 ALERTS.md - placeholder

**Content:**
- Полное описание Prometheus, Loki, Jaeger, Grafana
- 50+ готовых Prometheus queries (HTTP, Auth, Kafka, DB, System)
- 40+ готовых Loki queries (Auth, Errors, Tracing, Performance)
- Best practices для логирования
- Troubleshooting guides
- Dashboard examples

---

## [2.1.0] - 2026-02-20

### Fixed — Documentation Accuracy
- Fixed service ports throughout documentation (3005-3010 → 8002-8005)
- AI Analysis Service: 🔴 Not Implemented → ✅ Implemented
- Interview Service: 🟡 → ✅
- Removed Zookeeper reference (Kafka uses KRaft mode)
- Next.js 14 → Next.js 15, NestJS 10 → NestJS 11
- Added missing infrastructure services (Kafka UI, Kafka Exporter, Node Exporter, Promtail)

### Changed — README.md
- Removed links to ~20 non-existent documentation files
- Updated service statuses to reflect current implementation
- Reorganized navigation to only link to existing files
- Added link to docs/plan/ section

### Added — Plans
- `docs/plan/BACKLOG.md` — high-level backlog of 20 remaining tasks with priority matrix
- Updated `ROADMAP.md` — Phase 1 marked as ✅ completed
- Updated `PHASE-1-AI-ANALYSIS.md` — marked as completed with deviations section

### Updated — AI Analysis Service
- Completely rewritten `AI_ANALYSIS_SERVICE.md` based on actual implementation
- Documented: Groq API integration, scoring criteria, Kafka event flow, database schema
- Key differences from plan: no RAG/pgvector, data via Kafka events (no HTTP), model change

---

## [2.0.2] - 2025-10-06

### Changed - Documentation Structure
- ✅ Перемещена вся документация из `/docs/v2/` в `/docs/` (корень)
- ✅ Удалена папка v2

### Added - Kafka/Events Documentation

#### 05-events/
- ✅ [KAFKA_CONFIGURATION.md](./05-events/KAFKA_CONFIGURATION.md) - Полная конфигурация Kafka
- ✅ [EVENT_CATALOG.md](./05-events/EVENT_CATALOG.md) - Каталог всех событий
- ✅ [EVENT_SCHEMA_STANDARD.md](./05-events/EVENT_SCHEMA_STANDARD.md) - Стандарт формата событий
- ✅ [IDEMPOTENCY.md](./05-events/IDEMPOTENCY.md) - Exactly-once processing guide
- ✅ [DLQ_HANDLING.md](./05-events/DLQ_HANDLING.md) - Dead Letter Queue handling

**Event Types Documented:**
- **Auth Events** (API Gateway): user.authenticated, user.logged_out
- **User Events** (User Service): user.created, user.updated, user.avatar_uploaded, user.deleted
- **Interview Events** (Interview Service): interview.created, interview.published, interview.completed
- **Media Events** (Media Service): media.uploaded, media.processed, media.deleted
- **Candidate Events** (Candidate Service): candidate.started, candidate.response_submitted, candidate.completed
- **AI Analysis Events** (AI Analysis Service): analysis.started, analysis.completed
- **Notification Events** (Notification Service): notification.sent

**Technical Details:**
- Exactly-once processing с manual offset commits
- Event idempotency через processed_events table с UNIQUE constraint
- DLQ для failed messages с retry strategy
- Partitioning по userId для гарантии порядка
- Consumer groups per service для изоляции
- Health monitoring и metrics
- Replay strategies для DLQ

### Updated - Service Documentation

#### 03-services/API_GATEWAY.md
- ✅ Добавлена секция Events - API Gateway публикует auth-events
- ✅ Добавлен Kafka в Configuration (KAFKA_BROKERS, KAFKA_CLIENT_ID)
- ✅ Добавлен Kafka в Dependencies
- ✅ Документированы события: user.authenticated, user.logged_out
- ✅ Важная деталь: Kafka errors не блокируют auth flow

---

**Next Update:** TBD
