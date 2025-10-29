# Observability Overview

**Версия:** 1.0  
**Дата:** 2025-10-06  
**Статус:** ✅ Реализовано

---

## 🎯 Что такое Observability?

**Observability** (наблюдаемость) — это способность понять внутреннее состояние системы по её внешним выходам.

В отличие от простого мониторинга, observability позволяет не только знать "что сломалось", но и понимать "почему это произошло".

---

## 📊 Три столпа Observability

Наш observability стек построен на **трех столпах**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     METRICS     │    │      LOGS       │    │     TRACES      │
│   (Prometheus)  │    │     (Loki)      │    │    (Jaeger)     │
│                 │    │                 │    │                 │
│  Что?           │    │  Почему?        │    │  Как?           │
│  Сколько?       │    │  Детали         │    │  Путь запроса   │
│  Когда?         │    │  Контекст       │    │  Зависимости    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     GRAFANA     │
                    │ (Visualization) │
                    │                 │
                    │  Unified UI     │
                    └─────────────────┘
```

### 1. **Metrics (Метрики)**
- **Что:** Числовые показатели системы
- **Примеры:** Request rate, error rate, latency, CPU usage
- **Инструмент:** Prometheus
- **Когда использовать:** Мониторинг общего здоровья, алерты

### 2. **Logs (Логи)**
- **Что:** Событийные записи происходящего
- **Примеры:** "User logged in", "Database query failed", "Token expired"
- **Инструмент:** Loki
- **Когда использовать:** Debugging, понимание контекста

### 3. **Traces (Трейсы)**
- **Что:** Путь запроса через систему
- **Примеры:** Client → Gateway → User Service → Database
- **Инструмент:** Jaeger
- **Когда использовать:** Анализ производительности, поиск bottleneck'ов

---

## 🏗️ Архитектура нашего стека

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│ API Gateway  │────▶│ User Service │────▶│Interview Svc │
│   :3001      │     │    :3003     │     │    :3004     │
│              │     │              │     │              │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ /metrics           │ /metrics           │ /metrics
       │ winston logs       │ winston logs       │ winston logs
       │ opentelemetry      │ opentelemetry      │ opentelemetry
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                  OBSERVABILITY LAYER                    │
├─────────────────┬─────────────────┬─────────────────────┤
│   PROMETHEUS    │      LOKI       │       JAEGER        │
│   :9090         │     :3100       │      :16686         │
│                 │                 │                     │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────────┐ │
│ │   Scraper   │ │ │winston-loki │ │ │ OTLP Collector  │ │
│ │ Pull /metrics│ │ │Direct push  │ │ │ Receive spans   │ │
│ │ Every 15s   │ │ │ Real-time   │ │ │ Store traces    │ │
│ └─────────────┘ │ └─────────────┘ │ └─────────────────┘ │
└─────────────────┴─────────────────┴─────────────────────┘
                           │
                           ▼
                 ┌─────────────────┐
                 │     GRAFANA     │
                 │      :3002      │
                 │                 │
                 │ • Dashboards    │
                 │ • Explore       │
                 │ • Alerts        │
                 └─────────────────┘
```

---

## 🧩 Компоненты стека

### Prometheus (Metrics)
- **URL:** http://localhost:9090
- **Назначение:** Сбор и хранение метрик
- **Тип:** Pull-based (scraping)
- **Retention:** 15 days
- **Query Language:** PromQL

**Экспортируемые метрики:**
- HTTP request rate, duration, errors
- Database connection pool
- Kafka consumer lag
- System resources (CPU, Memory)

### Loki (Logs)
- **URL:** http://localhost:3100
- **Назначение:** Агрегация логов
- **Тип:** Push-based (прямая отправка через winston-loki)
- **Retention:** 30 days
- **Query Language:** LogQL
- **Особенность:** "Prometheus for logs" - индексирует только labels

**Источники логов:**
- Winston transports (прямая отправка)
- Файлы через Promtail (fallback)

### Jaeger (Traces)
- **URL:** http://localhost:16686
- **Назначение:** Distributed tracing
- **Протокол:** OpenTelemetry (OTLP)
- **Storage:** In-memory (dev), Elasticsearch (prod)
- **Features:** Service graph, latency analysis

**Трейсы показывают:**
- Request flow между сервисами
- Latency каждого hop
- Ошибки и их источник

### Grafana (Visualization)
- **URL:** http://localhost:3002
- **Credentials:** admin / admin123
- **Назначение:** Unified observability UI
- **Data Sources:** Prometheus, Loki, Jaeger

**Возможности:**
- Dashboards - визуализация метрик
- Explore - ad-hoc анализ
- Alerts - уведомления

---

## 🚀 Quick Start

### 1. Проверка что всё работает

```bash
# Проверь что контейнеры запущены
docker-compose ps

# Должны быть UP:
# prometheus, loki, grafana, jaeger
```

### 2. Доступ к UI

| Сервис | URL | Credentials |
|--------|-----|-------------|
| Grafana | http://localhost:3002 | admin / admin123 |
| Prometheus | http://localhost:9090 | - |
| Jaeger | http://localhost:16686 | - |
| Kafka UI | http://localhost:8080 | - |

### 3. Первый Dashboard

1. Открой Grafana → http://localhost:3002
2. Explore → Data source: **Prometheus**
3. Query: `rate(http_requests_total[5m])`
4. Увидишь HTTP request rate

### 4. Первый Log Query

1. Grafana → Explore → Data source: **Loki**
2. Query: `{service="api-gateway"} | json | level="info"`
3. Увидишь логи API Gateway

### 5. Первый Trace

1. Открой Jaeger → http://localhost:16686
2. Service: `api-gateway`
3. Find Traces
4. Увидишь request flows

---

## 📊 Типичные Use Cases

### Use Case 1: High Error Rate Alert

**Проблема:** Растет количество 500 ошибок

**Workflow:**
1. **Prometheus Alert** → Error rate > 5%
2. **Grafana Dashboard** → Spike на графике
3. **Loki Logs** → Детали ошибок
4. **Jaeger Trace** → Какой сервис падает

### Use Case 2: Slow API Response

**Проблема:** API медленно отвечает

**Workflow:**
1. **Prometheus** → Latency P95 > 1s
2. **Jaeger** → Trace показывает bottleneck в User Service
3. **Loki** → Database query logs показывают slow query
4. **Fix** → Добавить index

### Use Case 3: Authentication Issues

**Проблема:** Пользователи не могут залогиниться

**Workflow:**
1. **Loki** → `{service="api-gateway"} |= "auth" |= "failed"`
2. **Видишь** → "Token expired" errors
3. **Jaeger** → Trace показывает Keycloak 401
4. **Fix** → Проверить Keycloak connectivity

---

## 🎯 Best Practices

### Metrics
✅ **DO:**
- Экспортируй counters (total requests)
- Экспортируй histograms (latency distribution)
- Используй labels осторожно (не более 5-7)
- Именуй метрики описательно: `http_request_duration_seconds`

❌ **DON'T:**
- Не создавай high-cardinality labels (user_id, request_id)
- Не дублируй информацию в logs и metrics

### Logs
✅ **DO:**
- Используй structured logging (JSON)
- Добавляй traceId для корреляции
- Логируй важные события (auth, errors)
- Используй правильные levels (debug, info, warn, error)

❌ **DON'T:**
- Не логируй sensitive data (passwords, tokens)
- Не используй console.log (только LoggerService)
- Не логируй каждый request на debug level

### Traces
✅ **DO:**
- Трейси inter-service calls
- Добавляй custom spans для важных операций
- Используй trace context propagation
- Sample traces разумно (1-10%)

❌ **DON'T:**
- Не трейси всё подряд (performance overhead)
- Не забывай close spans

---

## 🔧 Configuration

### Environment Variables

```bash
# Prometheus
PROMETHEUS_RETENTION=15d
PROMETHEUS_SCRAPE_INTERVAL=15s

# Loki
LOKI_HOST=http://localhost:3100
LOKI_RETENTION=30d

# Jaeger
JAEGER_ENDPOINT=http://localhost:14268/api/traces
JAEGER_SAMPLE_RATE=0.1

# Grafana
GF_SECURITY_ADMIN_PASSWORD=admin123
GF_USERS_ALLOW_SIGN_UP=false
```

---

## 📚 Дополнительная документация

- [Logging Guide](./LOGGING_GUIDE.md) - Winston, Loki, structured logging
- [Metrics Guide](./METRICS_GUIDE.md) - Prometheus, PromQL queries
- [Tracing Guide](./TRACING_GUIDE.md) - Jaeger, OpenTelemetry
- [Alerts](./ALERTS.md) - Alerting rules и notifications
- [Prometheus Queries](./queries/prometheus-queries.md) - Полезные PromQL queries
- [Loki Queries](./queries/loki-queries.md) - Полезные LogQL queries

---

## 🐛 Troubleshooting

### Prometheus не scraping метрики

```bash
# Проверь /metrics endpoint
curl http://localhost:3001/metrics

# Проверь Prometheus targets
# http://localhost:9090/targets
```

### Loki не получает логи

```bash
# Проверь логи контейнера
docker-compose logs loki

# Проверь winston-loki transport
# Логи должны содержать: "Log sent to Loki"
```

### Jaeger не показывает traces

```bash
# Проверь Jaeger collector
curl http://localhost:14268/api/traces

# Проверь OpenTelemetry integration в коде
```

### Grafana не показывает data sources

```bash
# Перезапусти Grafana
docker-compose restart grafana

# Проверь provisioning
ls -la monitoring/grafana/provisioning/datasources/
```

---

**Последнее обновление:** 2025-10-06
