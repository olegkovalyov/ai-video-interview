# 📊 GRAFANA LOGS - ПРАКТИЧЕСКОЕ РУКОВОДСТВО

## 🎯 БЫСТРЫЙ ДОСТУП К ЛОГАМ

### 1️⃣ **GRAFANA EXPLORE**
1. Открой Grafana: http://localhost:3001 (admin/admin123)
2. Левая панель → **Explore** (🔍 иконка)
3. Data source → **Loki**
4. Готов к поиску логов!

---

## 🔍 LOGQL QUERIES - ЯЗЫК ЗАПРОСОВ LOKI

### 📋 **БАЗОВЫЕ QUERIES:**

```logql
# Все логи за последний час
{job="docker-containers"}

# Логи конкретного контейнера
{container_name="ai-interview-api-gateway"}

# Логи по уровню (если структурированы)
{job="nestjs-apps"} |= "ERROR"

# Логи содержащие текст
{job="docker-containers"} |= "JWT Refresh Guard"

# Логи НЕ содержащие текст  
{job="docker-containers"} != "health check"
```

### 🔥 **ПРОДВИНУТЫЕ QUERIES:**

```logql
# Ошибки аутентификации
{container_name="ai-interview-api-gateway"} |= "UnauthorizedException"

# Auto-refresh логи
{container_name="ai-interview-api-gateway"} |= "Auto-refresh"

# Keycloak ошибки
{container_name="ai-interview-api-gateway"} |= "Token refresh failed"

# Логи с rate (количество в секунду)
rate({container_name="ai-interview-api-gateway"}[5m])

# Логи с фильтром времени + count
count_over_time({container_name="ai-interview-api-gateway"} |= "ERROR" [1h])
```

---

## 🎯 ПРАКТИЧЕСКИЕ СЦЕНАРИИ

### 🔐 **Сценарий 1: Debugging Auto-Refresh**

```logql
# 1. Все логи refresh
{container_name="ai-interview-api-gateway"} |= "refresh"

# 2. Только ошибки refresh
{container_name="ai-interview-api-gateway"} |= "refresh" |= "failed"

# 3. Успешные refresh
{container_name="ai-interview-api-gateway"} |= "refresh" |= "successful"

# 4. Timeline refresh активности
rate({container_name="ai-interview-api-gateway"} |= "refresh" [5m])
```

### 🚨 **Сценарий 2: Error Tracking**

```logql
# 1. Все ошибки
{container_name="ai-interview-api-gateway"} |= "ERROR"

# 2. JWT ошибки
{container_name="ai-interview-api-gateway"} |= "JWT" |= "ERROR" 

# 3. 401 Unauthorized
{container_name="ai-interview-api-gateway"} |= "Unauthorized"

# 4. Keycloak проблемы
{container_name="ai-interview-api-gateway"} |= "Keycloak" |= "failed"
```

### ⚡ **Сценарий 3: Performance Analysis**

```logql
# 1. Медленные запросы
{container_name="ai-interview-api-gateway"} |= "duration" |= "ms"

# 2. Database queries
{container_name="ai-interview-api-gateway"} |= "database" 

# 3. HTTP requests
{container_name="ai-interview-api-gateway"} |= "HTTP"
```

---

## 📊 ФИЛЬТРЫ И ВРЕМЕННЫЕ ИНТЕРВАЛЫ

### ⏰ **TIME RANGES:**
- Last 5 minutes
- Last 15 minutes  
- Last 1 hour
- Last 6 hours
- Custom range

### 🏷️ **LABELS ФИЛЬТРЫ:**
```logql
# По job
{job="docker-containers"}
{job="nestjs-apps"}

# По контейнеру
{container_name="ai-interview-api-gateway"}
{container_name="ai-interview-keycloak"}

# По level (если есть structured logs)
{level="error"}
{level="warn"}
```

---

## 🎨 СОЗДАНИЕ LOG DASHBOARDS

### 📊 **Panel Types для логов:**

1. **Logs Panel** - показывает сырые логи
2. **Stat Panel** - count ошибок за период  
3. **Time Series** - rate логов во времени
4. **Table** - structured logs в таблице

### 🎯 **Пример Dashboard Panel:**

**Query для Error Rate:**
```logql
sum(rate({container_name="ai-interview-api-gateway"} |= "ERROR" [5m])) by (container_name)
```

**Query для Auth Success Rate:**
```logql
sum(rate({container_name="ai-interview-api-gateway"} |= "login" |= "successful" [5m]))
```

---

## 🔧 НАСТРОЙКА ALERTS

### 🚨 **Alert Rules:**

```logql
# Alert: Высокий error rate
sum(rate({container_name="ai-interview-api-gateway"} |= "ERROR" [5m])) > 0.1

# Alert: Auth failures
sum(rate({container_name="ai-interview-api-gateway"} |= "Unauthorized" [5m])) > 0.05

# Alert: Keycloak недоступен
count_over_time({container_name="ai-interview-api-gateway"} |= "Keycloak" |= "failed" [5m]) > 5
```

---

## 🎯 DEMO WORKFLOW

### 🔄 **Тест Auto-Refresh в Loki:**

1. **Сделай auto-refresh тест** (подожди 6+ минут, обнови страницу)

2. **В Grafana Explore выполни:**
```logql
{container_name="ai-interview-api-gateway"} |= "JWT Refresh Guard" |= "Auto-refresh"
```

3. **Увидишь timeline:** когда срабатывал auto-refresh

4. **Для ошибок:**
```logql
{container_name="ai-interview-api-gateway"} |= "refresh" |= "failed"
```

5. **Для успеха:**
```logql
{container_name="ai-interview-api-gateway"} |= "refresh" |= "successful"
```

### 📊 **Корреляция Metrics + Logs:**

1. **Prometheus** → видишь spike в /auth/refresh
2. **Jaeger** → видишь trace auto-refresh
3. **Loki** → видишь детальные логи почему/как

**Это и есть полный observability!** 🚀
