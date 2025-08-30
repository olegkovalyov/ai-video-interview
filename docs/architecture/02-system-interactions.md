# Схемы взаимодействия системы - AI Video Interview Platform

## 1. 🏗️ Контекстная диаграмма (C4 - Level 1)

```mermaid
graph TB
    HR[HR Manager<br/>🧑‍💼 Создает интервью<br/>Анализирует результаты]
    Candidate[Candidate<br/>👤 Проходит интервью<br/>по публичной ссылке]
    Admin[System Admin<br/>⚙️ Управляет системой<br/>Мониторинг]
    
    System[AI Video Interview Platform<br/>🎯 Асинхронные видео-интервью<br/>с AI-анализом]
    
    Email[Email Service<br/>📧 Resend API]
    Storage[Cloud Storage<br/>☁️ S3/MinIO]
    AI[AI Services<br/>🤖 OpenAI API<br/>Whisper + GPT-4]
    Payment[Payment System<br/>💳 Stripe]
    
    HR --> System
    Candidate --> System
    Admin --> System
    
    System --> Email
    System --> Storage
    System --> AI
    System --> Payment
    
    style System fill:#e1f5fe
    style HR fill:#f3e5f5
    style Candidate fill:#e8f5e8
    style Admin fill:#fff3e0
```

---

## 2. 🔗 Диаграмма контейнеров (C4 - Level 2)

```mermaid
graph TB
    subgraph "Frontend Layer"
        WebApp[Web Application<br/>Next.js + React<br/>Port: 3000]
        PublicApp[Public Interview Page<br/>Next.js<br/>Port: 3001]
    end
    
    subgraph "API Layer"
        Gateway[API Gateway<br/>NestJS + Authentik OAuth2<br/>Port: 8000]
    end
    
    subgraph "Core Services"
        UserSvc[User Service<br/>NestJS<br/>Port: 8001]
        InterviewSvc[Interview Service<br/>NestJS<br/>Port: 8002]
        MediaSvc[Media Service<br/>NestJS + FFmpeg<br/>Port: 8003]
        AISvc[AI Analysis Service<br/>Python FastAPI<br/>Port: 8004]
        BillingSvc[Billing Service<br/>NestJS<br/>Port: 8005]
        NotificationSvc[Notification Service<br/>NestJS<br/>Port: 8006]
        ReportingSvc[Reporting Service<br/>NestJS<br/>Port: 8007]
    end
    
    subgraph "Data Layer"
        MainDB[(PostgreSQL<br/>Main Database)]
        CacheDB[(Redis<br/>Cache & Sessions)]
        FileStorage[(S3/MinIO<br/>Media Files)]
        Analytics[(ClickHouse<br/>Analytics)]
    end
    
    subgraph "Message Queue"
        Kafka[Apache Kafka<br/>Event Streaming]
    end
    
    subgraph "External APIs"
        OpenAI[OpenAI API<br/>Whisper + GPT-4]
        Stripe[Stripe API<br/>Payments]
        Resend[Resend API<br/>Email]
    end
    
    %% Frontend connections
    WebApp --> Gateway
    PublicApp --> Gateway
    
    %% Gateway routing
    Gateway --> UserSvc
    Gateway --> InterviewSvc
    Gateway --> MediaSvc
    Gateway --> BillingSvc
    Gateway --> ReportingSvc
    
    %% Service to service
    InterviewSvc --> MediaSvc
    MediaSvc --> AISvc
    AISvc --> ReportingSvc
    BillingSvc --> NotificationSvc
    
    %% Database connections
    UserSvc --> MainDB
    InterviewSvc --> MainDB
    MediaSvc --> MainDB
    BillingSvc --> MainDB
    ReportingSvc --> MainDB
    NotificationSvc --> MainDB
    
    %% Cache connections
    Gateway --> CacheDB
    UserSvc --> CacheDB
    BillingSvc --> CacheDB
    
    %% File storage
    MediaSvc --> FileStorage
    ReportingSvc --> FileStorage
    
    %% Analytics
    ReportingSvc --> Analytics
    
    %% Kafka connections
    InterviewSvc --> Kafka
    MediaSvc --> Kafka
    AISvc --> Kafka
    NotificationSvc --> Kafka
    BillingSvc --> Kafka
    
    %% External API connections
    AISvc --> OpenAI
    BillingSvc --> Stripe
    NotificationSvc --> Resend
    
    style WebApp fill:#e3f2fd
    style Gateway fill:#f3e5f5
    style MainDB fill:#e8f5e8
    style Kafka fill:#fff3e0
```

---

## 3. 📋 Sequence диаграмма: Создание интервью

```mermaid
sequenceDiagram
    participant HR as HR Manager
    participant WebApp as Web App
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant Interview as Interview Service
    participant DB as PostgreSQL
    participant Cache as Redis
    
    HR->>WebApp: Открывает форму создания интервью
    WebApp->>Gateway: POST /api/interviews
    Gateway->>Auth: Проверка JWT токена
    Auth-->>Gateway: Токен валиден
    
    Gateway->>Interview: createInterview(data)
    Interview->>DB: INSERT interview
    DB-->>Interview: InterviewId
    
    Interview->>Interview: Генерация UUID для публичной ссылки
    Interview->>DB: UPDATE interview SET public_link
    Interview->>Cache: SET interview:{id} (кеш на 1 час)
    
    Interview-->>Gateway: Interview created
    Gateway-->>WebApp: 201 Created + interview data
    WebApp-->>HR: Отображение интервью + публичная ссылка
```

---

## 4. 📹 Sequence диаграмма: Прохождение интервью кандидатом

```mermaid
sequenceDiagram
    participant Candidate as Кандидат
    participant PublicApp as Public App
    participant Gateway as API Gateway
    participant Interview as Interview Service
    participant Media as Media Service
    participant S3 as S3/MinIO
    participant Kafka as Kafka
    participant AI as AI Service
    participant Notification as Notification
    
    Candidate->>PublicApp: Переход по публичной ссылке
    PublicApp->>Gateway: GET /api/public/interview/{token}
    Gateway->>Interview: getPublicInterview(token)
    Interview-->>Gateway: Interview data + questions
    Gateway-->>PublicApp: Interview details
    
    loop Для каждого вопроса
        PublicApp->>Candidate: Показ вопроса
        Candidate->>PublicApp: Запись видео/аудио ответа
        PublicApp->>Gateway: POST /api/public/upload-response
        Gateway->>Media: uploadResponse(file, metadata)
        Media->>S3: Загрузка файла
        S3-->>Media: File URL
        Media->>Media: Создание записи в БД
        Media->>Kafka: Publish: MediaFileUploaded
        Media-->>Gateway: Upload successful
        Gateway-->>PublicApp: Response saved
    end
    
    PublicApp->>Gateway: POST /api/public/complete-interview
    Gateway->>Interview: completeInterview(sessionId)
    Interview->>Kafka: Publish: InterviewCompleted
    
    Note over Kafka: Асинхронная обработка
    Kafka->>AI: Consume: MediaFileUploaded
    AI->>AI: Запуск транскрипции (Whisper)
    AI->>AI: Анализ содержания (GPT-4)
    AI->>Kafka: Publish: AnalysisCompleted
    
    Kafka->>Notification: Consume: InterviewCompleted
    Notification->>Notification: Отправка email HR'у
```

---

## 5. 🔄 Event Flow диаграмма

```mermaid
graph TD
    A[Interview Created] --> B[Kafka: InterviewCreated]
    
    C[Media File Uploaded] --> D[Kafka: MediaFileUploaded]
    D --> E[Media Processing]
    E --> F[Kafka: MediaProcessed]
    F --> G[AI Analysis]
    G --> H[Kafka: AnalysisCompleted]
    
    I[Interview Completed] --> J[Kafka: InterviewCompleted]
    J --> K[Report Generation]
    J --> L[Email Notification]
    
    H --> M[Update Interview Status]
    H --> N[Generate Report]
    
    O[Payment Success] --> P[Kafka: PaymentCompleted]
    P --> Q[Update Subscription]
    P --> R[Send Receipt]
    
    S[Usage Limit Reached] --> T[Kafka: LimitReached]
    T --> U[Block Operations]
    T --> V[Upgrade Notification]
    
    style B fill:#e1f5fe
    style D fill:#e8f5e8
    style F fill:#fff3e0
    style H fill:#f3e5f5
    style J fill:#fce4ec
```

---

## 6. 🏛️ Инфраструктурная диаграмма

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[NGINX<br/>Load Balancer<br/>SSL Termination]
    end
    
    subgraph "Kubernetes Cluster"
        subgraph "Frontend Namespace"
            WebPod[Web App Pods<br/>Next.js x3]
            PublicPod[Public App Pods<br/>Next.js x2]
        end
        
        subgraph "API Namespace"
            GatewayPod[API Gateway Pods<br/>NestJS x3]
        end
        
        subgraph "Services Namespace"
            UserPod[User Service x2]
            InterviewPod[Interview Service x2]
            MediaPod[Media Service x2]
            AIPod[AI Service x2]
            BillingPod[Billing Service x2]
            NotificationPod[Notification Service x2]
            ReportingPod[Reporting Service x2]
        end
        
        subgraph "Processing Namespace"
            FFmpegPod[FFmpeg Workers x3]
            WhisperPod[Whisper Workers x2]
        end
    end
    
    subgraph "Data Layer"
        PGCluster[(PostgreSQL Cluster<br/>Primary + 2 Replicas)]
        RedisCluster[(Redis Cluster<br/>3 nodes)]
        KafkaCluster[Kafka Cluster<br/>3 brokers]
        ClickHouse[(ClickHouse<br/>Analytics DB)]
    end
    
    subgraph "Storage"
        S3Bucket[S3 Buckets<br/>media-files<br/>reports<br/>backups]
    end
    
    subgraph "Monitoring"
        Prometheus[Prometheus<br/>Metrics]
        Grafana[Grafana<br/>Dashboards]
        Loki[Loki<br/>Logs]
        Alertmanager[Alertmanager<br/>Alerts]
    end
    
    subgraph "External Services"
        OpenAIExt[OpenAI API]
        StripeExt[Stripe API]
        ResendExt[Resend API]
    end
    
    %% Connections
    LB --> WebPod
    LB --> PublicPod
    LB --> GatewayPod
    
    GatewayPod --> UserPod
    GatewayPod --> InterviewPod
    GatewayPod --> MediaPod
    GatewayPod --> BillingPod
    GatewayPod --> ReportingPod
    
    MediaPod --> FFmpegPod
    AIPod --> WhisperPod
    
    UserPod --> PGCluster
    InterviewPod --> PGCluster
    MediaPod --> PGCluster
    BillingPod --> PGCluster
    
    GatewayPod --> RedisCluster
    UserPod --> RedisCluster
    
    InterviewPod --> KafkaCluster
    MediaPod --> KafkaCluster
    AIPod --> KafkaCluster
    NotificationPod --> KafkaCluster
    
    ReportingPod --> ClickHouse
    
    MediaPod --> S3Bucket
    ReportingPod --> S3Bucket
    
    AIPod --> OpenAIExt
    BillingPod --> StripeExt
    NotificationPod --> ResendExt
    
    %% Monitoring connections
    Prometheus --> UserPod
    Prometheus --> InterviewPod
    Prometheus --> MediaPod
    Grafana --> Prometheus
    Loki --> UserPod
    Alertmanager --> Prometheus
    
    style LB fill:#ffcdd2
    style WebPod fill:#e1f5fe
    style PGCluster fill:#e8f5e8
    style KafkaCluster fill:#fff3e0
    style Prometheus fill:#f3e5f5
```

---

## 7. 📊 Диаграмма потоков данных

```mermaid
graph LR
    subgraph "Input Layer"
        HR[HR Input<br/>Interview Config]
        Candidate[Candidate Input<br/>Video/Audio]
    end
    
    subgraph "Processing Layer"
        Validation[Data Validation<br/>& Sanitization]
        MediaProc[Media Processing<br/>FFmpeg]
        AIProc[AI Processing<br/>Whisper + GPT-4]
    end
    
    subgraph "Storage Layer"
        OLTP[(OLTP Database<br/>PostgreSQL<br/>Operational Data)]
        Files[(File Storage<br/>S3/MinIO<br/>Raw & Processed Media)]
        OLAP[(OLAP Database<br/>ClickHouse<br/>Analytics Data)]
    end
    
    subgraph "Output Layer"
        Reports[PDF/CSV Reports]
        Dashboard[Real-time Dashboard]
        Notifications[Email/Webhook<br/>Notifications]
        API[REST/GraphQL API]
    end
    
    %% Flow connections
    HR --> Validation
    Candidate --> Validation
    
    Validation --> OLTP
    Validation --> MediaProc
    
    MediaProc --> Files
    MediaProc --> AIProc
    
    AIProc --> OLTP
    AIProc --> OLAP
    
    OLTP --> Reports
    OLTP --> Dashboard
    OLTP --> Notifications
    OLTP --> API
    
    OLAP --> Dashboard
    OLAP --> Reports
    
    Files --> Reports
    
    style HR fill:#e3f2fd
    style Candidate fill:#e8f5e8
    style OLTP fill:#f3e5f5
    style Files fill:#fff3e0
    style OLAP fill:#fce4ec
```

---

## Принципы проектирования

### 🔒 Безопасность
- **JWT токены** для аутентификации
- **RBAC** для авторизации
- **Pre-signed URLs** для загрузки файлов
- **Rate limiting** на API Gateway
- **Input validation** на всех уровнях

### 📈 Масштабируемость
- **Горизонтальное масштабирование** сервисов
- **Асинхронная обработка** через Kafka
- **Кеширование** в Redis
- **CDN** для статических файлов
- **Database sharding** (при необходимости)

### 🔄 Надежность
- **Circuit breaker** pattern
- **Retry mechanisms** с exponential backoff
- **Health checks** для всех сервисов
- **Graceful shutdown**
- **Data backup** и disaster recovery

### 📊 Мониторинг
- **Distributed tracing** (Jaeger)
- **Metrics collection** (Prometheus)
- **Log aggregation** (Loki)
- **Error tracking** (Sentry)
- **Performance monitoring** (APM)
