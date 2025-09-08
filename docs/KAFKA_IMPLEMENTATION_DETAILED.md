# Kafka Integration & Idempotency — Полное руководство

AI Video Interview Platform — временная техническая документация (детальный гайд от бизнес-логики до тех. реализации)

Если читаете впервые — начните с Раздела «Архитектурный обзор» и двигайтесь сверху вниз. Документ охватывает все ключевые аспекты: топики Kafka, сущности, таблицы БД, сервисы, ручные коммиты оффсетов, идемпотентность, DLQ, graceful shutdown, тестирование и эксплуатацию.


Содержание
- Архитектурный обзор
- Компоненты и их роли
- Модель событий (схема event)
- Kafka: Топики и конфигурация
- Базы данных, миграции и сущности TypeORM
- Идемпотентность событий (Processed Events)
- Ручной коммит оффсетов (Exactly-Once)
- Dead Letter Queue (DLQ)
- Graceful Shutdown сервисов
- Тестирование (включая Kafka + идемпотентность)
- Эксплуатация: команды и сценарии
- Troubleshooting и FAQ


Архитектурный обзор
Высокоуровневая схема

  API Gateway (port 8000)  ─┐
                            ├──► Apache Kafka ◄──┐
  User Service (port 8001) ─┘                     │
                                                PostgreSQL
  Interview Service (port 8002) ──────────────────┘

- Event-Driven Architecture: бизнес-логика сервисов обменивается событиями через Kafka.
- Exactly-Once Processing: достигается комбинацией ручного коммита оффсетов + идемпотентности.
- Fault Tolerance: DLQ топики для изоляции и последующей обработки неуспешных сообщений.
- Изоляция: отдельные consumer groups для каждого сервиса.
- Порядок: партиционирование сообщений по userId, чтобы события одного пользователя обрабатывались последовательно.


Компоненты и их роли
Репозиторий и структуру смотрим от корня проекта: /Users/oleg/www/ai-video-interview

- apps/api-gateway/
  - src/main.ts — запуск HTTP сервера, CORS, graceful shutdown
  - роль: HTTP входная точка (REST/GraphQL), публикация событий при необходимости

- apps/user-service/
  - src/main.ts — запуск сервиса, graceful shutdown
  - src/kafka/ — KafkaModule, EventIdempotencyService, подписчики/паблишеры
  - роль: домен пользователя (профиль, регистрация, изменения), публикация и обработка user-* событий

- apps/interview-service/
  - src/main.ts — запуск сервиса, graceful shutdown
  - src/entities/processed-event.entity.ts — сущность TypeORM для идемпотентности
  - роль: домен интервью (создание, расписание, статусы), обработка/публикация interview-* событий

- packages/shared/
  - src/kafka/kafka.service.ts — обертка над KafkaJS: publish, subscribe (eachBatch), DLQ, health
  - общие интерфейсы событий, утилиты

- docs/
  - architecture/ — архитектурные заметки
  - текущий документ: KAFKA_IMPLEMENTATION_DETAILED.md

- scripts/
  - create-kafka-topics.sh — создание всех топиков
  - cleanup-ports.sh — очистка занятых портов (8000..8003)
  - init-db.sql — инициализация баз и расширений
  - test-idempotency.js — интеграционный тест Kafka + идемпотентность


Модель событий (схема event)
Базовая форма события (BaseEvent)

interface BaseEvent {
  id: string;              // UUID события (event_id)
  type: string;            // USER_PROFILE_UPDATED, INTERVIEW_SCHEDULED и т.п.
  source: string;          // "user-service", "interview-service", "api-gateway" и др.
  timestamp: number;       // миллисекунды Unix time
  version: string;         // версия контракта события (например, "1")
  data: Record<string, any>; // полезная нагрузка
  metadata?: {
    correlationId?: string; // связь запрос-ответ-трассировка
    causationId?: string;   // ид события-первопричины
    userId?: string;        // ключ-партиционер (partitionKey)
  };
}

Примеры событий
USER_PROFILE_UPDATED
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "USER_PROFILE_UPDATED",
  source: "user-service",
  timestamp: 1693891200000,
  version: "1",
  data: {
    userId: "123e4567-e89b-12d3-a456-426614174000",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    changes: ["email", "firstName"]
  },
  metadata: {
    correlationId: "req-123",
    userId: "123e4567-e89b-12d3-a456-426614174000"
  }
}

INTERVIEW_SCHEDULED
{
  id: "660e8400-e29b-41d4-a716-446655440001",
  type: "INTERVIEW_SCHEDULED",
  source: "interview-service",
  timestamp: 1693891260000,
  version: "1",
  data: {
    interviewId: "789e4567-e89b-12d3-a456-426614174001",
    userId: "123e4567-e89b-12d3-a456-426614174000",
    scheduledAt: "2025-09-15T10:00:00Z",
    duration: 60,
    kind: "technical"
  },
  metadata: {
    correlationId: "req-124",
    userId: "123e4567-e89b-12d3-a456-426614174000"
  }
}


Kafka: Топики и конфигурация
Создаваемые топики (scripts/create-kafka-topics.sh)

Основные (3 партиции, RF=1):
- user-events
- user-profile-events
- interview-events
- interview-session-events
- notification-events

DLQ (1 партиция, RF=1):
- user-events-dlq
- user-profile-events-dlq
- interview-events-dlq
- interview-session-events-dlq
- notification-events-dlq

Важные параметры продьюсера (KafkaJS)
const producerConfig = {
  idempotent: true,          // Идемпотентный продьюсер
  maxInFlightRequests: 1,    // Порядок сообщений при ретраях
  acks: -1,                  // Ждать подтверждения всех реплик
  retries: 5,
  transactionTimeout: 30000,
  createPartitioner: Partitioners.LegacyPartitioner // фиксация поведения v1
};

Конфигурация консьюмера
const consumerConfig = {
  groupId: "{service-name}-group", // свой для каждого сервиса
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxWaitTimeInMs: 5000,
  allowAutoTopicCreation: false
};

Партиционирование по userId
- При публикации события ключом сообщения (message.key) выступает userId.
- Это гарантирует, что все события одного пользователя попадут в одну партицию, сохранив порядок.


Базы данных, миграции и сущности TypeORM
Базы данных (scripts/init-db.sql)
- ai_video_interview_user — БД домена пользователя
- ai_video_interview_interview — БД домена интервью
- ai_video_interview_api — БД API (резерв/по необходимости)
- Активируются расширения uuid-ossp и pgcrypto

Таблица processed_events (общая идея)
CREATE TABLE processed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE processed_events
ADD CONSTRAINT uk_processed_events_event_service
UNIQUE (event_id, service_name, event_type);

CREATE INDEX idx_processed_events_event_id ON processed_events (event_id);
CREATE INDEX idx_processed_events_service_name ON processed_events (service_name);
CREATE INDEX idx_processed_events_processed_at ON processed_events (processed_at);
CREATE INDEX idx_processed_events_event_type ON processed_events (event_type);

TypeORM entity (пример из apps/interview-service/src/entities/processed-event.entity.ts)
@Entity('processed_events')
@Index('idx_processed_events_event_id', ['eventId'])
@Index('idx_processed_events_service_name', ['serviceName'])
@Index('idx_processed_events_processed_at', ['processedAt'])
@Index('idx_processed_events_event_type', ['eventType'])
@Unique('uk_processed_events_event_service', ['eventId', 'serviceName', 'eventType'])
export class ProcessedEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'event_id', length: 255 }) eventId: string;
  @Column({ name: 'event_type', length: 100 }) eventType: string;
  @Column({ name: 'service_name', length: 100 }) serviceName: string;
  @Column({ name: 'processed_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' }) processedAt: Date;
  @Column({ name: 'event_data', type: 'jsonb', nullable: true }) eventData?: Record<string, any>;
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' }) updatedAt: Date;
}


Идемпотентность событий (Processed Events)
Назначение
- Исключить повторную обработку одного и того же события в рамках одного сервиса.
- Гарантия: комбинация (event_id, service_name, event_type) уникальна.

Сервис EventIdempotencyService (apps/user-service/src/kafka/event-idempotency.service.ts и аналог в интервью-сервисе)
Основные методы:
- isEventProcessed(eventId, eventType): boolean — проверка в таблице
- markEventProcessed(eventId, eventType, eventData?): void — запись в таблицу
- processEventSafely(eventId, eventType, processor): { processed: boolean, result?: T }
  - если событие новое — вызывает ваш обработчик processor(); затем помечает как обработанное
  - если дубликат — пропускает

Пример использования в консьюмере
await idempotency.processEventSafely(event.id, event.type, async () => {
  // бизнес-логика обработки
  await doWork(event.data);
});


Ручной коммит оффсетов (Exactly-Once)
Подписка в режиме eachBatch с autoCommit: false
- Мы управляем коммитом оффсета вручную.
- Алгоритм:
  1) получаем batch
  2) для каждого сообщения: проверка идемпотентности + обработка
  3) после успешной обработки всех сообщений — commitOffsetsIfNecessary()
  4) при ошибке — не коммитим и отправляем сообщение в DLQ (или ретраи)

Псевдокод
await consumer.run({
  eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary, isRunning, isStale }) => {
    for (const message of batch.messages) {
      if (!isRunning() || isStale()) break;

      const event = decode(message);
      const { processed } = await idempotency.processEventSafely(event.id, event.type, async () => {
        await businessHandler(event);
      });

      // Сдвигаем offset только после успешной или заведомо пропущенной обработки
      resolveOffset(message.offset);
      await heartbeat();
    }

    await commitOffsetsIfNecessary();
  }
});


Dead Letter Queue (DLQ)
Назначение
- Исключить блокировку партиции из-за «плохого» сообщения.
- Сообщения, давшие необрабатываемую ошибку, отправляются в {originalTopic}-dlq с контекстом ошибки.

Содержимое DLQ сообщения
- оригинальные headers, key, value, offset
- error: stack/message
- retryCount: количество попыток (если реализована политика ретраев)

Обработка DLQ
- Отдельные воркеры/скрипты могут анализировать DLQ и решать:
  - починить данные и репаблишнуть
  - удалить/заархивировать
  - уведомить команду/системы мониторинга


Graceful Shutdown сервисов
Файлы: apps/*/src/main.ts
- Включены shutdown hooks: app.enableShutdownHooks()
- Обработчики сигналов: SIGTERM, SIGINT, SIGUSR2
- Последовательное закрытие приложения: await app.close()
- Результат: порты освобождаются, EADDRINUSE исчезает

Скрипт очистки портов (fallback)
- scripts/cleanup-ports.sh
- npm run cleanup:ports
- Умеет SIGTERM, подождать, затем SIGKILL при необходимости


Тестирование (включая Kafka + идемпотентность)
Скрипт: scripts/test-idempotency.js
Проверяет:
1) Локальную идемпотентность (через PG):
   - первое событие обрабатывается
   - дубликат пропускается
   - одинаковый event_id в другом сервисе — допускается (уникальность включает service_name)
   - другое событие — обрабатывается
   - таблица processed_events содержит корректные записи

2) Интеграцию Kafka + идемпотентность:
   - публикация события с ключом = userId
   - подписка consumer в eachBatch с autoCommit=false
   - первая обработка — OK, вторая — пропуск
   - ручной коммит оффсетов после успешной обработки

Ожидаемый вывод (успешный)
✅ First event processing: PASSED
✅ Duplicate event skipping: PASSED
✅ Different service processing: PASSED
✅ Different event processing: PASSED
✅ Database verification: PASSED
✅ Kafka idempotency: PASSED


Эксплуатация: команды и сценарии
Инфраструктура
- npm run infra:up — поднять Postgres/Redis/MinIO
- npm run kafka:up — поднять Kafka профили
- npm run kafka:reset — пересоздать Kafka (включая -v)

Запуск сервисов
- npm run dev:services — API Gateway, User, Interview
- npm run dev:all — + web (если подключен)

Миграции (через TypeORM CLI в package.json каждого сервиса)
- npm run migration:run — применить миграции
- npm run migration:revert — откатить
- npm run migration:generate — сгенерировать новую

Очистка портов
- npm run cleanup:ports


Troubleshooting и FAQ
1) EADDRINUSE: address already in use :::8000
- Причина: раннее отсутствие graceful shutdown.
- Решение: уже исправлено в main.ts всех сервисов. В крайнем случае — npm run cleanup:ports.

2) Сообщения не обрабатываются потребителем
- Проверьте groupId — новый groupId начинает читать только новые сообщения (fromBeginning=false по умолчанию).
- Убедитесь, что publish отправляет key=partitionKey (userId), headers корректные, формат value корректный.
- Посмотрите логи consumer: возможны ошибки в бизнес-обработчике.

3) Дубликаты все же попадают в обработку
- Проверьте уникальный индекс (event_id, service_name, event_type) в processed_events.
- Убедитесь, что в processEventSafely запись делается после успешного завершения business handler.
- Проверьте, что транзакции/коннекты к БД корректны и ошибки обрабатываются, чтобы не коммитить оффсет преждевременно.

4) Партиционирование «расползлось» после обновления KafkaJS 2.x
- В продьюсере зафиксирован LegacyPartitioner (см. предупреждение в логах). Если нужен новый поведенческий контракт — скорректировать ключи/партиционер и пересчитать ожидания порядка.

5) DLQ растет
- Включите процессоры DLQ, заведите алерты/дашборды.
- Разберите типовые ошибки, добавьте валидации и защиту от «токсичных» событий до публикации.

6) Мониторинг и Health
- KafkaHealthService (в shared) может пинговать кластер и выдавать статусы.
- Добавьте /health эндпоинты, Prometheus метрики при необходимости.


Итог
- Реализована устойчивая, production-ready интеграция с Kafka.
- Exactly-Once достигается ручным коммитом оффсетов и идемпотентностью на уровне БД.
- Предусмотрены DLQ, партиционирование по userId, корректный graceful shutdown.
- Скрипты и команды покрывают ключевые эксплуатационные сценарии.
- Тесты подтверждают корректность работы (включая дубликаты и интеграцию Kafka + БД).

Дальнейшие шаги (рекомендации)
- Добавить DLQ-воркеры и дашборды (Grafana/Prometheus, ELK/Opensearch).
- Добавить ретраи с backoff и maxRetries, после чего — DLQ.
- Добавить трассировку (OpenTelemetry) c propagation в headers событий.
- Нагрузочное тестирование (k6, Vegeta) для оценки пропускной способности и задержек.
- Четкая схема версионирования событий и миграции контрактов.
