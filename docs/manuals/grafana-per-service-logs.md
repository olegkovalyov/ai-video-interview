# 📊 GRAFANA QUERIES ДЛЯ ЛОГОВ ПО СЕРВИСАМ

## 🎯 СТРУКТУРА ЛОГОВ

```
apps/
├── api-gateway/logs/api-gateway.log      # API Gateway логи
├── user-service/logs/user-service.log    # User Service логи  
├── interview-service/logs/interview-service.log # Interview Service логи
└── media-service/logs/media-service.log  # Media Service логи
```

---

## 🔍 GRAFANA LOKI QUERIES

### 📋 **БАЗОВЫЕ QUERIES ПО СЕРВИСАМ:**

```logql
# Все логи от всех NestJS сервисов
{job="nestjs-apps"}

# Логи конкретного сервиса
{job="nestjs-apps", service_name="api-gateway"}
{job="nestjs-apps", service_name="user-service"}
{job="nestjs-apps", service_name="interview-service"}

# Логи по уровню для всех сервисов
{job="nestjs-apps"} | json | level="ERROR"
{job="nestjs-apps"} | json | level="WARN"
{job="nestjs-apps"} | json | level="INFO"

# Логи конкретного сервиса и уровня
{job="nestjs-apps", service_name="api-gateway"} | json | level="ERROR"
```

### 🔐 **AUTH & JWT QUERIES:**

```logql
# Все auth активности (все сервисы)
{job="nestjs-apps"} |= "auth" or "JWT" or "login" or "logout"

# JWT Guard активность (API Gateway)
{job="nestjs-apps", service_name="api-gateway"} |= "JWT"

# Auto-refresh логи
{job="nestjs-apps"} |= "Auto-refresh" or "refresh"

# Login/Logout активность
{job="nestjs-apps"} |= "login" or "logout"

# Keycloak взаимодействие
{job="nestjs-apps"} |= "Keycloak" or "Token"
```

### 👤 **USER SERVICE QUERIES:**

```logql
# Все логи User Service
{job="nestjs-apps", service_name="user-service"}

# User операции
{job="nestjs-apps", service_name="user-service"} |= "user" or "profile"

# Database операции User Service
{job="nestjs-apps", service_name="user-service"} |= "database" or "SQL"
```

### 🎤 **INTERVIEW SERVICE QUERIES:**

```logql
# Все логи Interview Service  
{job="nestjs-apps", service_name="interview-service"}

# Interview операции
{job="nestjs-apps", service_name="interview-service"} |= "interview" or "session"

# Video/Media processing
{job="nestjs-apps", service_name="interview-service"} |= "video" or "media"
```

### 📊 **CROSS-SERVICE CORRELATION:**

```logql
# Логи по traceId (cross-service)
{job="nestjs-apps"} | json | traceId="abc123def456"

# Ошибки во всех сервисах
{job="nestjs-apps"} | json | level="ERROR"

# Медленные операции (если есть duration поле)
{job="nestjs-apps"} |= "duration" |= "ms"

# HTTP requests во всех сервисах
{job="nestjs-apps"} |= "HTTP" or "request" or "response"
```

---

## 📈 METRICS QUERIES (ДЛЯ ДАШБОРДОВ)

### 🔥 **ERROR RATES:**

```logql
# Error rate по сервисам
sum(rate({job="nestjs-apps"} | json | level="ERROR" [5m])) by (service_name)

# Total log rate по сервисам  
sum(rate({job="nestjs-apps"}[5m])) by (service_name)

# Auth error rate
sum(rate({job="nestjs-apps"} |= "auth" | json | level="ERROR" [5m]))
```

### ⚡ **ACTIVITY MONITORING:**

```logql
# Login rate
sum(rate({job="nestjs-apps"} |= "login" [5m]))

# Auto-refresh rate
sum(rate({job="nestjs-apps"} |= "Auto-refresh" [5m]))

# Database activity per service
sum(rate({job="nestjs-apps"} |= "database" [5m])) by (service_name)
```

---

## 🎯 ПРАКТИЧЕСКИЕ СЦЕНАРИИ

### 🔍 **Scenario 1: User complains about slow login**

1. **Start with overview:**
```logql
{job="nestjs-apps"} |= "login" | json | level!="DEBUG"
```

2. **Focus on API Gateway auth:**
```logql
{job="nestjs-apps", service_name="api-gateway"} |= "auth" or "login"
```

3. **Check for errors:**
```logql
{job="nestjs-apps"} |= "login" | json | level="ERROR"
```

4. **Find specific user (if userId in logs):**
```logql
{job="nestjs-apps"} | json | userId="user123"
```

### 🚨 **Scenario 2: System error investigation**

1. **All errors across services:**
```logql
{job="nestjs-apps"} | json | level="ERROR"
```

2. **Error timeline:**
```logql
sum(rate({job="nestjs-apps"} | json | level="ERROR" [1m])) by (service_name)
```

3. **Specific service errors:**
```logql
{job="nestjs-apps", service_name="user-service"} | json | level="ERROR"
```

### 🔄 **Scenario 3: Auto-refresh debugging**

1. **All refresh activity:**
```logql
{job="nestjs-apps"} |= "refresh"
```

2. **Failed refreshes:**
```logql
{job="nestjs-apps"} |= "refresh" |= "failed" or "error"
```

3. **Successful refreshes:**
```logql
{job="nestjs-apps"} |= "refresh" |= "successful" or "completed"
```

---

## 🎨 DASHBOARD PANELS

### 📊 **Log Volume Panel:**
```logql
sum(rate({job="nestjs-apps"}[5m])) by (service_name)
```

### 🚨 **Error Rate Panel:**
```logql
sum(rate({job="nestjs-apps"} | json | level="ERROR" [5m])) by (service_name)
```

### 🔐 **Auth Activity Panel:**
```logql
sum(rate({job="nestjs-apps"} |= "auth" or "login" or "JWT" [5m]))
```

### 📋 **Recent Logs Panel:**
```logql
{job="nestjs-apps"} | json | level!="DEBUG"
```

---

## ✅ ТЕСТИРОВАНИЕ

### 🔄 **После перезапуска API Gateway:**

1. **Проверь что логи пишутся:**
```bash
ls -la apps/api-gateway/logs/
tail -f apps/api-gateway/logs/api-gateway.log
```

2. **В Grafana Explore попробуй:**
```logql
{job="nestjs-apps", service_name="api-gateway"}
```

3. **Сделай несколько запросов и проверь:**
```logql
{job="nestjs-apps", service_name="api-gateway"} |= "HTTP"
```

**Теперь у тебя профессиональная система логирования с разделением по сервисам!** 🚀
