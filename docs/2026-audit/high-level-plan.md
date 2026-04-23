# AI Video Interview Platform — High-Level Roadmap

**Created**: 2026-04-12
**Status**: Active

---

## Phase 1 — Feature Completeness (~20-25 days)

Complete all core features, integrate all services with frontend, make the platform fully functional end-to-end.

| #   | Feature                                           | Estimate | Dependencies         |
| --- | ------------------------------------------------- | -------- | -------------------- |
| 1.1 | Email Notifications (Keycloak + SMTP + templates) | 3-4 days | Notification Service |
| 1.2 | Real-time Updates (WebSocket + polling)           | 1-2 days | 1.1                  |
| 1.3 | HR Actions (approve/reject candidate + email)     | 2-3 days | 1.1                  |
| 1.4 | Candidate View Results                            | 2-3 days | --                   |
| 1.5 | Billing & Subscriptions (Stripe + frontend)       | 4-5 days | --                   |
| 1.6 | Interview Page Redesign (UX/UI + proctoring)      | 3-4 days | --                   |
| 1.7 | Export (PDF/CSV)                                  | 2 days   | --                   |
| 1.8 | Comparison View (side-by-side candidates)         | 2-3 days | --                   |
| 1.9 | Bulk Actions (resend, cancel, export)             | 1-2 days | --                   |

**Outcome**: Platform is feature-complete for MVP launch. All services connected, all user flows working, emails sending, billing active.

---

## Phase 2 — Production Deployment (~8-10 days)

Deploy to Oracle Cloud, set up CI/CD, production observability, custom domains.

| #   | Task                                                         | Estimate | Dependencies |
| --- | ------------------------------------------------------------ | -------- | ------------ |
| 2.1 | Dockerize all services (multi-stage builds)                  | 2-3 days | Phase 1      |
| 2.2 | CI/CD — GitHub Actions (test + build + deploy)               | 2 days   | 2.1          |
| 2.3 | Production Infrastructure (Traefik, SSL, backups)            | 2-3 days | 2.1          |
| 2.4 | Production Observability (Grafana, Prometheus, Loki, Jaeger) | 2 days   | 2.3          |

**Domains**:

- `stage.deep-interview.com` — frontend
- `api.deep-interview.com` — API Gateway
- `grafana.deep-interview.com` — monitoring (auth-protected)

**Outcome**: Live staging environment, automated deployments, full observability stack, SSL, backups.

---

## Phase 3 — Scale & Advanced Features (~6-8 weeks)

Kubernetes migration, video interviews, advanced AI, new features.

| #   | Task                                                     | Estimate  | Dependencies |
| --- | -------------------------------------------------------- | --------- | ------------ |
| 3.1 | K8s Migration (K3s, Helm charts, HPA)                    | 5-7 days  | Phase 2      |
| 3.2 | Media Service — Go (video upload, FFmpeg, transcription) | 2-3 weeks | 3.1          |
| 3.3 | Video Interview Flow (WebRTC recording, playback)        | 1-2 weeks | 3.2          |
| 3.4 | Advanced LLM (multi-provider, A/B testing, fallback)     | 1 week    | --           |
| 3.5 | Advanced Features (i18n, teams, scheduling, self-apply)  | ongoing   | --           |

**Outcome**: Production-grade K8s deployment, video interviews, multi-LLM support, enterprise features.

---

## Architecture After All Phases

```
Internet
  |
  Traefik (TLS, routing, rate limiting)
  |
  +--> Next.js (stage.deep-interview.com)
  +--> API Gateway (api.deep-interview.com)
  |      |
  |      +--> User Service (DDD + CQRS)
  |      +--> Interview Service (DDD + CQRS)
  |      +--> AI Analysis Service (DDD + CQRS, multi-LLM)
  |      +--> Media Service (Go, FFmpeg, Whisper)
  |      +--> Notification Service (DDD + CQRS, email/push/webhook)
  |      +--> Billing Service (DDD + CQRS, Stripe)
  |
  +--> Grafana (grafana.deep-interview.com)
  |
  Infrastructure:
    PostgreSQL (6 databases) | Redis | Kafka | MinIO | Keycloak | ClickHouse
```

## Key Metrics for Launch

- [ ] All unit/integration/e2e tests passing
- [ ] Full interview flow: create template -> invite -> exam -> AI analysis -> HR review
- [ ] Email notifications working (registration, invitation, results)
- [ ] Billing with Stripe test mode
- [ ] < 3s page load time
- [ ] SSL on all endpoints
- [ ] Automated CI/CD pipeline
- [ ] Grafana dashboards with alerts
