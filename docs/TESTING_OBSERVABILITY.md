# Тестирование Observability стека

Этот документ описывает, как протестировать полный observability стек локально.

## Запуск стека

```bash
# Запустить все observability компоненты
docker-compose up -d prometheus grafana loki promtail jaeger kafka zookeeper postgres redis

# Или по частям:
docker-compose up -d prometheus grafana  # Metrics
docker-compose up -d loki promtail      # Logs  
docker-compose up -d jaeger             # Traces
```

## Доступ к UI

- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **Loki**: http://localhost:3100 (не имеет UI, только API)

## Unified Dashboard

В Grafana доступен объединенный dashboard **"🔭 AI Video Interview - Unified Observability"** который включает:

- 📊 **HTTP Request Rate** - метрики HTTP запросов  
- 🔐 **Auth Request Rate** - метрики аутентификации
- ⏱️ **Response Time** - время ответа (95th и 50th percentile)
- 👥 **User Activity** - активные сессии и операции пользователей
- 📋 **Application Logs** - централизованные логи приложения
- 🔐 **Auth Events** - события аутентификации
- ❌ **Error Logs** - логи ошибок
- 🔍 **Distributed Traces** - распределенные трейсы

## Тестирование метрик

1. Запустить API Gateway:
```bash
cd apps/api-gateway
npm run dev
```

2. Выполнить несколько HTTP запросов:
```bash
# Тест auth endpoints
curl "http://localhost:3002/auth/login"
curl "http://localhost:3002/auth/status"

# Тест с ошибками
curl "http://localhost:3002/nonexistent"
```

3. Проверить метрики в Prometheus:
   - Открыть http://localhost:9090
   - Queries: `http_requests_total`, `auth_requests_total`

## Тестирование логов

1. Проверить логи в файлах:
```bash
# Посмотреть структурированные логи
tail -f logs/api-gateway-combined.log | head -20
tail -f logs/api-gateway-error.log

# Логи должны быть в JSON формате
cat logs/api-gateway-combined.log | jq '.'
```

2. Проверить логи в Grafana:
   - Открыть http://localhost:3001
   - Перейти в Explore → Loki
   - Query: `{service="api-gateway"}`
   - Query: `{service="api-gateway"} | json | level="error"`

## Тестирование трейсов

1. Выполнить запросы к API Gateway для генерации трейсов
2. Открыть Jaeger UI: http://localhost:16686
3. Выбрать сервис "api-gateway"
4. Найти трейсы для операций:
   - `auth.login.initiate`
   - `auth.callback.handle`
   - `auth.token.exchange`
   - `auth.kafka.publish_user_authenticated`

## Корреляция метрик, логов и трейсов

### Из логов в трейсы:
- В Grafana Loki найти лог с `traceId`
- Кликнуть на ссылку TraceID → откроется трейс в Jaeger

### Из трейсов в логи:
- В Jaeger выбрать спан
- Кликнуть "Logs for this span" → откроются соответствующие логи в Loki

### Из метрик в логи:
- В Grafana на графике метрик выбрать временной диапазон
- Переключиться на Loki с тем же временным диапазоном

## Примеры LogQL запросов

```logql
# Все логи API Gateway
{service="api-gateway"}

# Только ошибки
{service="api-gateway"} | json | level="error"

# Аутентификация события
{service="api-gateway", category="authentication"}

# Kafka события
{service="api-gateway", category="kafka"}

# Логи с определенным traceId
{service="api-gateway"} | json | traceId="your-trace-id"

# Метрики из логов (rate of errors)
rate({service="api-gateway"} | json | level="error" [5m])

# 2. Jump to logs: кликаем на spike и переходим к логам за это время
{service="api-gateway", category="authentication"} | json
```

## Тестирование distributed tracing  

### 1. Jaeger UI: http://localhost:16686
- Пока без реальных traces (OpenTelemetry еще не настроен)
- Но интерфейс готов для изучения

## Практические сценарии для изучения

### Сценарий 1: Debugging auth проблем
```bash
# 1. Генерируем ошибку
curl -X POST http://localhost:8000/auth/callback

# 2. Ищем в Grafana Explore (Loki):
{service="api-gateway"} |= "callback" |= "ERROR"

# 3. Видим structured error с контекстом:
{
  "level": "ERROR",
  "message": "Callback handling failed", 
  "action": "callback_failed",
  "error": {
    "name": "Error",
    "message": "Authorization code not provided"
  }
}
```

### Сценарий 2: Performance monitoring
```bash
# 1. В Grafana: метрики показывают высокий response time
# 2. Jump to logs за этот период:
{service="api-gateway", category="performance"} | json | duration > 500

# 3. Корреляция с auth логами:
{service="api-gateway", category="authentication"} 
```

### Сценарий 3: Kafka debugging
```bash
# 1. Генерируем Kafka события (если сервис запущен)
# 2. Смотрим Kafka логи:
{service="api-gateway", category="kafka"}

# 3. Видим успешные/неуспешные публикации:
{
  "message": "Kafka: publish to user-events success",
  "category": "kafka",
  "topic": "user-events", 
  "success": true
}
```

## Alerting на основе логов

### В Prometheus можно создать алерты:
```yaml
# Alert на высокую частоту ошибок в логах
- alert: HighAuthErrorRate
  expr: |
    increase(loki_entries_total{level="ERROR", category="authentication"}[5m]) > 10
  for: 2m
```

## Следующие шаги

1. **OpenTelemetry** - добавить distributed tracing
2. **Unified Dashboard** - создать дашборд с метриками + логами  
3. **Other Services** - добавить structured logging в user-service и interview-service
4. **Alerting Rules** - настроить prod-like алерты

---

Теперь у вас полноценная observability как в продакшене! Можно изучать поиск по логам, корреляцию с метриками, и готовиться к переносу в AWS CloudWatch Logs.
