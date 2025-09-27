# 🔍 MONITORING STACK - РУКОВОДСТВО ПОЛЬЗОВАТЕЛЯ

## 🎯 БЫСТРЫЙ ДОСТУП

### 📊 **PROMETHEUS - МЕТРИКИ**
- **URL:** http://localhost:9090
- **Назначение:** Сбор и хранение временных рядов
- **Что смотрим:** CPU, память, HTTP requests, errors

### 🔍 **JAEGER - ТРЕЙСИНГ** 
- **URL:** http://localhost:16686  
- **Назначение:** Распределенное трейсирование
- **Что смотрим:** Путь запроса через все сервисы

### 📈 **GRAFANA - ДАШБОРДЫ**
- **URL:** http://localhost:3001
- **Login:** admin / admin123
- **Назначение:** Визуализация и алерты

---

## 🚀 ПРАКТИЧЕСКОЕ ИСПОЛЬЗОВАНИЕ

### 1️⃣ **PROMETHEUS QUERIES**

#### 🔥 **ТОПОВЫЕ МЕТРИКИ:**
```promql
# HTTP запросы в секунду
rate(http_requests_total[5m])

# Ошибки 4xx/5xx
rate(http_requests_total{status=~"4..|5.."}[5m])

# Latency 95-й перцентиль  
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# CPU утилизация
rate(process_cpu_seconds_total[5m]) * 100

# Память 
process_resident_memory_bytes / 1024 / 1024
```

### 2️⃣ **JAEGER ПОИСК**

#### 🎯 **ФИЛЬТРЫ ТРЕЙСОВ:**
- **Service:** api-gateway, user-service
- **Operation:** /auth/login, /protected  
- **Tags:** error=true, user.id=123
- **Duration:** >100ms

#### 🔍 **ЧТО ИСКАТЬ:**
- Медленные запросы (>500ms)
- Ошибки в цепочке сервисов
- Места bottleneck'ов

### 3️⃣ **GRAFANA ДАШБОРДЫ**

#### 📊 **ГОТОВЫЕ ДАШБОРДЫ:**
- **System Metrics:** CPU, память, диск
- **HTTP Metrics:** RPS, errors, latency
- **Auth Flow:** login/logout статистика
- **Database:** PostgreSQL performance

---

## 🧪 ТЕСТОВЫЕ СЦЕНАРИИ

### 🔄 **ТЕСТ AUTO-REFRESH ТОКЕНОВ:**

1. **Prometheus Query:**
```promql
# Успешные refresh
rate(http_requests_total{endpoint="/auth/refresh", status="200"}[5m])

# Неудачные refresh  
rate(http_requests_total{endpoint="/auth/refresh", status=~"4..|5.."}[5m])
```

2. **Jaeger Search:**
- Service: api-gateway
- Operation: /auth/refresh
- Duration: >0ms
- Look for: errors, latency spikes

3. **Grafana Dashboard:**
- Panel: "Auth Refresh Rate"
- Metric: refresh success/failure ratio
- Alert: >10% failure rate

---

## 🚨 MONITORING AUTH FLOW

### 📝 **КЛЮЧЕВЫЕ МЕТРИКИ ДЛЯ ОТСЛЕЖИВАНИЯ:**

```promql
# 1. Login успешность
rate(http_requests_total{endpoint="/auth/callback", status="200"}[5m])

# 2. Token refresh rate  
rate(http_requests_total{endpoint="/auth/refresh"}[5m])

# 3. Protected endpoints ошибки
rate(http_requests_total{endpoint="/protected", status="401"}[5m])

# 4. JWT Guard performance
histogram_quantile(0.95, rate(jwt_guard_duration_seconds_bucket[5m]))
```

### 🎯 **JAEGER ФИЛЬТРЫ ДЛЯ AUTH:**
- Operation: auth.login, auth.refresh, auth.logout
- Tags: user.sub, error=true
- Duration: >200ms (медленная аутентификация)

---

## 🛠️ ПРАКТИЧЕСКИЕ ПРИМЕРЫ

### 📊 **Пример 1: Анализ медленного login'а**
1. Grafana → Auth Dashboard
2. Видим spike в latency
3. Jaeger → Service: api-gateway, Operation: /auth/callback  
4. Находим медленный span (например, Keycloak token exchange)
5. Prometheus → детальные метрики этого компонента

### 🔍 **Пример 2: Debugging failed refresh**
1. Jaeger → filter by error=true + /auth/refresh
2. Смотрим error tags и logs
3. Prometheus → rate of 400/401 errors
4. Grafana → Alert если error rate >5%

### 📈 **Пример 3: Performance optimization**
1. Prometheus → P95 latency query
2. Jaeger → longest traces analysis  
3. Identify bottlenecks
4. Grafana → before/after comparison

---

## 🎭 DEMO SCENARIOS

### 🔄 **Сценарий: Auto-refresh monitoring**

1. **Залогинься** в приложение
2. **Подожди 6+ минут** (access token expire)  
3. **Обнови страницу**
4. **Проверь в Jaeger:** должен появиться trace с auto-refresh
5. **Проверь в Prometheus:** метрики refresh должны показать success
6. **Проверь в Grafana:** dashboard должен показать spike в refresh activity

### 🚨 **Сценарий: Error tracking**

1. **Останови Keycloak** (docker stop ai-interview-keycloak)
2. **Попробуй login**
3. **Jaeger:** trace покажет error в auth chain
4. **Prometheus:** error rate spike  
5. **Grafana:** alert должен сработать
6. **Запусти Keycloak обратно**
