# Prometheus Queries Reference

**Полезные PromQL queries для мониторинга платформы**

---

## 🎯 HTTP Metrics

### Request Rate
```promql
# Все HTTP requests per second
rate(http_requests_total[5m])

# По методам
sum(rate(http_requests_total[5m])) by (method)

# По routes
sum(rate(http_requests_total[5m])) by (route)

# Конкретный endpoint
rate(http_requests_total{route="/auth/refresh"}[5m])
```

### Error Rate
```promql
# Все errors (4xx + 5xx)
rate(http_requests_total{status_code=~"4..|5.."}[5m])

# Только 5xx (server errors)
rate(http_requests_total{status_code=~"5.."}[5m])

# Error rate в процентах
(
  sum(rate(http_requests_total{status_code=~"5.."}[5m]))
  /
  sum(rate(http_requests_total[5m]))
) * 100
```

### Latency
```promql
# P50 (медиана)
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# P99
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# По routes
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (route, le)
)
```

### Traffic Patterns
```promql
# Requests за последние 10 минут
increase(http_requests_total[10m])

# Peak requests per second
max_over_time(rate(http_requests_total[5m])[1h:])

# Requests по сервисам
sum(rate(http_requests_total[5m])) by (service)
```

---

## 🔐 Authentication Metrics

### Login Activity
```promql
# Login requests rate
rate(http_requests_total{route="/auth/login"}[5m])

# Login success rate
rate(http_requests_total{route="/auth/callback", status_code="200"}[5m])

# Login failures
rate(http_requests_total{route="/auth/callback", status_code=~"4.."}[5m])
```

### Token Refresh
```promql
# Refresh requests
rate(http_requests_total{route="/auth/refresh"}[5m])

# Refresh за последний час
increase(http_requests_total{route="/auth/refresh"}[1h])

# Refresh success rate
(
  sum(rate(http_requests_total{route="/auth/refresh", status_code="200"}[5m]))
  /
  sum(rate(http_requests_total{route="/auth/refresh"}[5m]))
) * 100
```

### Logout Activity
```promql
# Logout rate
rate(http_requests_total{route="/auth/logout"}[5m])
```

---

## 👤 User Service Metrics

### User Operations
```promql
# GET /users/me rate
rate(http_requests_total{route="/users/me", method="GET"}[5m])

# Profile updates
rate(http_requests_total{route=~"/users/.*/profile", method="PUT"}[5m])

# Avatar uploads
rate(http_requests_total{route=~"/users/.*/avatar", method="POST"}[5m])
```

### User Service Health
```promql
# Response time P95
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket{service="user-service"}[5m])) by (le)
)

# Error rate
rate(http_requests_total{service="user-service", status_code=~"5.."}[5m])
```

---

## 📊 Database Metrics

### Connection Pool
```promql
# Active connections
database_connections_active

# Idle connections
database_connections_idle

# Total connections
database_connections_total

# Connection pool usage %
(database_connections_active / database_connections_max) * 100
```

### Query Performance
```promql
# Query duration P95
histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))

# Slow queries (> 1s)
count(database_query_duration_seconds > 1)

# Queries per second
rate(database_queries_total[5m])
```

---

## 📨 Kafka Metrics

### Consumer Lag
```promql
# Lag по topic
kafka_consumergroup_lag{topic="user-events"}

# Lag по consumer group
sum(kafka_consumergroup_lag) by (consumergroup)

# Критический lag (> 1000)
kafka_consumergroup_lag > 1000
```

### Message Throughput
```promql
# Messages per second
rate(kafka_topic_partition_current_offset[5m])

# Messages за последний час
increase(kafka_topic_partition_current_offset[1h])
```

### Topic Health
```promql
# Partition count
kafka_topic_partitions{topic="user-events"}

# Under-replicated partitions
kafka_topic_partition_under_replicated_partition
```

---

## 💾 System Metrics (Node Exporter)

### CPU Usage
```promql
# CPU usage %
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# CPU load average
node_load1
node_load5
node_load15
```

### Memory Usage
```promql
# Memory usage %
(
  (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
  /
  node_memory_MemTotal_bytes
) * 100

# Available memory GB
node_memory_MemAvailable_bytes / 1024 / 1024 / 1024
```

### Disk Usage
```promql
# Disk usage %
(
  (node_filesystem_size_bytes - node_filesystem_avail_bytes)
  /
  node_filesystem_size_bytes
) * 100

# Free disk space GB
node_filesystem_avail_bytes / 1024 / 1024 / 1024
```

### Network Traffic
```promql
# Received bytes per second
rate(node_network_receive_bytes_total[5m])

# Transmitted bytes per second
rate(node_network_transmit_bytes_total[5m])
```

---

## 🎯 SLI/SLO Queries

### Availability (99.9%)
```promql
# Success rate
(
  sum(rate(http_requests_total{status_code!~"5.."}[5m]))
  /
  sum(rate(http_requests_total[5m]))
) * 100
```

### Latency (P95 < 500ms)
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) < 0.5
```

### Error Budget
```promql
# Remaining error budget (0.1% for 99.9% SLA)
1 - (
  sum(rate(http_requests_total{status_code=~"5.."}[30d]))
  /
  sum(rate(http_requests_total[30d]))
)
```

---

## 🚨 Alerting Queries

### High Error Rate
```promql
(
  sum(rate(http_requests_total{status_code=~"5.."}[5m]))
  /
  sum(rate(http_requests_total[5m]))
) > 0.05  # 5% error rate
```

### High Latency
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1  # > 1s
```

### Service Down
```promql
up{job="nestjs-apps"} == 0
```

### High CPU Usage
```promql
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
```

### High Memory Usage
```promql
(
  (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
  /
  node_memory_MemTotal_bytes
) * 100 > 90
```

### Kafka Consumer Lag
```promql
kafka_consumergroup_lag > 1000
```

---

## 📊 Dashboard Queries

### API Gateway Dashboard

**Panel 1: Request Rate**
```promql
sum(rate(http_requests_total{service="api-gateway"}[5m])) by (route)
```

**Panel 2: Error Rate**
```promql
sum(rate(http_requests_total{service="api-gateway", status_code=~"5.."}[5m]))
```

**Panel 3: Latency P95**
```promql
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket{service="api-gateway"}[5m])) by (le)
)
```

**Panel 4: Top Endpoints**
```promql
topk(10, sum(rate(http_requests_total{service="api-gateway"}[5m])) by (route))
```

---

## 🔧 Tips & Tricks

### Range Vectors
- `[5m]` - последние 5 минут
- `[1h]` - последний час
- `[1d]` - последний день

### Aggregations
- `sum()` - сумма
- `avg()` - среднее
- `min()` / `max()` - мин/макс
- `count()` - количество
- `topk(N)` - топ N значений
- `bottomk(N)` - низ N значений

### By Labels
```promql
sum(metric) by (label1, label2)  # Группировка по labels
sum(metric) without (label1)      # Исключить label
```

### Operators
- `>`, `<`, `>=`, `<=`, `==`, `!=` - сравнение
- `+`, `-`, `*`, `/`, `%` - арифметика
- `and`, `or`, `unless` - логические

---

**Последнее обновление:** 2025-10-06
