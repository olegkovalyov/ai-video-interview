# AI Video Interview Platform - Documentation

**Version:** 2.1
**Last Updated:** 2026-02-20

---

## Navigation

### [01. Getting Started](./01-getting-started/)
Quick start and basic information
- [Quick Start](./01-getting-started/QUICK_START.md) - Launch in 5 minutes

### [02. Architecture](./02-architecture/)
High-level system architecture
- [Services Overview](./02-architecture/SERVICES_OVERVIEW.md) - All microservices
- [Containers Infrastructure](./02-architecture/CONTAINERS_INFRASTRUCTURE.md) - Docker containers
- [Ports](./02-architecture/PORTS.md) - Service port assignments

### [03. Services](./03-services/)
Detailed documentation per service
- [API Gateway](./03-services/API_GATEWAY.md) ✅
- [User Service](./03-services/USER_SERVICE.md) ✅
- [Interview Service](./03-services/INTERVIEW_SERVICE.md) ✅
- [AI Analysis Service](./03-services/AI_ANALYSIS_SERVICE.md) ✅
- [Media Service](./03-services/MEDIA_SERVICE.md) 🔴 Planned
- [Notification Service](./03-services/NOTIFICATION_SERVICE.md) 🔴 Planned
- [Billing Service](./03-services/BILLING_SERVICE.md) 🔴 Planned

### [05. Events](./05-events/)
Event-driven architecture
- [Event Catalog](./05-events/EVENT_CATALOG.md) - All events
- [Event Schema Standard](./05-events/EVENT_SCHEMA_STANDARD.md) - Event format
- [Kafka Configuration](./05-events/KAFKA_CONFIGURATION.md) - Topics, partitions
- [Idempotency](./05-events/IDEMPOTENCY.md) - Exactly-once processing
- [DLQ Handling](./05-events/DLQ_HANDLING.md) - Dead Letter Queue

### [08. Observability](./08-observability/)
Monitoring, logs, tracing
- [Overview](./08-observability/OVERVIEW.md) - 3 pillars of observability
- [Logging Guide](./08-observability/LOGGING_GUIDE.md) - Winston, Loki
- [Metrics Guide](./08-observability/METRICS_GUIDE.md) - Prometheus
- [Tracing Guide](./08-observability/TRACING_GUIDE.md) - Jaeger
- [Alerts](./08-observability/ALERTS.md) - Alerting rules
- [Prometheus Queries](./08-observability/queries/prometheus-queries.md) - PromQL examples
- [Loki Queries](./08-observability/queries/loki-queries.md) - LogQL examples

### [11. Operations](./11-operations/) (Coming Soon)
Operational runbooks — deployment, rollback, scaling

### [12. Decisions](./12-decisions/) (Coming Soon)
Architecture Decision Records (ADRs)

### [13. Roadmap](./13-roadmap/) (Coming Soon)
Development roadmap and status

### [14. Resources](./14-resources/) (Coming Soon)
External links and tools

### [Plan](./plan/)
Development plans and backlog
- [Roadmap](./plan/ROADMAP.md) - Phased delivery plan
- [Phase 1 — AI Analysis](./plan/PHASE-1-AI-ANALYSIS.md) ✅ Completed
- [Backlog](./plan/BACKLOG.md) - Remaining tasks

---

## Quick Links

### For new developers:
1. [Quick Start](./01-getting-started/QUICK_START.md)
2. [Services Overview](./02-architecture/SERVICES_OVERVIEW.md)

### For backend developers:
1. [Services Overview](./02-architecture/SERVICES_OVERVIEW.md)
2. [Event Catalog](./05-events/EVENT_CATALOG.md)
3. [Kafka Configuration](./05-events/KAFKA_CONFIGURATION.md)

### For DevOps:
1. [Containers Infrastructure](./02-architecture/CONTAINERS_INFRASTRUCTURE.md)
2. [Observability Overview](./08-observability/OVERVIEW.md)
3. [Ports](./02-architecture/PORTS.md)

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for full history.

### 2026-02-20 — v2.1
- ✅ AI Analysis Service documentation updated to match implementation
- ✅ Fixed service ports (8002-8005)
- ✅ Removed dead links to non-existent files
- ✅ Added Backlog with remaining tasks
- ✅ Phase 1 marked as completed

### 2025-10-06 — v2.0
- ✅ New documentation structure with 14 sections
- ✅ Services Overview, Containers Infrastructure
- ✅ API Gateway and User Service detailed docs

---

## Contributing

When updating documentation:
1. Follow existing structure
2. Update `CHANGELOG.md`
3. Only link to files that actually exist
4. Keep service ports and statuses in sync with code

---

**Questions?** Create an issue in the repository.
