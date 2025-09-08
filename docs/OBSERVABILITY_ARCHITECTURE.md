# Observability Architecture: Полное руководство

## 📖 Содержание

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Компоненты стека](#компоненты-стека)
3. [Потоки данных](#потоки-данных)
4. [Метрики (Metrics)](#метрики-metrics)
5. [Логи (Logs)](#логи-logs)
6. [Трейсинг (Traces)](#трейсинг-traces)
7. [Best Practices](#best-practices)
8. [Use Cases](#use-cases)
9. [Troubleshooting](#troubleshooting)

## 🏗️ Обзор архитектуры

Наш observability стек построен на принципе **трех столпов наблюдаемости**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     METRICS     │    │      LOGS       │    │     TRACES      │
│   (Prometheus)  │    │     (Loki)      │    │    (Jaeger)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     GRAFANA     │
                    │ (Visualization) │
                    └─────────────────┘
```

### Архитектурная схема

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│ API Gateway  │────▶│ User Service │────▶│Interview Svc │
│   :3002      │     │    :3003     │     │    :3004     │
│              │     │              │     │              │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ /metrics           │ /metrics           │ /metrics
       │ structured logs    │ structured logs    │ structured logs
       │ traces             │ traces             │ traces
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                  OBSERVABILITY LAYER                   │
├─────────────────┬─────────────────┬─────────────────────┤
│   Prometheus    │      Loki       │       Jaeger        │
│   :9090         │     :3100       │      :16686         │
│                 │                 │                     │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────────┐ │
│ │   Scraper   │ │ │  Promtail   │ │ │ OTLP Collector  │ │
│ │ Pull /metrics│ │ │ Tail logs   │ │ │ Receive spans   │ │
│ │ Every 15s   │ │ │ Push to Loki│ │ │ Store traces    │ │
│ └─────────────┘ │ └─────────────┘ │ └─────────────────┘ │
└─────────────────┴─────────────────┴─────────────────────┘
                           │
                           ▼
                 ┌─────────────────┐
                 │     GRAFANA     │
                 │      :3001      │
                 │                 │
                 │ ┌─────────────┐ │
                 │ │ Dashboards  │ │
                 │ │ Explore     │ │
                 │ │ Alerts      │ │
                 │ └─────────────┘ │
                 └─────────────────┘
```

## 🧩 Компоненты стека

### Prometheus (Метрики)
- **Порт**: 9090
- **Назначение**: Сбор и хранение метрик
- **Тип**: Pull-based система
- **Хранение**: Time Series Database

### Loki (Логи)
- **Порт**: 3100  
- **Назначение**: Агрегация и индексация логов
- **Тип**: Push-based система
- **Особенность**: "Prometheus for logs"

### Jaeger (Трейсинг)
- **Порт**: 16686
- **Назначение**: Distributed tracing
- **Протокол**: OpenTelemetry (OTLP)
- **Хранение**: In-memory (dev mode)

### Grafana (Визуализация)
- **Порт**: 3001
- **Назначение**: Unified observability UI
- **Datasources**: Prometheus, Loki, Jaeger
- **Возможности**: Dashboards, Explore, Alerts

### Promtail (Log Shipper)
- **Назначение**: Сбор логов и отправка в Loki
- **Конфигурация**: Tail файлов логов
- **Парсинг**: JSON, regex, pipeline stages

## 🔄 Потоки данных

### 1. Metrics Flow
```
API Gateway                 Prometheus              Grafana
┌─────────────┐            ┌─────────────┐         ┌─────────────┐
│             │◄─── GET    │             │         │             │
│ /metrics    │    /metrics│  Scraper    │         │ Dashboard   │
│ endpoint    │    15s     │             │         │             │
│             │            │             │         │             │
│ Counter()   │            │ TSDB        │◄────────│ PromQL      │
│ Histogram() │            │ Storage     │  Query  │ Queries     │
│ Gauge()     │            │             │         │             │
└─────────────┘            └─────────────┘         └─────────────┘
```

### 2. Logs Flow
```
API Gateway                 Promtail                Loki                 Grafana
┌─────────────┐            ┌─────────────┐         ┌─────────────┐      ┌─────────────┐
│             │            │             │         │             │      │             │
│ Winston     │  Write     │ Tail        │  POST   │ Ingester    │      │ Explore     │
│ Logger      │──────────► │ Log Files   │────────►│             │◄─────│ LogQL       │
│             │ JSON logs  │             │ HTTP API│ Index       │ Query│ Queries     │
│             │            │ Pipeline    │         │ Store       │      │             │
│ Structured  │            │ Parsing     │         │ Chunks      │      │             │
│ Format      │            │             │         │             │      │             │
└─────────────┘            └─────────────┘         └─────────────┘      └─────────────┘
```

### 3. Traces Flow
```
API Gateway                 Jaeger                  Grafana
┌─────────────┐            ┌─────────────┐         ┌─────────────┐
│             │            │             │         │             │
│ OpenTelemetry│  OTLP     │ Collector   │         │ Explore     │
│ SDK         │──────────► │             │◄────────│ Trace View  │
│             │ HTTP/gRPC  │ Agent       │  Query  │             │
│             │            │             │ API     │ Service Map │
│ Spans       │            │ Storage     │         │ Dependencies│
│ Context     │            │ (Memory)    │         │             │
└─────────────┘            └─────────────┘         └─────────────┘
```

## 📊 Метрики (Metrics)

### Теория

**Prometheus** - это pull-based система мониторинга. Приложения экспонируют метрики через HTTP endpoint `/metrics`, а Prometheus периодически опрашивает эти endpoints.

### Типы метрик

1. **Counter** - монотонно возрастающий счетчик
```javascript
const authRequestsTotal = new Counter({
  name: 'auth_requests_total',
  help: 'Total authentication requests',
  labelNames: ['type', 'status']
});

authRequestsTotal.inc({ type: 'login', status: 'success' });
```

2. **Histogram** - измерение длительности/размеров с бакетами
```javascript
const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  buckets: [0.1, 0.5, 1, 2, 5]
});

const end = httpDuration.startTimer();
// ... request processing
end(); // Записывает в histogram
```

3. **Gauge** - значение которое может увеличиваться/уменьшаться
```javascript
const activeSessions = new Gauge({
  name: 'auth_active_sessions',
  help: 'Active user sessions'
});

activeSessions.set(42);
```

### Scraping Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['host.docker.internal:3002']
    metrics_path: /metrics
    scrape_interval: 15s
```

### PromQL Queries

```promql
# Rate of requests per second
rate(auth_requests_total[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate percentage
rate(auth_requests_total{status="failure"}[5m]) / 
rate(auth_requests_total[5m]) * 100
```

## 📋 Логи (Logs)

### Теория

**Loki** работает как "Prometheus для логов" - индексирует только метаданные (labels), а не содержимое логов. Это делает его более эффективным по сравнению с Elasticsearch.

### Structured Logging

```javascript
// Winston configuration
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        service: 'api-gateway',
        traceId: getTraceId(),
        ...meta
      });
    })
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/api-gateway.log' })
  ]
});

logger.info('Auth: login_initiation', {
  action: 'login_initiation',
  category: 'authentication',
  userId: user.id,
  traceId: span.getTraceId()
});
```

### Promtail Configuration

```yaml
# promtail-config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: nestjs-apps
    static_configs:
      - targets:
          - localhost
        labels:
          job: nestjs-apps
          __path__: /app/logs/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            service: service
            timestamp: timestamp
      - labels:
          level:
          service:
      - timestamp:
          source: timestamp
          format: "2006-01-02 15:04:05.000"
```

### LogQL Queries

```logql
# Все логи API Gateway
{service="api-gateway"}

# Логи с ошибками
{service="api-gateway"} |= "ERROR"

# JSON парсинг и фильтрация
{service="api-gateway"} | json | level="ERROR"

# Поиск по traceId
{service="api-gateway"} | json | traceId="abc123"

# Rate запросов из логов
rate({service="api-gateway"} |= "login_initiation" [5m])
```

## 📡 Трейсинг (Traces)

### Теория

**Distributed Tracing** позволяет отслеживать запросы через множество сервисов. Каждый запрос создает **trace**, состоящий из **spans**.

### OpenTelemetry Integration

```javascript
// tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: 'http://localhost:14268/api/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### Manual Spans

```javascript
const opentelemetry = require('@opentelemetry/api');

class AuthService {
  async login(redirectUri) {
    const tracer = opentelemetry.trace.getTracer('api-gateway');
    
    return tracer.startActiveSpan('auth.login', async (span) => {
      try {
        span.setAttributes({
          'auth.redirect_uri': redirectUri,
          'auth.method': 'oauth',
        });
        
        const result = await this.processLogin(redirectUri);
        
        span.setAttributes({
          'auth.success': true,
          'auth.user_id': result.userId,
        });
        
        return result;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
```

### Trace Context Propagation

```javascript
// Автоматическое распространение trace context через HTTP headers
const fetch = require('node-fetch');

// Trace context автоматически добавляется в headers
const response = await fetch('http://user-service:3003/users/123', {
  headers: {
    'Authorization': 'Bearer token'
    // 'traceparent': '00-abc123...' - добавляется автоматически
  }
});
```

## 🎯 Best Practices

### Метрики

1. **Naming Convention**
```
# Хорошо
http_requests_total
auth_login_duration_seconds
kafka_messages_published_total

# Плохо
requests
login_time
kafka_msgs
```

2. **Labels Strategy**
```javascript
// Хорошо - ограниченный набор значений
httpRequests.inc({ method: 'GET', status: '200', endpoint: '/auth/login' });

// Плохо - high cardinality (много уникальных значений)
httpRequests.inc({ user_id: '12345', trace_id: 'abc...' });
```

3. **Histogram Buckets**
```javascript
// API latency buckets (milliseconds)
buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]

// File size buckets (bytes)  
buckets: [1024, 10240, 102400, 1048576, 10485760]
```

### Логирование

1. **Structured Logging**
```javascript
// Хорошо
logger.info('User login attempt', {
  action: 'login_attempt',
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  traceId: getTraceId()
});

// Плохо
logger.info(`User ${user.id} tried to login from ${req.ip}`);
```

2. **Log Levels**
```
ERROR - Ошибки, требующие немедленного внимания
WARN  - Потенциальные проблемы
INFO  - Важные события приложения
DEBUG - Детальная информация для отладки
```

3. **Sensitive Data**
```javascript
// Хорошо
logger.info('Login successful', {
  userId: user.id,
  hashedPassword: 'sha256:abc123...'
});

// Плохо
logger.info('Login successful', {
  userId: user.id,
  password: 'plaintext_password'
});
```

### Трейсинг

1. **Span Naming**
```javascript
// Хорошо
span.updateName('auth.oauth.callback');
span.updateName('database.user.select');
span.updateName('kafka.publish.auth_events');

// Плохо  
span.updateName('callback');
span.updateName('db_query');
```

2. **Attributes**
```javascript
// Хорошо
span.setAttributes({
  'http.method': 'POST',
  'http.url': '/auth/callback',
  'http.status_code': 200,
  'auth.provider': 'authentik',
  'user.id': user.id
});
```

3. **Error Handling**
```javascript
try {
  await processAuth();
} catch (error) {
  span.recordException(error);
  span.setStatus({ 
    code: opentelemetry.SpanStatusCode.ERROR,
    message: error.message 
  });
  throw error;
}
```

## 🎮 Use Cases

### Case 1: Мониторинг производительности API

**Цель**: Отслеживать latency и throughput API Gateway

**Метрики**:
```promql
# Request rate
rate(http_requests_total{service="api-gateway"}[5m])

# Average latency
rate(http_request_duration_seconds_sum[5m]) / 
rate(http_request_duration_seconds_count[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / 
rate(http_requests_total[5m])
```

**Dashboard**: Grafana panels с графиками RPS, Latency, Error Rate

### Case 2: Отладка authentication flow

**Цель**: Понять почему пользователи не могут залогиниться

**Logs**:
```logql
{service="api-gateway"} | json | category="authentication" | level="ERROR"
```

**Traces**: Jaeger → Service: api-gateway → Operation: auth.login

**Correlation**: По traceId связать логи, метрики и трейсы

### Case 3: Мониторинг Kafka событий

**Цель**: Отслеживать обработку событий в Kafka

**Метрики**:
```promql
# Messages published
rate(kafka_messages_produced_total[5m])

# Publishing failures
rate(kafka_messages_produced_total{status="failure"}[5m])
```

**Logs**:
```logql
{service="api-gateway"} |= "Kafka:" | json
```

### Case 4: SLA мониторинг

**Цель**: 99.9% uptime, <200ms P95 latency

**Alerts**:
```yaml
# prometheus rules
groups:
  - name: api_gateway_sla
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.2
        for: 2m
        annotations:
          summary: "API Gateway P95 latency above 200ms"
          
      - alert: HighErrorRate  
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 1m
        annotations:
          summary: "API Gateway error rate above 1%"
```

## 🔧 Troubleshooting

### Prometheus не видит метрики

1. **Проверить /metrics endpoint**:
```bash
curl http://localhost:3002/metrics | grep auth_requests_total
```

2. **Проверить Prometheus targets**:
- http://localhost:9090/targets
- Status должен быть UP

3. **Проверить конфигурацию**:
```yaml
# prometheus.yml
- job_name: 'api-gateway'
  static_configs:
    - targets: ['host.docker.internal:3002']  # Правильный порт?
```

### Loki не получает логи

1. **Проверить Promtail**:
```bash
docker logs ai-interview-promtail
```

2. **Проверить путь к логам**:
```yaml
# promtail-config.yml
__path__: /app/logs/*.log  # Файлы существуют?
```

3. **Проверить формат логов**:
- Логи должны быть в JSON формате
- Структура должна соответствовать pipeline_stages

### Jaeger не показывает трейсы

1. **Проверить инициализацию трейсинга**:
```javascript
// tracing.js должен импортироваться ПЕРВЫМ
require('./tracing');
const app = require('./app');
```

2. **Проверить endpoint**:
```javascript
// Правильный Jaeger endpoint?
endpoint: 'http://localhost:14268/api/traces'
```

3. **Проверить spans**:
- Spans должны вызывать span.end()
- Проверить что нет ошибок в консоли

## 📚 Дополнительные ресурсы

- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
- [Loki LogQL Documentation](https://grafana.com/docs/loki/latest/logql/)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/instrumentation/js/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

## 🎯 Заключение

Наш observability стек обеспечивает полную видимость системы через:

- **Метрики** - что происходит (counters, histograms, gauges)
- **Логи** - детальная информация о событиях  
- **Трейсы** - как запросы проходят через систему

Правильная реализация этих трех столпов позволяет:
- Быстро обнаруживать проблемы
- Понимать performance bottlenecks  
- Отлаживать сложные сценарии
- Соблюдать SLA и мониторить бизнес-метрики

Главное - **структурированность** (JSON логи, правильные labels, осмысленные span names) и **корреляция** (traceId связывает все три типа данных).
