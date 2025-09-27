# 🔍 ТЕСТИРОВАНИЕ GRAFANA LOGS

## 1️⃣ Открой Grafana Explore:
```
http://localhost:3001
Login: admin / admin123
```

## 2️⃣ Попробуй эти queries по очереди:

### Базовая проверка Loki:
```logql
{job="nestjs-apps"}
```

### Проверка service_name label:
```logql
{job="nestjs-apps", service_name="api-gateway"}
```

### Если не работает, попробуй без service_name:
```logql
{job="nestjs-apps"} |= "api-gateway"
```

### Поиск по содержимому:
```logql
{job="nestjs-apps"} |= "JWT"
```

## 3️⃣ Если ничего не видно:

Попробуй Docker logs:
```logql
{job="docker-containers"}
```

## 4️⃣ Debug информация:

Посмотри Labels в Grafana:
- Explore → Loki → Labels browser
- Должны быть: job, service_name

## 5️⃣ Временной диапазон:
- Убедись что смотришь "Last 1 hour" или больше
- Логи могли быть созданы час назад
