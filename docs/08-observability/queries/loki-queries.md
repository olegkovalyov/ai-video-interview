# Loki Queries Reference

**Полезные LogQL queries для поиска и анализа логов**

---

## 🎯 Базовые Queries

### По сервису
```logql
# Все логи API Gateway
{service="api-gateway"}

# Все логи User Service
{service="user-service"}

# Несколько сервисов
{service=~"api-gateway|user-service"}
```

### По уровню (level)
```logql
# Только errors
{service="api-gateway"} | json | level="ERROR"

# Только warnings
{service="api-gateway"} | json | level="WARN"

# Debug логи
{service="api-gateway"} | json | level="DEBUG"

# Info и выше
{service="api-gateway"} | json | level=~"INFO|WARN|ERROR"
```

### По содержимому (string matching)
```logql
# Содержит текст
{service="api-gateway"} |= "JWT"

# НЕ содержит текст
{service="api-gateway"} != "health"

# Regex match
{service="api-gateway"} |~ "auth.*failed"

# Case insensitive
{service="api-gateway"} |~ "(?i)error"
```

---

## 🔐 Authentication & Authorization

### Login Events
```logql
# Все login события
{service="api-gateway"} | json | category="authentication"

# Успешные логины
{service="api-gateway"} | json | message=~".*login.*success.*"

# Failed логины
{service="api-gateway"} | json | category="authentication" | level="ERROR"

# Логины конкретного пользователя
{service="api-gateway"} | json | userId="123e4567-..."
```

### Token Refresh
```logql
# Все refresh события
{service="api-gateway"} |= "refresh"

# Успешные refresh
{service="api-gateway"} |= "refresh" |= "success"

# Failed refresh
{service="api-gateway"} |= "refresh" |= "failed"

# Auto-refresh события
{service="api-gateway"} |= "Auto-refresh"
```

### JWT Errors
```logql
# JWT validation errors
{service="api-gateway"} |= "JWT" |= "ERROR"

# Token expired
{service="api-gateway"} |= "Token expired"

# Unauthorized
{service="api-gateway"} |= "Unauthorized"
```

---

## 📊 HTTP Request Logging

### По методу
```logql
# POST requests
{service="api-gateway"} | json | method="POST"

# GET requests
{service="api-gateway"} | json | method="GET"
```

### По endpoint
```logql
# /users/me requests
{service="api-gateway"} | json | url=~".*\/users\/me.*"

# Auth endpoints
{service="api-gateway"} | json | url=~".*\/auth\/.*"
```

### По status code
```logql
# 500 errors
{service="api-gateway"} | json | statusCode="500"

# 4xx errors
{service="api-gateway"} | json | statusCode=~"4.."

# Successful requests
{service="api-gateway"} | json | statusCode=~"2.."
```

### По latency
```logql
# Медленные запросы (> 1s)
{service="api-gateway"} | json | duration > 1000

# Очень медленные (> 5s)
{service="api-gateway"} | json | duration > 5000
```

---

## 🐛 Error Tracking

### Все ошибки
```logql
# Все ERROR level логи
{service=~".*"} | json | level="ERROR"

# С детализацией по сервисам
sum by (service) (count_over_time({service=~".*"} | json | level="ERROR" [1h]))
```

### Специфичные ошибки
```logql
# Database errors
{service=~".*"} | json | level="ERROR" |= "database"

# Kafka errors
{service=~".*"} | json | level="ERROR" |= "kafka"

# Keycloak errors
{service="api-gateway"} | json | level="ERROR" |= "Keycloak"
```

### Stack traces
```logql
# Логи с stack trace
{service=~".*"} | json | stack!=""

# Конкретное исключение
{service=~".*"} | json | error_name="UnauthorizedException"
```

---

## 🔍 Distributed Tracing Correlation

### По traceId
```logql
# Все логи одного request
{service=~".*"} | json | traceId="abc123def456"

# Форматированный вывод
{service=~".*"} 
  | json 
  | traceId="abc123def456"
  | line_format "{{.timestamp}} [{{.service}}] {{.message}}"
```

### Cross-service traces
```logql
# Gateway → User Service flow
{service=~"api-gateway|user-service"} 
  | json 
  | traceId="abc123"
  | line_format "{{.service}}: {{.message}}"
```

---

## 📦 Structured Data Queries

### Объекты в data field
```logql
# Логи со структурированными данными
{service="api-gateway"} | json | data!=""

# Доступ к вложенным полям
{service="api-gateway"} | json | data_userId="123"

# Форматирование data
{service="api-gateway"} 
  | json 
  | data!=""
  | line_format "{{.message}} | Data: {{.data}}"
```

### Custom context fields
```logql
# По userId
{service=~".*"} | json | userId!=""

# По sessionId
{service=~".*"} | json | sessionId="sess-123"

# По category
{service=~".*"} | json | category="performance"
```

---

## 📈 Metrics from Logs

### Count over time
```logql
# Errors за последний час
count_over_time({service="api-gateway"} | json | level="ERROR" [1h])

# Requests per minute
rate({service="api-gateway"} | json | category="http" [1m])
```

### Aggregations
```logql
# Ошибки по сервисам
sum by (service) (
  count_over_time({service=~".*"} | json | level="ERROR" [5m])
)

# Top users by activity
topk(10, 
  sum by (userId) (
    count_over_time({service=~".*"} | json | userId!="" [1h])
  )
)
```

### Rate calculations
```logql
# Error rate
rate({service="api-gateway"} | json | level="ERROR" [5m])

# Request rate по endpoints
sum by (url) (
  rate({service="api-gateway"} | json | category="http" [5m])
)
```

---

## 🎯 Business Metrics

### User Activity
```logql
# Новые пользователи
{service="user-service"} | json | message=~".*User created.*"

# Profile updates
{service="user-service"} | json | message=~".*profile.*updated.*"

# Avatar uploads
{service="user-service"} | json | message=~".*avatar.*uploaded.*"
```

### Interview Events
```logql
# Интервью созданы
{service="interview-service"} | json | message=~".*Interview created.*"

# Кандидат начал интервью
{service="candidate-service"} | json | message=~".*started interview.*"

# Кандидат завершил интервью
{service="candidate-service"} | json | message=~".*completed interview.*"
```

---

## ⚡ Performance Analysis

### Slow operations
```logql
# Медленные операции (> 1s)
{service=~".*"} 
  | json 
  | category="performance"
  | duration > 1000
  | line_format "{{.service}}: {{.operation}} took {{.duration}}ms"
```

### Database queries
```logql
# Все DB queries
{service=~".*"} | json | message=~".*database.*query.*"

# Медленные queries
{service=~".*"} 
  | json 
  | message=~".*database.*query.*"
  | duration > 500
```

### Kafka processing
```logql
# Kafka event processing
{service=~".*"} | json | category="kafka"

# Failed kafka events
{service=~".*"} | json | category="kafka" | success="false"
```

---

## 🎨 Formatting & Display

### Line Format
```logql
# Простой формат
{service="api-gateway"} 
  | json 
  | line_format "{{.timestamp}} {{.message}}"

# Детальный формат
{service="api-gateway"} 
  | json 
  | line_format "{{.timestamp}} [{{.level}}] {{.service}} - {{.message}} | User: {{.userId}}"
```

### Label Format
```logql
# Добавить custom labels
{service="api-gateway"} 
  | json 
  | label_format level="{{.level}}", user="{{.userId}}"
```

### JSON Pretty Print
```logql
# Показать как JSON
{service="api-gateway"} | json | line_format "{{.}}"
```

---

## 🔧 Advanced Queries

### Multi-line logs
```logql
# Stack traces (multi-line)
{service=~".*"} 
  | json 
  | stack!="" 
  | line_format "{{.message}}\n{{.stack}}"
```

### Regex extraction
```logql
# Extract values
{service="api-gateway"} 
  | json 
  | regexp `duration=(?P<duration>\d+)` 
  | duration > 1000
```

### Math operations
```logql
# Convert ms to seconds
{service=~".*"} 
  | json 
  | duration_seconds = duration / 1000
```

---

## 📊 Dashboard Queries

### Panel 1: Error Timeline
```logql
sum by (service) (
  rate({service=~".*"} | json | level="ERROR" [5m])
)
```

### Panel 2: Top Errors
```logql
topk(10,
  sum by (message) (
    count_over_time({service=~".*"} | json | level="ERROR" [1h])
  )
)
```

### Panel 3: Auth Events Stream
```logql
{service="api-gateway"} | json | category="authentication"
```

### Panel 4: Slow Operations
```logql
{service=~".*"} 
  | json 
  | category="performance"
  | duration > 1000
  | line_format "{{.service}}: {{.operation}} ({{.duration}}ms)"
```

---

## 🚨 Alerting Queries

### High Error Rate
```logql
sum(rate({service=~".*"} | json | level="ERROR" [5m])) > 0.1
```

### Auth Failures
```logql
sum(rate({service="api-gateway"} | json | message=~".*auth.*failed.*" [5m])) > 0.05
```

### No Logs (Service Down)
```logql
absent_over_time({service="api-gateway"}[5m])
```

---

## 💡 Tips & Tricks

### Time Ranges
- `[5m]` - последние 5 минут
- `[1h]` - последний час
- `[24h]` - последние 24 часа

### Operators
- `|=` - contains
- `!=` - not contains
- `|~` - regex match
- `!~` - regex not match

### JSON Parsing
- `| json` - parse JSON logs
- `| json field="value"` - parse specific field
- `| unpack` - unpack all fields as labels

### Performance
- Используй labels для фильтрации (быстро)
- Избегай regex где возможно (медленно)
- Ограничивай time range (меньше данных)

---

**Последнее обновление:** 2025-10-06
