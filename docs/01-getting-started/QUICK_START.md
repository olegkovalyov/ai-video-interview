# ⚡ Quick Start - AI Video Interview Platform

Запусти платформу локально за 5 минут!

---

## 📋 Prerequisites

- **Node.js** 18+ 
- **Docker** & **Docker Compose**
- **Git**

---

## 🚀 Запуск

### 1. Клонируй репозиторий
```bash
git clone https://github.com/your-org/ai-video-interview.git
cd ai-video-interview
```

### 2. Установи зависимости
```bash
npm install
```

### 3. Скопируй environment variables
```bash
cp .env.example .env
```

### 4. Запусти инфраструктуру (Docker)
```bash
docker-compose up -d
```

Подождите ~30 секунд пока контейнеры стартуют.

### 5. Проверь что все запустилось
```bash
docker-compose ps
```

Должны быть **UP**:
- ✅ postgres
- ✅ redis
- ✅ minio
- ✅ kafka
- ✅ keycloak
- ✅ prometheus, loki, grafana

### 6. Запусти микросервисы
```bash
# Terminal 1 - API Gateway
cd apps/api-gateway
npm run dev

# Terminal 2 - User Service
cd apps/user-service
npm run dev

# Terminal 3 - Frontend
cd apps/web
npm run dev
```

---

## ✅ Проверка

### Сервисы доступны:
- 🌐 **Frontend:** http://localhost:3000
- 🔌 **API Gateway:** http://localhost:3001
- 👤 **User Service:** http://localhost:3003
- 🔐 **Keycloak:** http://localhost:8090
- 📊 **Grafana:** http://localhost:3002
- 🔍 **Kafka UI:** http://localhost:8080

### Credentials:
```
Keycloak Admin:
  User: admin
  Password: admin123

Grafana:
  User: admin
  Password: admin123

MinIO:
  User: minioadmin
  Password: minioadmin123
```

---

## 🎯 Первые шаги

1. **Открой http://localhost:3000**
2. **Нажми "Sign Up"** - создай аккаунт
3. **Login** - войди в систему
4. **Dashboard** - увидишь главную страницу

---

## 🐛 Troubleshooting

### Порты заняты?
```bash
npm run cleanup:ports
```

### Kafka не стартует?
```bash
docker-compose down
docker volume rm ai-video-interview_kafka_data
docker-compose up -d kafka
```

### PostgreSQL проблемы?
```bash
docker-compose logs postgres
```

---

## 📚 Что дальше?

- [Local Development Guide](./LOCAL_DEVELOPMENT.md) - Полный dev setup
- [System Overview](../02-architecture/SYSTEM_OVERVIEW.md) - Архитектура
- [Services Overview](../02-architecture/SERVICES_OVERVIEW.md) - Микросервисы

---

**Нужна помощь?** Спроси в команде или создай issue!
