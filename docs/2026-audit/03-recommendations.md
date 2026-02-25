# 03 — Recommendations (What to Add)

## A. Business Value Enhancements

### A1. Real-Time Interview Mode (High Impact)

**Current**: Only asynchronous interviews (candidate records at own pace).
**Proposed**: Live interview mode where HR watches candidate in real-time via WebRTC.

- Peer-to-peer video via WebRTC (STUN/TURN servers)
- Interview session management with timer
- HR can ask follow-up questions live
- Real-time transcription via WebSocket + Whisper streaming
- AI analysis available immediately after session ends

**Business value**: Covers both async and live use cases, competitive advantage over async-only platforms.

### A2. Multi-Language AI Analysis

**Current**: Analysis prompts are English-only.
**Proposed**: Detect candidate response language, analyze in that language, present results in HR's preferred language.

- Language detection in Media Service (or via Groq)
- Localized scoring criteria
- Translated recommendations and feedback
- Support: English, Russian, German, Spanish (matches notification i18n spec)

**Business value**: Opens up European and CIS markets.

### A3. Candidate Experience Improvements

- **Interview preparation tips** — AI-generated prep based on template questions
- **Practice mode** — Candidates can rehearse without recording
- **Progress indicator** — "Question 3 of 8" with estimated time remaining
- **Accessibility** — Screen reader support, keyboard-only navigation, captions on recorded videos
- **Mobile-first recording** — Responsive video capture UI for phone interviews

**Business value**: Higher completion rates, better candidate impression of hiring company.

### A4. HR Analytics Dashboard

- **Funnel visualization**: Invited → Started → Completed → Analyzed → Hired
- **Time-to-hire tracking**: Days from invitation to hire decision
- **AI score distribution**: Bell curve across candidates per position
- **Template effectiveness**: Which questions produce most differentiating scores
- **Comparative reports**: Side-by-side candidate comparison with radar charts
- **Export**: PDF reports for stakeholders

**Business value**: Data-driven hiring decisions, measurable ROI for platform.

### A5. ATS Integration

- **Webhook outbound**: Push events to customer ATS (Greenhouse, Lever, Workday, BambooHR)
- **API inbound**: Import job openings and candidates from ATS
- **iFrame embed**: Embed interview widget in external career pages
- **Zapier/Make integration**: Low-code automation for non-technical HR teams

**Business value**: Fits into existing HR workflows, reduces adoption friction.

### A6. Team Collaboration

- **Shared evaluations**: Multiple HR reviewers score same candidate
- **Comments & notes**: Per-response and per-candidate threaded discussion
- **@mentions**: Notify colleagues about specific candidates
- **Evaluation templates**: Standardized scorecard alongside AI analysis
- **Role: interviewer** — Can only view assigned candidates, not manage templates

**Business value**: Enterprise sales enabler, supports panel-interview workflows.

---

## B. Reliability & Resilience

### B1. Database Reliability

| Enhancement | Current | Recommended |
|-------------|---------|-------------|
| Backup strategy | None | pg_dump daily + WAL archiving to S3/MinIO |
| Connection pooling | TypeORM default | PgBouncer sidecar (transaction mode) |
| Read replicas | None | PostgreSQL streaming replication for read-heavy queries |
| Migration safety | Manual | Automated pre-deployment checks, rollback plan |
| Data encryption | At rest: no | Enable PostgreSQL TDE or disk-level encryption |

### B2. Kafka Reliability

| Enhancement | Current | Recommended |
|-------------|---------|-------------|
| Cluster size | 1 broker | 3 brokers minimum for production |
| Replication | Factor 1 | Factor 3 for all topics |
| Schema registry | None | Confluent Schema Registry (Avro/Protobuf) |
| Exactly-once | Manual idempotency | Kafka transactions for critical flows |
| DLQ replay | Manual | Automated retry service with exponential backoff |
| Topic governance | Ad-hoc | Schema evolution policy, version compatibility matrix |

### B3. Service Resilience

- **Retry policies**: Standardize across all services (exponential backoff, jitter, max 3 retries)
- **Bulkhead pattern**: Isolate thread pools for Kafka consumers vs HTTP handlers
- **Timeout budgets**: Propagate deadline from API Gateway through service chain
- **Graceful degradation**: Return cached/stale data when downstream is unavailable
- **Health check depth**: Add dependency health (DB, Kafka, Redis, MinIO) to `/health` endpoint
- **Saga compensation**: Extend registration saga pattern to interview creation flow

### B4. Redis Reliability

- **Persistence**: Currently AOF only; add RDB snapshots for faster recovery
- **Sentinel/Cluster**: Single instance → Redis Sentinel (HA) or Redis Cluster (scale)
- **Key expiration policies**: Audit all TTLs, ensure no unbounded growth
- **Memory limits**: Set `maxmemory` with `allkeys-lru` eviction policy

---

## C. Observability Improvements

### C1. Complete the Observability Stack

| Gap | Action |
|-----|--------|
| Alertmanager missing | Add container to docker-compose, configure notification channels |
| Prometheus rules empty | Define rules: service down, error rate, Kafka lag, DLQ count, resource limits |
| Grafana dashboards stubs | Build kafka-overview + system-overview dashboards |
| Structured error tracking | Add Sentry or self-hosted GlitchTip for error grouping/deduplication |
| Synthetic monitoring | Uptime checks from external probes (UptimeRobot, Checkly) |
| SLO/SLA dashboards | Define SLIs (availability, latency P99, error budget) per service |

### C2. Distributed Tracing Enhancements

- **Trace sampling**: 100% in dev, 10% in production (reduce storage costs)
- **Custom span attributes**: Add `user.id`, `interview.id`, `analysis.id` to spans
- **Database query tracing**: Instrument TypeORM queries as child spans
- **Kafka consumer tracing**: Link consumer span to producer span (already started in shared package)
- **Frontend tracing**: Add OpenTelemetry JS SDK for browser-to-backend traces

### C3. Business Metrics

Expose domain-specific Prometheus counters:
- `interviews_created_total{company, template_type}`
- `interviews_completed_total{company}`
- `analysis_score_histogram{recommendation}`
- `analysis_duration_seconds`
- `active_users_gauge{role}`
- `kafka_event_processing_duration_seconds{event_type}`

---

## D. Security Hardening

### D1. Authentication & Authorization

| Enhancement | Details |
|-------------|---------|
| MFA | Enable TOTP/WebAuthn in Keycloak for admin and HR roles |
| Session management | Add concurrent session limits, force logout on role change |
| API rate limiting | Per-user and per-IP rate limits at API Gateway (Redis-backed) |
| CORS hardening | Whitelist specific origins, not `*` |
| CSP headers | Content-Security-Policy, X-Frame-Options, X-Content-Type-Options |
| Brute force protection | Enable Keycloak brute force detection (currently disabled) |

### D2. Data Protection

- **PII encryption**: Encrypt email, name fields at application level (AES-256)
- **Data retention policy**: Auto-delete interview recordings after X months
- **GDPR compliance**: Right to erasure, data export, consent management
- **Audit log**: Immutable log of all admin actions (who did what, when)
- **Secret rotation**: Automated rotation for DB passwords, API keys, JWT signing keys

### D3. Network Security

- **TLS everywhere**: HTTPS for all services (currently HTTP in dev)
- **Service mesh**: mTLS between services (Istio/Linkerd in Kubernetes)
- **Network policies**: Restrict inter-service communication to known paths
- **Secret management**: HashiCorp Vault or Kubernetes Secrets (not .env files)

---

## E. Scalability & Performance

### E1. Horizontal Scaling Targets

| Service | Bottleneck | Solution |
|---------|-----------|----------|
| API Gateway | HTTP connections | Multiple replicas behind load balancer |
| User Service | DB writes | Read replicas, connection pooling |
| Interview Service | DB writes | Read replicas, connection pooling |
| AI Analysis | Groq API rate limits | Multiple API keys, queue-based throttling |
| Media Service | FFmpeg CPU | Dedicated worker nodes, GPU transcoding |
| Kafka | Single broker | 3-broker cluster, partition increase |

### E2. Caching Strategy

- **API Gateway**: Cache user profile, template metadata (Redis, TTL 5 min)
- **Interview Service**: Cache published templates (immutable after publish)
- **Analysis Service**: Cache completed analyses (immutable)
- **CDN**: Cache static frontend assets, interview thumbnails
- **Query result caching**: React Query on frontend (already implemented)

### E3. Database Optimization

- **Connection pooling**: PgBouncer with 100 max connections per service
- **Indexing**: Audit all queries, add covering indexes for common patterns
- **Partitioning**: Partition `responses` and `analysis_results` by date for archival
- **Vacuum tuning**: Aggressive autovacuum for high-write tables (outbox, processed_events)

---

## F. Deployment & DevOps

### F1. Kubernetes Migration

**Recommended architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Ingress  │  │ Cert     │  │ External │              │
│  │ (nginx)  │  │ Manager  │  │ DNS      │              │
│  └────┬─────┘  └──────────┘  └──────────┘              │
│       │                                                  │
│  ┌────┴─────────────────────────────┐                   │
│  │         API Gateway (HPA)        │ ← 2-10 replicas   │
│  └────┬──────────┬──────────┬───────┘                   │
│       │          │          │                            │
│  ┌────┴───┐ ┌───┴────┐ ┌───┴──────┐                   │
│  │ User   │ │Intervw │ │Analysis  │ ← 2-5 replicas    │
│  │Service │ │Service │ │Service   │   each             │
│  └────────┘ └────────┘ └──────────┘                    │
│                                                          │
│  ┌─────────────────────────────────────┐                │
│  │     StatefulSets / Operators        │                │
│  │  PostgreSQL  Kafka  Redis  MinIO    │                │
│  └─────────────────────────────────────┘                │
│                                                          │
│  ┌─────────────────────────────────────┐                │
│  │     Observability Namespace         │                │
│  │  Prometheus  Grafana  Loki  Jaeger  │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

**Key resources**:
- **Deployments**: API Gateway, User, Interview, Analysis, Media, Notification, Web
- **StatefulSets**: PostgreSQL (or CloudNativePG operator), Kafka (Strimzi operator), Redis
- **HPA**: Auto-scale on CPU/memory (API Gateway: 2-10, services: 2-5)
- **ConfigMaps**: Service configs, Prometheus rules, Grafana dashboards
- **Secrets**: DB credentials, API keys, Keycloak admin password
- **PVCs**: PostgreSQL data, Kafka logs, MinIO storage, Redis AOF
- **NetworkPolicies**: Restrict traffic to known service-to-service paths
- **Ingress**: nginx-ingress with TLS termination (cert-manager + Let's Encrypt)

### F2. CI/CD Pipeline (GitHub Actions)

```yaml
# Suggested workflow structure:
PR:
  - lint + type-check (all packages)
  - unit tests (per affected service via Turborepo --filter)
  - build check

Merge to develop:
  - All PR checks
  - Build Docker images (tag: develop-<sha>)
  - Push to container registry
  - Deploy to staging (auto)

Merge to master:
  - All checks
  - Build Docker images (tag: v<semver>)
  - Push to container registry
  - Deploy to production (manual approval gate)
```

### F3. Environment Strategy

| Environment | Purpose | Infrastructure |
|-------------|---------|---------------|
| **Local** | Development | Docker Compose (current) |
| **CI** | Testing | GitHub Actions + ephemeral containers |
| **Staging** | Pre-production validation | Kubernetes (small cluster, 1 replica each) |
| **Production** | Live users | Kubernetes (HA, multi-replica, managed services) |

### F4. Managed Services (Production Alternative)

Instead of self-hosting everything in K8s, consider managed services for stateful components:

| Component | Self-Hosted | Managed Alternative |
|-----------|-----------|---------------------|
| PostgreSQL | K8s StatefulSet | AWS RDS / Supabase / Neon |
| Redis | K8s StatefulSet | AWS ElastiCache / Upstash |
| Kafka | Strimzi operator | Confluent Cloud / AWS MSK / Upstash Kafka |
| MinIO | K8s StatefulSet | AWS S3 / Cloudflare R2 |
| Keycloak | K8s Deployment | Auth0 / Clerk (trade-off: vendor lock-in) |
| Monitoring | Prometheus+Grafana | Grafana Cloud / Datadog |

**Recommendation**: Start with managed PostgreSQL + S3 + Redis. Self-host Kafka and Keycloak (most customized components).

---

## G. Quick Wins (< 1 day each)

1. **Fix `console.log`** — Replace 23+ instances with LoggerService across User Service
2. **Register DomainExceptionFilter globally** — One-line change, consistent error responses
3. **Add missing AI Analysis database** — Add `ai_video_interview_analysis` to `init-db.sql`
4. **Fill Grafana dashboard stubs** — Copy community dashboards for Kafka and Node Exporter
5. **Enable Keycloak brute force protection** — Toggle in realm settings
6. **Add `.env.example`** — Document all required environment variables
7. **Add pre-commit hooks** — Husky + lint-staged for automatic linting before commit
8. **Pin Docker image versions** — Replace `:latest` tags with specific versions for reproducibility

---

## Summary: Recommended Next Phase

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| 1 | User Service P0 bug fixes | Fixes data consistency | 3 days |
| 2 | CI/CD Pipeline | Enables safe, fast iteration | 2 days |
| 3 | Media Service | Unlocks core product value | 10 days |
| 4 | Video Recording UI | Complete interview flow | 7 days |
| 5 | Alert Rules + Alertmanager | Production readiness | 2 days |
| 6 | Notification Service | User experience polish | 5 days |
| 7 | Kubernetes manifests | Deployment readiness | 5 days |
| 8 | Billing Service | Monetization | 7 days |

**Recommended focus for next sprint**: Items 1-2 (stabilize core), then 3-4 (complete product).

---

*Last updated: 2026-02-22*
