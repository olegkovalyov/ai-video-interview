# 📊 PROMETHEUS QUERIES ДЛЯ DEMO

## 🎯 СКОПИРУЙ И ВСТАВЬ ЭТИ QUERIES:

### 1️⃣ Базовые HTTP метрики:
```promql
rate(http_requests_total[5m])
```
**ЧТО ПОКАЖЕТ:** Общая нагрузка на API Gateway

### 2️⃣ Auth refresh активность:
```promql
rate(http_requests_total{endpoint="/auth/refresh"}[5m])
```
**ЧТО ПОКАЖЕТ:** Сейчас должно быть ~0, после теста увидим spike!

### 3️⃣ Protected endpoint вызовы:
```promql
rate(http_requests_total{endpoint="/protected"}[5m])
```
**ЧТО ПОКАЖЕТ:** Обращения к защищенным ресурсам

### 4️⃣ HTTP ошибки:
```promql
rate(http_requests_total{status=~"4..|5.."}[5m])
```
**ЧТО ПОКАЖЕТ:** Ошибки 400/500 (должно быть 0)

## 💡 ПРАКТИЧЕСКАЯ ЦЕННОСТЬ:

### 🚨 В PRODUCTION это помогает:
- **Выявить проблемы** до того как пользователи пожалуются
- **Измерить SLA/SLO:** 99.9% availability, <200ms latency
- **Capacity planning:** сколько RPS выдерживает система
- **Business metrics:** сколько логинов в час, паттерны использования

### 📈 РЕАЛЬНЫЕ АЛЕРТЫ:
```promql
# Alert: Error rate > 1% 
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01

# Alert: High latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5

# Alert: No refresh activity (system dead?)
absent(rate(http_requests_total{endpoint="/auth/refresh"}[10m]))
```
