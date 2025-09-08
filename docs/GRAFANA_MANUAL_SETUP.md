# Grafana Manual Setup Guide

Инструкция по ручному подключению datasources и dashboards в Grafana.

## 🔗 Ручное подключение Data Sources

### 1. Откройте Grafana
- URL: http://localhost:3001
- Логин: `admin`
- Пароль: `admin123`

### 2. Добавить Prometheus Data Source

1. **Перейдите в Configuration → Data sources**
2. **Нажмите "Add data source"**
3. **Выберите "Prometheus"**
4. **Заполните поля:**
   - **Name**: `Prometheus`
   - **URL**: `http://prometheus:9090`
   - **Access**: `Server (default)`
5. **Нажмите "Save & test"**
6. ✅ Должно появиться: "Data source is working"

### 3. Добавить Loki Data Source

1. **Нажмите "Add data source"**
2. **Выберите "Loki"**
3. **Заполните поля:**
   - **Name**: `Loki`
   - **URL**: `http://loki:3100`
   - **Access**: `Server (default)`
4. **В разделе "Derived fields" добавьте:**
   - **Name**: `TraceID`
   - **Regex**: `traceId=([a-f0-9]+)`
   - **URL**: `/explore?left=["now-1h","now","Jaeger",{"query":"${__value.raw}"}]`
   - **Data source**: `Jaeger`
5. **Нажмите "Save & test"**
6. ✅ Должно появиться: "Data source connected and labels found"

### 4. Добавить Jaeger Data Source

1. **Нажмите "Add data source"**
2. **Выберите "Jaeger"**
3. **Заполните поля:**
   - **Name**: `Jaeger`
   - **URL**: `http://jaeger:16686`
   - **Access**: `Server (default)`
4. **В разделе "Trace to logs" настройте:**
   - **Data source**: `Loki`
   - **Tags**: `service.name`
   - **Mapped tags**: `service.name -> service`
   - **Enable "Filter by Trace ID"**
   - **Enable "Filter by Span ID"**
5. **Нажмите "Save & test"**
6. ✅ Должно появиться: "Data source connected, serving traces"

## 📊 Создание Dashboard

### Способ 1: Импорт готового Dashboard

1. **Перейдите в "+" → Import**
2. **Скопируйте содержимое файла:**
   ```
   monitoring/grafana/dashboards/observability-unified.json
   ```
3. **Вставьте в поле "Import via panel json"**
4. **Нажмите "Load"**
5. **Убедитесь что datasources выбраны правильно:**
   - Prometheus → `Prometheus`
   - Loki → `Loki`
   - Jaeger → `Jaeger`
6. **Нажмите "Import"**

### Способ 2: Создать Dashboard вручную

1. **Перейдите в "+" → Dashboard**
2. **Нажмите "Add panel"**
3. **Настройте панели:**

#### Панель 1: HTTP Request Rate
- **Data source**: Prometheus
- **Query**: `rate(http_requests_total{service="api-gateway"}[5m])`
- **Visualization**: Time series
- **Title**: "📊 HTTP Request Rate"

#### Панель 2: Auth Request Rate  
- **Data source**: Prometheus
- **Query**: `rate(auth_requests_total[5m])`
- **Visualization**: Time series
- **Title**: "🔐 Auth Request Rate"

#### Панель 3: Application Logs
- **Data source**: Loki
- **Query**: `{service="api-gateway"} | json`
- **Visualization**: Logs
- **Title**: "📋 Application Logs"

## 🔍 Проверка работоспособности

### Тест Prometheus
1. **Перейдите в Explore**
2. **Выберите Prometheus**
3. **Выполните запрос**: `up`
4. ✅ Должны видеть метрики всех сервисов

### Тест Loki
1. **Перейдите в Explore**
2. **Выберите Loki**  
3. **Выполните запрос**: `{service="api-gateway"}`
4. ✅ Должны видеть логи приложения

### Тест Jaeger
1. **Перейдите в Explore**
2. **Выберите Jaeger**
3. **Выберите Service**: `api-gateway`
4. ✅ Должны видеть трейсы (после запуска API Gateway)

## 🚨 Troubleshooting

### Проблема: "Data source proxy error"
**Решение:**
- Проверьте что контейнеры запущены: `docker ps`
- Используйте внутренние URL контейнеров:
  - Prometheus: `http://prometheus:9090`
  - Loki: `http://loki:3100`  
  - Jaeger: `http://jaeger:16686`

### Проблема: "No labels found"
**Решение для Loki:**
- Запустите API Gateway: `cd apps/api-gateway && npm run dev`
- Выполните запрос: `curl http://localhost:3002/auth/login`
- Подождите несколько минут для появления логов

### Проблема: "No traces found"
**Решение для Jaeger:**
- Запустите API Gateway с трейсингом
- При первом запросе трейсы появятся в Jaeger

## 🔄 Перезапуск Grafana

Если что-то не работает:
```bash
docker restart ai-interview-grafana
```

Дождитесь полной загрузки (30-60 секунд) и повторите настройку.

## 📝 Полезные ссылки

- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **Kafka UI**: http://localhost:8080
