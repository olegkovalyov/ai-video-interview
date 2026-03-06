# Container Infrastructure - AI Video Interview Platform

**Версия:** 2.0  
**Дата:** 2025-10-06  
**Статус:** ACTIVE

---

## 🎯 Обзор

Инфраструктура платформы работает на Docker containers, оркестрированных через `docker-compose.yml`.

Все контейнеры объединены в единую Docker сеть `ai-interview-network` для внутреннего взаимодействия.

---

## 📊 Список контейнеров

| # | Контейнер | Порт(ы) | Статус | Категория |
|---|-----------|---------|--------|-----------|
| 1 | PostgreSQL | 5432 | ✅ Running | Database |
| 2 | Redis | 6379 | ✅ Running | Cache |
| 3 | MinIO | 9000, 9001 | ✅ Running | Storage |
| 4 | Kafka (KRaft) | 9092, 9997 | ✅ Running | Messaging |
| 5 | Kafka UI | 8080 | ✅ Running | Tools |
| 6 | Kafka Exporter | 9308 | ✅ Running | Monitoring |
| 7 | Keycloak | 8090 | ✅ Running | Auth |
| 8 | Keycloak PostgreSQL | (internal) | ✅ Running | Database |
| 9 | Prometheus | 9090 | ✅ Running | Monitoring |
| 10 | Loki | 3100 | ✅ Running | Logs |
| 11 | Promtail | (agent) | ✅ Running | Logs |
| 12 | Jaeger | 16686, 14268 | ✅ Running | Tracing |
| 13 | Grafana | 3002 | ✅ Running | Visualization |
| 14 | Node Exporter | 9100 | ✅ Running | Monitoring |
| 15 | ClickHouse | 8123, 9009 | ⚠️ Optional | Analytics |

---

## 🗄️ DATABASE LAYER

### 1. PostgreSQL (Main Database)

**Image:** `postgres:15-alpine`  
**Container:** `ai-interview-postgres`  
**Port:** `5432`

**Назначение:**
- Основная реляционная база данных для всех сервисов
- Хранит: users, interviews, sessions, events, metadata

**Базы данных:**
- `ai_video_interview` - главная БД
- Отдельные схемы для каждого сервиса (user_service, interview_service, etc.)

**Credentials:**
- User: `postgres`
- Password: `postgres`
- Database: `ai_video_interview`

**Volumes:**
- `postgres_data:/var/lib/postgresql/data` - персистентное хранилище
- `./scripts/setup/init-db.sql` - инициализация схем при первом запуске

**Health Check:** `pg_isready -U postgres`

---

### 2. Keycloak PostgreSQL

**Image:** `postgres:16-alpine`  
**Container:** `ai-interview-keycloak-postgres`  
**Port:** Internal only

**Назначение:**
- Отдельная БД для Keycloak (изоляция auth data)
- Хранит: users, realms, clients, sessions

**Credentials:**
- User: `keycloak`
- Password: `keycloak-password`
- Database: `keycloak`

**Volumes:**
- `keycloak_postgres_data:/var/lib/postgresql/data`

**Health Check:** `pg_isready -d keycloak -U keycloak`

---

## 💾 CACHE & STORAGE LAYER

### 3. Redis

**Image:** `redis:7-alpine`  
**Container:** `ai-interview-redis`  
**Port:** `6379`

**Назначение:**
- Session storage
- Cache для часто используемых данных
- Rate limiting counters
- Temporary tokens
- Pub/Sub для real-time features

**Persistence:** AOF (Append Only File) enabled

**Volumes:**
- `redis_data:/data`

**Health Check:** `redis-cli ping`

**Использование:**
```typescript
// User Service - cache user profiles
// API Gateway - rate limiting
// Billing Service - quota cache
```

---

### 4. MinIO (S3-Compatible Storage)

**Image:** `minio/minio:latest`  
**Container:** `ai-interview-minio`  
**Ports:**
- `9000` - S3 API endpoint
- `9001` - Web Console (Admin UI)

**Назначение:**
- Хранение медиафайлов (видео, аудио, изображения)
- User avatars
- Generated reports (PDF)
- Thumbnails и previews

**Credentials:**
- Root User: `minioadmin`
- Root Password: `minioadmin123`

**Volumes:**
- `minio_data:/data`

**Web Console:** http://localhost:9001

**Buckets (создаются автоматически):**
- `interviews` - ответы кандидатов
- `avatars` - user avatars
- `reports` - PDF reports
- `thumbnails` - video thumbnails

**Health Check:** `curl http://localhost:9000/minio/health/live`

---

## 📨 MESSAGING LAYER

### 5. Kafka (KRaft Mode)

**Image:** `confluentinc/cp-kafka:7.4.0`  
**Container:** `ai-interview-kafka`  
**Ports:**
- `9092` - External listener (localhost)
- `9997` - JMX metrics port

**Назначение:**
- Event-driven архитектура
- Асинхронная коммуникация между микросервисами
- Event sourcing
- DLQ (Dead Letter Queue)

**KRaft Mode:** Без Zookeeper (современный подход)

**Volumes:**
- `kafka_data:/var/lib/kafka/data`

**Topics (автоматически создаются сервисами):**
```
user-events
interview-events
candidate-events
media-events
analysis-events
notification-events
billing-events
user-events-dlq
interview-events-dlq
```

**Key Configuration:**
- Single node (development)
- Replication factor: 1
- Partitions: 3 per topic
- Retention: 7 days

---

### 6. Kafka UI

**Image:** `provectuslabs/kafka-ui:latest`  
**Container:** `ai-interview-kafka-ui`  
**Port:** `8080`

**Назначение:**
- Web интерфейс для управления Kafka
- Просмотр топиков, сообщений, consumer groups
- Monitoring lag и throughput

**URL:** http://localhost:8080

**Features:**
- Browse topics and messages
- View consumer groups
- Check lag and offsets
- Create/delete topics
- Produce test messages

---

### 7. Kafka Exporter

**Image:** `danielqsj/kafka-exporter:latest`  
**Container:** `ai-interview-kafka-exporter`  
**Port:** `9308`

**Назначение:**
- Экспорт Kafka метрик в Prometheus
- Мониторинг topic lag
- Consumer group health

**Metrics Endpoint:** http://localhost:9308/metrics

**Exported Metrics:**
- `kafka_topic_partitions` - количество партиций
- `kafka_consumergroup_lag` - consumer lag
- `kafka_topic_partition_current_offset` - текущий offset

---

## 🔐 AUTHENTICATION LAYER

### 8. Keycloak

**Image:** `quay.io/keycloak/keycloak:latest`  
**Container:** `ai-interview-keycloak`  
**Port:** `8090` (mapped from internal 8080)

**Назначение:**
- Identity Provider (OAuth 2.0 / OIDC)
- User authentication и authorization
- JWT token management
- SSO (Single Sign-On)
- User federation

**Admin Console:** http://localhost:8090

**Credentials:**
- Admin: `admin`
- Password: `admin123`

**Volumes:**
- `./keycloak-theme:/opt/keycloak/themes` - custom themes

**Realm:** `ai-video-interview`

**Clients:**
- `ai-video-interview-app` - Main application
- `api-gateway` - Service account для внутренних вызовов

**Features:**
- Login/Registration flows
- Password reset
- Email verification
- Custom logout flow (auto-redirect)
- Social login (Google, GitHub - future)

---

## 📊 OBSERVABILITY LAYER

### 9. Prometheus

**Image:** `prom/prometheus:latest`  
**Container:** `ai-interview-prometheus`  
**Port:** `9090`

**Назначение:**
- Сбор и хранение метрик (time-series database)
- Scraping metrics от всех сервисов
- Alerting rules
- Query engine (PromQL)

**Web UI:** http://localhost:9090

**Volumes:**
- `./monitoring/prometheus.yml` - конфигурация
- `./monitoring/rules` - alerting rules
- `prometheus_data` - TSDB storage

**Retention:** 15 days

**Scrape Targets:**
```yaml
- NestJS services (:3001/metrics, :3003/metrics, etc.)
- Kafka Exporter (:9308/metrics)
- Node Exporter (:9100/metrics)
- Keycloak (:8090/metrics)
```

**Key Metrics:**
- HTTP request duration
- Request count by endpoint
- Error rates (4xx, 5xx)
- Database connection pool
- Kafka consumer lag
- System resources (CPU, Memory)

---

### 10. Loki (Logs Database)

**Image:** `grafana/loki:2.9.0`  
**Container:** `ai-interview-loki`  
**Port:** `3100`

**Назначение:**
- Centralized logging storage (CloudWatch Logs alternative)
- Log aggregation от всех сервисов
- Efficient log indexing (labels, not full-text)

**Volumes:**
- `./monitoring/loki/loki-config.yml` - конфигурация

**Log Retention:** 30 days (configurable)

**Labels:**
```
{service="api-gateway", level="info"}
{service="user-service", level="debug"}
{service="interview-service", level="error"}
```

**Storage:** Local filesystem (production: S3)

---

### 11. Promtail (Log Collector)

**Image:** `grafana/promtail:2.9.0`  
**Container:** `ai-interview-promtail`  
**Port:** N/A (agent)

**Назначение:**
- Сбор логов от всех источников
- Парсинг и enrichment
- Отправка в Loki

**Sources:**
- Docker container logs
- File logs from `/apps/*/logs/*.log`
- System logs from `/var/log`

**Volumes:**
- `./monitoring/promtail/promtail-config.yml` - конфигурация
- `/var/log:/var/log:ro` - system logs
- `/var/lib/docker/containers` - docker logs
- `./apps:/app:ro` - application logs

**Features:**
- Automatic service detection
- JSON log parsing
- Label extraction
- Multi-line log support

---

### 12. Jaeger (Distributed Tracing)

**Image:** `jaegertracing/all-in-one:latest`  
**Container:** `ai-interview-jaeger`  
**Ports:**
- `16686` - Jaeger UI
- `14268` - HTTP collector (for spans)
- `14250` - gRPC collector
- `6831/udp` - UDP agent

**Назначение:**
- Distributed tracing (AWS X-Ray alternative)
- Request flow visualization
- Performance bottleneck detection
- Microservice dependency mapping

**Web UI:** http://localhost:16686

**Features:**
- Trace search и filtering
- Service dependency graph
- Latency analysis
- Error tracking

**Usage:**
```typescript
// Traces HTTP requests across services:
Client → API Gateway → User Service → Database
        → Interview Service → Kafka
```

---

### 13. Grafana (Visualization)

**Image:** `grafana/grafana:10.1.0`  
**Container:** `ai-interview-grafana`  
**Port:** `3002` (mapped from 3000)

**Назначение:**
- Unified observability dashboard
- Visualization для Metrics, Logs, Traces
- Alerting и notifications
- Custom dashboards

**Web UI:** http://localhost:3002

**Credentials:**
- User: `admin`
- Password: `admin123`

**Volumes:**
- `grafana_data:/var/lib/grafana` - persistence
- `./monitoring/grafana/provisioning` - datasources
- `./monitoring/grafana/dashboards` - предустановленные дашборды

**Data Sources:**
- Prometheus (metrics)
- Loki (logs)
- Jaeger (traces)

**Pre-configured Dashboards:**
- `API Gateway Metrics`
- `Authentication Flow Dashboard`
- `Kafka Monitoring`
- `Service Health Overview`
- `Log Analysis`

---

### 14. Node Exporter

**Image:** `prom/node-exporter:v1.6.1`  
**Container:** `ai-interview-node-exporter`  
**Port:** `9100`

**Назначение:**
- Экспорт системных метрик хост-машины
- CPU, Memory, Disk, Network usage
- Process statistics

**Metrics Endpoint:** http://localhost:9100/metrics

**Collected Metrics:**
- CPU usage by core
- Memory: used, free, cached
- Disk I/O, space usage
- Network traffic
- System load average

**Volumes:**
- `/proc:/host/proc:ro`
- `/sys:/host/sys:ro`
- `/:/rootfs:ro`

---

## 📈 ANALYTICS LAYER (Optional)

### 15. ClickHouse

**Image:** `clickhouse/clickhouse-server:23.8-alpine`  
**Container:** `ai-interview-clickhouse`  
**Ports:**
- `8123` - HTTP interface
- `9009` - Native TCP interface

**Назначение:**
- OLAP database для аналитики больших объемов
- Агрегация событий
- Fast analytical queries
- Reporting backend

**Status:** ⚠️ Optional (profile: `analytics`)

**Запуск:**
```bash
docker-compose --profile analytics up -d clickhouse
```

**Volumes:**
- `clickhouse_data:/var/lib/clickhouse`

**Use Cases:**
- User behavior analytics
- Interview completion funnel
- Performance metrics aggregation
- Time-series data analysis

**Credentials:**
- User: `default`
- Password: (empty)

---

## 🌐 Network Architecture

### Docker Network

**Name:** `ai-interview-network`  
**Type:** Bridge (default)

**Internal DNS:**
```
postgres:5432
redis:6379
minio:9000
kafka:29092
keycloak:8080
prometheus:9090
loki:3100
grafana:3000
```

**Services Communication:**
```
API Gateway → postgres (DB queries)
            → redis (cache)
            → kafka (events)
            → keycloak (token validation)

User Service → postgres (users DB)
             → minio (avatars)
             → kafka (events)
             → redis (cache)

All Services → loki (logs via winston-loki)
             → jaeger (traces via OpenTelemetry)
```

---

## 📦 Volumes (Persistent Storage)

| Volume | Size | Purpose | Backup Priority |
|--------|------|---------|-----------------|
| `postgres_data` | ~5GB | Main database | 🔴 CRITICAL |
| `keycloak_postgres_data` | ~500MB | Auth database | 🔴 CRITICAL |
| `minio_data` | ~50GB+ | Media files | 🟡 HIGH |
| `kafka_data` | ~10GB | Message logs | 🟢 MEDIUM |
| `redis_data` | ~1GB | Cache/Sessions | 🟢 LOW (ephemeral) |
| `grafana_data` | ~500MB | Dashboards | 🟢 MEDIUM |
| `clickhouse_data` | ~20GB | Analytics | 🟢 MEDIUM |

**Backup Strategy:**
- PostgreSQL: Daily dumps
- MinIO: Weekly S3 sync (production)
- Kafka: Not backed up (event replay from source)
- Redis: Not backed up (cache only)

---

## 🚀 Quick Start

### Запуск всех контейнеров:
```bash
docker-compose up -d
```

### Запуск только базовых сервисов:
```bash
docker-compose up -d postgres redis minio kafka keycloak
```

### Запуск только observability стека:
```bash
docker-compose up -d prometheus loki grafana jaeger
```

### Проверка статуса:
```bash
docker-compose ps
```

### Просмотр логов:
```bash
docker-compose logs -f [service-name]
```

### Остановка всех контейнеров:
```bash
docker-compose down
```

### Остановка с удалением volumes (DANGER):
```bash
docker-compose down -v
```

---

## 🔧 Port Reference

| Port | Service | Purpose |
|------|---------|---------|
| 3001 | API Gateway | Main HTTP endpoint |
| 3002 | Grafana | Observability UI |
| 3003 | User Service | Internal API |
| 3004 | Interview Service | Internal API |
| 3100 | Loki | Log aggregation |
| 5432 | PostgreSQL | Main database |
| 6379 | Redis | Cache |
| 8080 | Kafka UI | Kafka management |
| 8090 | Keycloak | Auth provider |
| 8123 | ClickHouse | Analytics HTTP |
| 9000 | MinIO | S3 API |
| 9001 | MinIO Console | Admin UI |
| 9009 | ClickHouse | Native TCP |
| 9090 | Prometheus | Metrics |
| 9092 | Kafka | Message broker |
| 9100 | Node Exporter | System metrics |
| 9308 | Kafka Exporter | Kafka metrics |
| 14268 | Jaeger | Trace collector |
| 16686 | Jaeger UI | Tracing UI |

---

## 🔐 Default Credentials

**Security Warning:** Измените эти credentials в production!

| Service | Username | Password |
|---------|----------|----------|
| PostgreSQL | `postgres` | `postgres` |
| Keycloak DB | `keycloak` | `keycloak-password` |
| Keycloak Admin | `admin` | `admin123` |
| MinIO | `minioadmin` | `minioadmin123` |
| Grafana | `admin` | `admin123` |
| ClickHouse | `default` | (empty) |

---

## 📊 Resource Requirements

**Minimum (Development):**
- CPU: 4 cores
- RAM: 8 GB
- Disk: 50 GB

**Recommended (Development):**
- CPU: 8 cores
- RAM: 16 GB
- Disk: 100 GB SSD

**Production:**
- CPU: 16+ cores
- RAM: 32+ GB
- Disk: 500+ GB SSD

---

## 🐛 Troubleshooting

### Container не стартует:
```bash
docker-compose logs [container-name]
docker-compose ps
```

### Проблемы с портами (EADDRINUSE):
```bash
npm run cleanup:ports
# или
lsof -ti:PORT | xargs kill -9
```

### Проблемы с Kafka:
```bash
# Проверить connectivity
docker exec -it ai-interview-kafka kafka-topics --list --bootstrap-server localhost:9092

# Пересоздать
docker-compose down
docker volume rm ai-video-interview_kafka_data
docker-compose up -d kafka
```

### Проблемы с PostgreSQL:
```bash
# Проверить подключение
docker exec -it ai-interview-postgres psql -U postgres -d ai_video_interview

# Пересоздать схемы
npm run migrate:reset
```

### Очистка всего (DANGER):
```bash
docker-compose down -v
docker system prune -a --volumes
```

---

**Последнее обновление:** 2025-10-06  
**Автор:** AI Video Interview Team
