# 🗄️ PostgreSQL Database Management

## 📊 Current Database Architecture

```
┌─────────────────────────────────────────┐
│     PostgreSQL (Single Instance)        │
├─────────────────────────────────────────┤
│  ✅ ai_video_interview_user             │ ← User Service
│  ✅ keycloak                             │ ← Keycloak Auth
│  ✅ postgres                             │ ← System DB
└─────────────────────────────────────────┘
```

## 🎯 Who Uses What?

| Service | Database | Status |
|---------|----------|--------|
| **API Gateway** | None (uses Keycloak) | ✅ Running |
| **User Service** | `ai_video_interview_user` | ✅ Ready |
| **Interview Service** | `ai_video_interview_interview` | ⏳ Future |
| **Keycloak** | `keycloak` | ✅ Running |

---

## 🧹 Database Cleanup

### **Step 1: Run Cleanup Script**

Удаляет все ненужные/тестовые базы данных:

```bash
# From project root
psql -h localhost -U postgres -f infrastructure/postgres/cleanup-databases.sql
```

**Что удалится:**
- ❌ `ai_video_interview` (дубликаты)
- ❌ `ai_video_interview_main` (старая/ненужная)
- ❌ `ai_video_interview_test` (тестовая)
- ❌ `ai_video_interview_interview` (создадим когда понадобится)

**Что останется:**
- ✅ `ai_video_interview_user`
- ✅ `keycloak`
- ✅ `postgres` (system)

---

## 🚀 Fresh Start (Docker)

### **Option 1: Recreate Container**

Если нужен полный сброс:

```bash
# Stop and remove container + volume
docker-compose -f docker-compose.infrastructure.yml down -v

# Start fresh (runs init scripts automatically)
docker-compose -f docker-compose.infrastructure.yml up -d postgres

# Check databases created
docker exec -it ai-interview-postgres psql -U postgres -c "\l"
```

### **Option 2: Keep Data, Just Cleanup**

Если данные нужны, просто удаляем мусор:

```bash
# Run cleanup script
psql -h localhost -U postgres -f infrastructure/postgres/cleanup-databases.sql

# Verify
psql -h localhost -U postgres -c "\l"
```

---

## 📝 Manual Database Operations

### **Connect to PostgreSQL**

```bash
psql -h localhost -U postgres
```

### **List Databases**

```sql
\l
```

### **Drop Specific Database**

```sql
-- Disconnect all users first
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'database_name'
AND pid <> pg_backend_pid();

-- Drop database
DROP DATABASE IF EXISTS database_name;
```

### **Create New Database**

```sql
CREATE DATABASE ai_video_interview_interview;
GRANT ALL PRIVILEGES ON DATABASE ai_video_interview_interview TO postgres;
```

### **Check Database Size**

```sql
SELECT pg_database.datname,
       pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;
```

---

## 🔄 Adding New Service Database

When creating a new microservice:

**1. Update `init/01-create-databases.sql`:**

```sql
SELECT 'CREATE DATABASE ai_video_interview_newservice'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ai_video_interview_newservice')\gexec

GRANT ALL PRIVILEGES ON DATABASE ai_video_interview_newservice TO postgres;
```

**2. Add to root `.env`:**

```bash
NEWSERVICE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_video_interview_newservice
```

**3. Add to service `.env.example`:**

```bash
DATABASE_NAME=ai_video_interview_newservice
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

---

## 🚨 Troubleshooting

### **Error: "database is being accessed by other users"**

```bash
# Terminate all connections
docker exec -it ai-interview-postgres psql -U postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE datname = 'your_database_name';
"

# Then drop
docker exec -it ai-interview-postgres psql -U postgres -c "DROP DATABASE your_database_name;"
```

### **Error: "password authentication failed"**

Check credentials in `.env` file:
```bash
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

### **Can't connect to PostgreSQL**

```bash
# Check if container is running
docker ps | grep postgres

# Check logs
docker logs ai-interview-postgres

# Restart container
docker restart ai-interview-postgres
```

---

## 📚 Best Practices

✅ **DO:**
- One database per microservice
- Use meaningful database names
- Run migrations, don't use `synchronize: true`
- Backup before cleanup
- Use connection pooling

❌ **DON'T:**
- Share databases between services
- Manually modify production schemas
- Use `synchronize: true` in production
- Hardcode credentials

---

**Last Updated:** 2025-10-01
