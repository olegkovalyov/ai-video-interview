# Архитектура баз данных - AI Video Interview Platform

## 🎯 Обзор требований к данным

Платформа работает с различными типами данных, каждый из которых требует оптимальных решений для хранения:

- **Структурированные данные:** Пользователи, интервью, ответы, подписки
- **Медиафайлы:** Видео, аудио, изображения, документы
- **Временные ряды:** Метрики, логи, аналитика использования
- **Кэш данные:** Сессии, лимиты, временные токены
- **Полнотекстовый поиск:** Транскрипции, результаты анализа

---

## 1. 🗄️ PostgreSQL - Основная OLTP база данных

### Назначение
Хранение всех структурированных операционных данных системы

### Схема данных по Bounded Context'ам

#### Identity & Access Context
```sql
-- Пользователи и аутентификация
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Индексы для производительности
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
```

#### Interview Management Context
```sql
-- Интервью и вопросы
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    public_link_token UUID UNIQUE DEFAULT gen_random_uuid(),
    expires_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'video', 'audio'
    order_index INTEGER NOT NULL,
    time_limit_seconds INTEGER DEFAULT 120,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interview_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) NOT NULL,
    questions JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_interviews_created_by ON interviews(created_by);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_public_link ON interviews(public_link_token);
CREATE INDEX idx_questions_interview_id ON questions(interview_id);
CREATE INDEX idx_questions_order ON questions(interview_id, order_index);
```

#### Candidate Response Context
```sql
-- Сессии кандидатов и ответы
CREATE TABLE candidate_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES interviews(id) NOT NULL,
    candidate_email VARCHAR(255),
    candidate_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'in_progress',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    user_agent TEXT,
    ip_address INET,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE candidate_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES candidate_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) NOT NULL,
    media_file_id UUID, -- Reference to media service
    duration_seconds INTEGER,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Индексы
CREATE INDEX idx_candidate_sessions_interview ON candidate_sessions(interview_id);
CREATE INDEX idx_candidate_sessions_status ON candidate_sessions(status);
CREATE INDEX idx_candidate_responses_session ON candidate_responses(session_id);
```

#### Media Processing Context
```sql
-- Медиафайлы и обработка
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES interviews(id) NOT NULL,
    session_id UUID REFERENCES candidate_sessions(id),
    question_id UUID REFERENCES questions(id),
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    original_path TEXT NOT NULL,
    processed_path TEXT,
    thumbnail_path TEXT,
    status VARCHAR(20) DEFAULT 'uploading',
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_file_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- 'compression', 'thumbnail', 'transcription'
    status VARCHAR(20) DEFAULT 'pending',
    progress FLOAT DEFAULT 0.0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    result_data JSONB DEFAULT '{}'
);

-- Индексы
CREATE INDEX idx_media_files_interview ON media_files(interview_id);
CREATE INDEX idx_media_files_status ON media_files(status);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_media_file ON processing_jobs(media_file_id);
```

#### AI Analysis Context
```sql
-- Результаты AI анализа
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES interviews(id) NOT NULL,
    session_id UUID REFERENCES candidate_sessions(id) NOT NULL,
    media_file_id UUID REFERENCES media_files(id),
    transcription_text TEXT,
    confidence_score FLOAT,
    sentiment_analysis JSONB,
    keywords JSONB,
    skills_assessment JSONB,
    overall_score FLOAT,
    ai_model_version VARCHAR(50),
    processing_cost_usd DECIMAL(10,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'transcription', 'analysis', 'sentiment'
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    cost_per_request DECIMAL(10,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_analysis_results_interview ON analysis_results(interview_id);
CREATE INDEX idx_analysis_results_session ON analysis_results(session_id);
CREATE INDEX idx_analysis_results_score ON analysis_results(overall_score);
```

#### Billing & Subscription Context
```sql
-- Подписки и биллинг
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_interval VARCHAR(20) NOT NULL, -- 'month', 'year'
    limits JSONB NOT NULL,
    features JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) NOT NULL, -- 'active', 'cancelled', 'expired'
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    resource_type VARCHAR(50) NOT NULL, -- 'interviews', 'analysis', 'storage'
    count INTEGER NOT NULL DEFAULT 1,
    date DATE NOT NULL,
    reset_date DATE,
    metadata JSONB DEFAULT '{}'
);

-- Индексы
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_usage_tracking_user_date ON usage_tracking(user_id, date);
CREATE INDEX idx_usage_tracking_resource ON usage_tracking(resource_type, date);
```

### Конфигурация PostgreSQL

```yaml
# postgresql.conf оптимизация для OLTP
shared_buffers = 256MB          # 25% от RAM
effective_cache_size = 1GB      # 75% от RAM
work_mem = 4MB                  # Для сортировок
maintenance_work_mem = 64MB     # Для VACUUM/CREATE INDEX
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1          # Для SSD
effective_io_concurrency = 200  # Для SSD

# Мониторинг и логирование
log_statement = 'mod'           # Логировать изменения
log_min_duration_statement = 1000ms  # Медленные запросы
track_activities = on
track_counts = on
track_functions = all
```

---

## 2. 🗂️ Redis - Кэширование и сессии

### Назначение
- **Сессии пользователей** (JWT refresh tokens)
- **Кэширование** часто запрашиваемых данных
- **Rate limiting** и временные ограничения
- **Очереди** для быстрых задач

### Структуры данных

```redis
# Сессии пользователей
user:session:{user_id} = {
    "refresh_token": "...",
    "expires_at": "2024-01-01T00:00:00Z",
    "device_info": "...",
    "last_activity": "2024-01-01T00:00:00Z"
}
TTL: 30 дней

# Кэш интервью
interview:{interview_id} = {
    "title": "...",
    "questions": [...],
    "status": "active",
    "expires_at": "..."
}
TTL: 1 час

# Rate limiting
rate_limit:api:{user_id}:{endpoint} = count
TTL: 1 минута/час/день

# Лимиты подписки
usage:{user_id}:{resource}:{month} = count
TTL: до конца месяца

# Временные токены
temp_token:{token} = {
    "user_id": "...",
    "purpose": "email_verification",
    "data": {...}
}
TTL: 24 часа
```

### Конфигурация Redis

```redis
# redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1                      # Backup каждые 15 мин при изменениях
save 300 10
save 60 10000
tcp-keepalive 300
timeout 0
databases 16

# Specific databases
# DB 0: Sessions
# DB 1: Cache
# DB 2: Rate limiting
# DB 3: Temporary tokens
```

---

## 3. 📊 ClickHouse - Аналитика и метрики

### Назначение
OLAP база для аналитики, метрик и отчетности в реальном времени

### Таблицы для аналитики

```sql
-- События пользователей
CREATE TABLE user_events (
    event_id UUID,
    user_id UUID,
    event_type LowCardinality(String),
    event_data String,
    session_id UUID,
    user_agent String,
    ip_address IPv4,
    timestamp DateTime64(3),
    date Date DEFAULT toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, user_id, timestamp)
TTL date + INTERVAL 2 YEAR;

-- Метрики интервью
CREATE TABLE interview_metrics (
    interview_id UUID,
    user_id UUID,
    metric_name LowCardinality(String),
    metric_value Float64,
    dimensions Map(String, String),
    timestamp DateTime64(3),
    date Date DEFAULT toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, interview_id, metric_name, timestamp)
TTL date + INTERVAL 1 YEAR;

-- API метрики
CREATE TABLE api_metrics (
    request_id UUID,
    method LowCardinality(String),
    endpoint String,
    status_code UInt16,
    response_time_ms UInt32,
    user_id UUID,
    service_name LowCardinality(String),
    timestamp DateTime64(3),
    date Date DEFAULT toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, service_name, endpoint, timestamp)
TTL date + INTERVAL 6 MONTH;

-- Materialized views для агрегации
CREATE MATERIALIZED VIEW daily_user_activity
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, user_id, event_type)
AS SELECT
    date,
    user_id,
    event_type,
    count() as event_count
FROM user_events
GROUP BY date, user_id, event_type;
```

### Конфигурация ClickHouse

```xml
<!-- config.xml -->
<clickhouse>
    <profiles>
        <default>
            <max_memory_usage>10000000000</max_memory_usage>
            <use_uncompressed_cache>1</use_uncompressed_cache>
            <load_balancing>random</load_balancing>
        </default>
    </profiles>
    
    <users>
        <default>
            <networks>
                <ip>::/0</ip>
            </networks>
            <profile>default</profile>
            <quota>default</quota>
        </default>
    </users>
</clickhouse>
```

---

## 4. 🗄️ S3/MinIO - Объектное хранилище

### Назначение
Хранение всех медиафайлов, документов и статических ресурсов

### Структура bucket'ов

```
ai-video-interview-storage/
├── media/
│   ├── raw/
│   │   ├── {interview_id}/{session_id}/{question_id}/
│   │   │   ├── original.{ext}
│   │   │   └── metadata.json
│   ├── processed/
│   │   ├── {interview_id}/{session_id}/{question_id}/
│   │   │   ├── compressed.mp4
│   │   │   ├── audio.wav
│   │   │   └── thumbnail.jpg
├── reports/
│   ├── {interview_id}/
│   │   ├── candidate_{session_id}_report.pdf
│   │   └── summary_report.pdf
├── backups/
│   ├── database/
│   │   └── {date}/postgresql_dump.sql.gz
│   └── config/
│       └── {date}/config_backup.tar.gz
└── temp/
    └── uploads/
        ├── {upload_id}/chunk_{n}
        └── {upload_id}/metadata.json
```

### Lifecycle правила

```json
{
  "Rules": [
    {
      "ID": "RawMediaRetention",
      "Status": "Enabled",
      "Filter": {"Prefix": "media/raw/"},
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    },
    {
      "ID": "TempCleanup",
      "Status": "Enabled",
      "Filter": {"Prefix": "temp/"},
      "Expiration": {"Days": 1}
    },
    {
      "ID": "ReportsRetention",
      "Status": "Enabled",
      "Filter": {"Prefix": "reports/"},
      "Transitions": [
        {
          "Days": 365,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

---

## 5. 🔍 Elasticsearch - Полнотекстовый поиск (опционально)

### Назначение
Расширенный поиск по транскрипциям, результатам анализа, метаданным

### Индексы

```json
// Индекс транскрипций
{
  "mappings": {
    "properties": {
      "interview_id": {"type": "keyword"},
      "session_id": {"type": "keyword"},
      "question_id": {"type": "keyword"},
      "transcription_text": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "russian": {
            "type": "text",
            "analyzer": "russian"
          },
          "english": {
            "type": "text",
            "analyzer": "english"
          }
        }
      },
      "keywords": {"type": "keyword"},
      "sentiment": {"type": "keyword"},
      "confidence_score": {"type": "float"},
      "created_at": {"type": "date"}
    }
  }
}
```

---

## 🏗️ Рекомендации по архитектуре данных

### Выбор технологий

| Тип данных | Технология | Обоснование |
|------------|------------|-------------|
| **Операционные данные** | PostgreSQL | ACID, сложные запросы, JSON поддержка |
| **Кэш и сессии** | Redis | Высокая скорость, TTL, pub/sub |
| **Аналитика** | ClickHouse | Колоночная БД, быстрая агрегация |
| **Медиафайлы** | S3/MinIO | Масштабируемость, CDN интеграция |
| **Поиск** | Elasticsearch | Полнотекстовый поиск, фасетирование |
| **Очереди** | Apache Kafka | Надежность, масштабируемость |

### Паттерны доступа к данным

#### CQRS (Command Query Responsibility Segregation)
```
Команды (Write) → PostgreSQL → Kafka Events
Запросы (Read) ← Redis Cache ← ClickHouse Analytics
```

#### Event Sourcing для критичных операций
```sql
CREATE TABLE event_store (
    id UUID PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    version INTEGER NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(aggregate_id, version)
);
```

### Стратегии масштабирования

#### PostgreSQL
- **Read Replicas** для разделения нагрузки чтения/записи
- **Connection Pooling** (PgBouncer)
- **Партиционирование** больших таблиц по времени
- **Sharding** по user_id при необходимости

#### Redis
- **Redis Cluster** для горизонтального масштабирования
- **Redis Sentinel** для высокой доступности
- **Разделение по назначению** (сессии, кэш, rate limiting)

#### ClickHouse
- **Distributed tables** для кластерной работы
- **ReplicatedMergeTree** для репликации
- **Materialized views** для предагрегации

### Мониторинг и алерты

```yaml
# Метрики для мониторинга
Database Metrics:
  - Connection count
  - Query response time
  - Cache hit ratio
  - Disk usage
  - Replication lag

Storage Metrics:
  - Storage usage by bucket
  - Upload/download rates
  - Error rates
  - Cost tracking

Performance Metrics:
  - API response times
  - Queue lengths
  - Processing times
  - Resource utilization
```

### Backup и Recovery

```bash
#!/bin/bash
# Ежедневный backup script

# PostgreSQL
pg_dump -h $PG_HOST -U $PG_USER $PG_DB | gzip > backup_$(date +%Y%m%d).sql.gz

# Redis
redis-cli --rdb backup_redis_$(date +%Y%m%d).rdb

# S3 sync to backup bucket
aws s3 sync s3://main-bucket s3://backup-bucket --delete

# ClickHouse
clickhouse-client --query "BACKUP DATABASE analytics TO S3('s3://backup-bucket/clickhouse')"
```

Эта архитектура обеспечивает:
- ⚡ **Высокую производительность** для операционных запросов
- 📊 **Быструю аналитику** в реальном времени  
- 🔄 **Горизонтальное масштабирование** всех компонентов
- 🛡️ **Надежность** через репликацию и backup'ы
- 💰 **Оптимизацию затрат** через lifecycle правила
