# 📊 ПРАВИЛЬНЫЕ PROMETHEUS QUERIES

## ✅ ИСПРАВЛЕННЫЕ QUERIES:

### 1️⃣ Auth refresh активность:
```promql
rate(http_requests_total{route="/auth/refresh"}[5m])
```

### 2️⃣ Protected endpoint:
```promql
rate(http_requests_total{route="/protected"}[5m])
```

### 3️⃣ Все HTTP requests:
```promql
rate(http_requests_total[5m])
```

### 4️⃣ HTTP requests по методам:
```promql
sum(rate(http_requests_total[5m])) by (method)
```

### 5️⃣ HTTP requests по routes:
```promql
sum(rate(http_requests_total[5m])) by (route)
```

### 6️⃣ HTTP errors:
```promql
rate(http_requests_total{status_code=~"4..|5.."}[5m])
```

### 7️⃣ Response time P95:
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### 8️⃣ Response time по routes:
```promql
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (route, le))
```

## 🎯 ДЛЯ НАШЕГО ТЕСТА AUTO-REFRESH:

### Сначала попробуй:
```promql
http_requests_total{route="/auth/refresh"}
```
**Должно показать:** текущий counter (например, 3)

### Потом:
```promql
rate(http_requests_total{route="/auth/refresh"}[5m])
```
**Должно показать:** requests per second

### После auto-refresh теста:
```promql
increase(http_requests_total{route="/auth/refresh"}[10m])
```  
**Покажет:** сколько refresh'ей было за последние 10 минут

## 💡 ПОЧЕМУ LABEL НАЗЫВАЕТСЯ "route":

В NestJS MetricsInterceptor мы используем:
- `route` = endpoint path (/auth/refresh)
- `method` = HTTP method (GET, POST)  
- `status_code` = response status (200, 401, etc.)

Это стандартная практика в Express.js/NestJS приложениях!
