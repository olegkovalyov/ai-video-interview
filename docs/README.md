# 🎯 AI Video Interview Platform - Documentation v2

**Версия документации:** 2.0  
**Последнее обновление:** 2025-10-06

---

## 📚 Навигация

### 🚀 [01. Getting Started](./01-getting-started/)
Быстрый старт и базовая информация
- [Overview](./01-getting-started/OVERVIEW.md) - Обзор платформы
- [Quick Start](./01-getting-started/QUICK_START.md) - Запуск за 5 минут
- [Local Development](./01-getting-started/LOCAL_DEVELOPMENT.md) - Полный dev setup
- [Glossary](./01-getting-started/GLOSSARY.md) - Термины и определения

### 🏗️ [02. Architecture](./02-architecture/)
High-level архитектура системы
- [System Overview](./02-architecture/SYSTEM_OVERVIEW.md) - C4 Context diagram
- [Services Overview](./02-architecture/SERVICES_OVERVIEW.md) - Все микросервисы
- [Containers Infrastructure](./02-architecture/CONTAINERS_INFRASTRUCTURE.md) - Docker containers
- [Bounded Contexts](./02-architecture/BOUNDED_CONTEXTS.md) - DDD декомпозиция
- [Communication Patterns](./02-architecture/COMMUNICATION_PATTERNS.md) - Sync/Async, Kafka
- [Data Architecture](./02-architecture/DATA_ARCHITECTURE.md) - Database per service
- [Deployment Architecture](./02-architecture/DEPLOYMENT_ARCHITECTURE.md) - Docker, K8s

### 🔧 [03. Services](./03-services/)
Детальная документация по каждому сервису
- [API Gateway](./03-services/API_GATEWAY.md) ✅
- [User Service](./03-services/USER_SERVICE.md) ✅
- [Interview Service](./03-services/INTERVIEW_SERVICE.md) 🟡
- [Candidate Response Service](./03-services/CANDIDATE_RESPONSE_SERVICE.md) ❌
- [Media Service](./03-services/MEDIA_SERVICE.md) 🟡
- [AI Analysis Service](./03-services/AI_ANALYSIS_SERVICE.md) ❌
- [Notification Service](./03-services/NOTIFICATION_SERVICE.md) ❌
- [Reporting Service](./03-services/REPORTING_SERVICE.md) ❌
- [Billing Service](./03-services/BILLING_SERVICE.md) ❌

### 📡 [04. API](./04-api/)
API спецификации и документация
- [REST Conventions](./04-api/REST_CONVENTIONS.md) - Общие правила
- [Error Handling](./04-api/ERROR_HANDLING.md) - Стандартные ошибки
- [Authentication](./04-api/AUTHENTICATION.md) - JWT, OAuth flow
- [Pagination](./04-api/PAGINATION.md) - Cursor vs Offset
- [OpenAPI Specs](./04-api/openapi/) - Auto-generated спецификации
- [Examples](./04-api/examples/) - Живые примеры запросов

### 📨 [05. Events](./05-events/)
Event-driven архитектура
- [Event Catalog](./05-events/EVENT_CATALOG.md) - Все события
- [Event Schema Standard](./05-events/EVENT_SCHEMA_STANDARD.md) - Формат событий
- [Kafka Configuration](./05-events/KAFKA_CONFIGURATION.md) - Topics, partitions
- [Idempotency](./05-events/IDEMPOTENCY.md) - Exactly-once processing
- [DLQ Handling](./05-events/DLQ_HANDLING.md) - Dead Letter Queue
- [Event Schemas](./05-events/schemas/) - JSON schemas

### 🗄️ [06. Database](./06-database/)
Database документация и схемы
- [Database Strategy](./06-database/DATABASE_STRATEGY.md) - Database per service
- [Migrations](./06-database/MIGRATIONS.md) - TypeORM migrations
- [Backup & Restore](./06-database/BACKUP_RESTORE.md) - Backup стратегия
- [Schemas](./06-database/schemas/) - ERD диаграммы + DDL
- [Queries](./06-database/queries/) - Полезные queries

### ⚙️ [07. Infrastructure](./07-infrastructure/)
Инфраструктура и deployment
- [Docker Setup](./07-infrastructure/DOCKER_SETUP.md) - Docker Compose
- [Networking](./07-infrastructure/NETWORKING.md) - Internal DNS
- [Secrets Management](./07-infrastructure/SECRETS_MANAGEMENT.md) - Env vars, Vault
- [CI/CD](./07-infrastructure/CI_CD.md) - GitHub Actions
- [Kubernetes](./07-infrastructure/KUBERNETES.md) - K8s setup (future)

### 📊 [08. Observability](./08-observability/)
Мониторинг, логи, трейсинг
- [Overview](./08-observability/OVERVIEW.md) - 3 pillars
- [Logging Guide](./08-observability/LOGGING_GUIDE.md) - Winston, Loki
- [Metrics Guide](./08-observability/METRICS_GUIDE.md) - Prometheus
- [Tracing Guide](./08-observability/TRACING_GUIDE.md) - Jaeger
- [Alerts](./08-observability/ALERTS.md) - Alerting rules
- [Grafana Dashboards](./08-observability/grafana-dashboards/) - Dashboard exports
- [Queries](./08-observability/queries/) - Prometheus, Loki queries

### 🔐 [09. Security](./09-security/)
Безопасность и аутентификация
- [Authentication Flow](./09-security/AUTHENTICATION_FLOW.md) - OAuth flow
- [Authorization](./09-security/AUTHORIZATION.md) - RBAC
- [JWT Validation](./09-security/JWT_VALIDATION.md) - Token validation
- [API Security](./09-security/API_SECURITY.md) - Rate limiting, CORS
- [Secrets Rotation](./09-security/SECRETS_ROTATION.md) - Key rotation
- [Security Checklist](./09-security/SECURITY_CHECKLIST.md) - Pre-production audit

### 👨‍💻 [10. Development](./10-development/)
Руководства для разработчиков
- [Coding Standards](./10-development/CODING_STANDARDS.md) - Style guide
- [Git Workflow](./10-development/GIT_WORKFLOW.md) - Branch strategy
- [Testing Guide](./10-development/TESTING_GUIDE.md) - Unit, Integration, E2E
- [Debug Guide](./10-development/DEBUG_GUIDE.md) - VS Code configs
- [Common Tasks](./10-development/COMMON_TASKS.md) - Частые задачи
- [Examples](./10-development/examples/) - Code examples

### 🔧 [11. Operations](./11-operations/)
Operational runbooks (🚧 Coming Soon)
- Deployment
- Rollback
- Scaling
- Disaster Recovery
- Runbooks

### 📋 [12. Decisions](./12-decisions/)
Architecture Decision Records (🚧 Coming Soon)
- ADR-001: Microservices Architecture
- ADR-002: Kafka over RabbitMQ
- ADR-003: TypeORM
- ADR-004: Keycloak

### 🗺️ [13. Roadmap](./13-roadmap/)
Планы развития (🚧 Coming Soon)
- Current Status
- MVP Scope
- Backlog
- Tech Debt

### 📚 [14. Resources](./14-resources/)
Полезные ссылки и инструменты (🚧 Coming Soon)
- External APIs
- Tools
- Learning Resources
- Troubleshooting FAQ

---

## 🎯 Быстрые ссылки

### Для новых разработчиков:
1. [Quick Start](./01-getting-started/QUICK_START.md)
2. [System Overview](./02-architecture/SYSTEM_OVERVIEW.md)
3. [Coding Standards](./10-development/CODING_STANDARDS.md)

### Для backend разработчиков:
1. [Services Overview](./02-architecture/SERVICES_OVERVIEW.md)
2. [API Conventions](./04-api/REST_CONVENTIONS.md)
3. [Event Catalog](./05-events/EVENT_CATALOG.md)

### Для DevOps:
1. [Containers Infrastructure](./02-architecture/CONTAINERS_INFRASTRUCTURE.md)
2. [Docker Setup](./07-infrastructure/DOCKER_SETUP.md)
3. [Observability Overview](./08-observability/OVERVIEW.md)

---

## 📝 Changelog

### 2025-10-06 - v2.0
- ✅ Создана новая структура документации
- ✅ Добавлен Services Overview
- ✅ Добавлен Containers Infrastructure
- ✅ Детальная документация API Gateway
- ✅ Детальная документация User Service

---

## 🤝 Контрибьюция

При обновлении документации:
1. Следуй существующей структуре
2. Обновляй `CHANGELOG.md`
3. Проверяй ссылки: `npm run docs:check-links`
4. Генерируй OpenAPI specs: `npm run docs:generate-api`

---

**Вопросы?** Создай issue в репозитории или спроси в команде.
