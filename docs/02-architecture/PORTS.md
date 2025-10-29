# 🔌 ПОРТЫ СЕРВИСОВ

## Микросервисы

| Сервис | Порт | URL | ENV переменная |
|--------|------|-----|----------------|
| **API Gateway** | `8001` | http://localhost:8001 | `PORT=8001` |
| **User Service** | `8002` | http://localhost:8002 | `PORT=8002` |
| **Interview Service** | `8003` | http://localhost:8003 | `INTERVIEW_SERVICE_PORT=8003` |
| **Web (Next.js)** | `3000` | http://localhost:3000 | - |

---

## Инфраструктура

| Сервис | Порт | URL |
|--------|------|-----|
| **PostgreSQL** | `5432` | localhost:5432 |
| **Redis** | `6379` | localhost:6379 |
| **Kafka** | `9092` | localhost:9092 |
| **Zookeeper** | `2181` | localhost:2181 |
| **Keycloak** | `8090` | http://localhost:8090 |
| **Keycloak DB** | `5433` | localhost:5433 |
| **MinIO** | `9000`, `9001` | http://localhost:9000 (API), http://localhost:9001 (Console) |
| **Grafana** | `3002` | http://localhost:3002 |
| **Prometheus** | `9090` | http://localhost:9090 |
| **Loki** | `3100` | http://localhost:3100 |
| **Jaeger** | `16686`, `4318` | http://localhost:16686 |

---

## 🚀 Запуск

### Быстрый старт (все сервисы):

```bash
# 1. Поднять инфраструктуру
npm run infra:up

# 2. Запустить все микросервисы
npm run dev:services

# 3. Запустить frontend (опционально)
npm run dev:web
```

### Команды

```bash
# Только бэкенд сервисы (api-gateway, user-service, interview-service)
npm run dev:services

# Только фронтенд (Next.js)
npm run dev:web

# Всё сразу (backend + frontend)
npm run dev:all

# Отдельные сервисы
npm run dev:api          # только api-gateway
turbo run dev --filter='./apps/user-service'
turbo run dev --filter='./apps/interview-service'
```

---

## 🔧 Конфигурация

Каждый сервис использует `.env` файл в своей директории:

- `apps/api-gateway/.env`
- `apps/user-service/.env`
- `apps/interview-service/.env`

Примеры конфигураций см. в `.env.example` файлах.

---

## ✅ Проверка запущенных портов

```bash
# Все порты Node.js
lsof -i -P | grep node | grep LISTEN

# Конкретный порт
lsof -i :8002
```

---

## 🧹 Очистка портов

Если порты заняты:

```bash
npm run cleanup:ports
```

---

## 🎯 Health Checks

- API Gateway: http://localhost:8001/health
- User Service: http://localhost:8002/health
- Interview Service: http://localhost:8003/health
