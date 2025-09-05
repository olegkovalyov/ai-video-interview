# Kafka Architecture и Event-Driven Communication

## Обзор

AI Video Interview платформа использует Apache Kafka для event-driven коммуникации между микросервисами. Kafka обеспечивает асинхронную, масштабируемую и надежную доставку событий.

## Архитектура

### Топики и Партиции

```
user-events (3 partitions)          → user-service, interview-service
├─ user.authenticated
├─ user.registered  
├─ user.logged_out
└─ user.profile_updated

interview-events (3 partitions)     → user-service, analytics-service
├─ interview.started
├─ interview.completed
└─ interview.scored

user-analytics (2 partitions)       → analytics-service
├─ user.activity_tracked
└─ user.behavior_analyzed

Dead Letter Queues (1 partition each)
├─ user-events-dlq
├─ interview-events-dlq
└─ user-analytics-dlq
```

### Consumer Groups

- **user-service-group**: Обрабатывает user-events для пользовательской логики
- **interview-service-group**: Обрабатывает user-events для интервью контекста
- **analytics-service-group**: Обрабатывает все события для аналитики

### Producers

- **API Gateway**: Публикует user-events при аутентификации
- **User Service**: Публикует user lifecycle события
- **Interview Service**: Публикует interview-events

## Ключевые Features

### 1. Manual Offset Commit

```typescript
// Ручной контроль оффсетов предотвращает потерю сообщений
await kafkaService.subscribe(
  KAFKA_TOPICS.USER_EVENTS,
  'user-service-group',
  handler,
  {
    fromBeginning: false,
    autoCommit: false,      // Отключить автокоммит
    mode: 'eachBatch'       // Batch обработка с ручным контролем
  }
);
```

### 2. Event Idempotency

```sql
-- Таблица для отслеживания обработанных событий
CREATE TABLE processed_events (
    event_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    service_name VARCHAR(50) NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_event_per_service UNIQUE (event_id, service_name)
);
```

```typescript
// Идемпотентная обработка событий
await idempotencyService.processEventSafely(
  eventId, eventType, serviceName, payload, 
  async (payload) => {
    // Бизнес-логика обработки
    await processEvent(payload);
  }
);
```

### 3. Partitioning Strategy

```typescript
// Партицирование по userId для гарантии порядка событий пользователя
await kafkaService.publishEvent(
  KAFKA_TOPICS.USER_EVENTS,
  userEvent,
  { partitionKey: userId }  // Все события пользователя в одну партицию
);
```

### 4. Dead Letter Queue (DLQ)

```typescript
// Автоматическая отправка в DLQ после 3 неудачных попыток
const maxRetries = 3;
if (retryCount >= maxRetries) {
  await kafkaService.sendToDLQ(topic, message, error, retryCount);
  resolveOffset(message.offset);  // Помечаем как обработанное
}
```

### 5. Health Monitoring

```typescript
// Мониторинг состояния Kafka кластера
const healthService = new KafkaHealthService();
const status = await healthService.checkHealth();

console.log({
  brokers: status.brokers,
  topics: status.topics,
  consumerLag: status.consumerGroups.map(g => ({
    groupId: g.groupId,
    totalLag: g.lag.reduce((sum, l) => sum + l.lag, 0)
  }))
});
```

## Event Schemas

### User Events

```typescript
interface UserAuthenticatedEvent {
  eventId: string;
  eventType: 'user.authenticated';
  timestamp: number;
  source: string;
  version: string;
  payload: {
    userId: string;
    authMethod: string;
    sessionId: string;
    ipAddress?: string;
  };
}

interface UserRegisteredEvent {
  eventId: string;
  eventType: 'user.registered';
  timestamp: number;
  source: string;
  version: string;
  payload: {
    userId: string;
    email: string;
    profile: UserProfile;
  };
}
```

## Best Practices

### 1. Производительность

- **Batch Processing**: Используйте `eachBatch` для высокой пропускной способности
- **Partitioning**: Партицируйте по entity ID (userId, sessionId) для параллелизма
- **Compression**: Включите compression на producer level (gzip, lz4)
- **Buffer Settings**: Настройте `linger.ms` и `batch.size` для оптимизации

### 2. Надежность

- **Manual Commits**: Используйте ручные коммиты для exactly-once семантики
- **Idempotency**: Всегда проверяйте `eventId` перед обработкой
- **DLQ Strategy**: Отправляйте проблемные сообщения в Dead Letter Queue
- **Retry Logic**: Используйте exponential backoff для ретраев

### 3. Безопасность

- **Authentication**: Настройте SASL/SSL для production
- **Authorization**: Используйте Kafka ACLs для контроля доступа
- **Encryption**: Включите шифрование в transit и at rest
- **Audit Logging**: Логируйте все операции с событиями

### 4. Мониторинг

- **Consumer Lag**: Отслеживайте отставание консюмеров
- **Throughput Metrics**: Мониторьте messages/sec, bytes/sec
- **Error Rates**: Отслеживайте failed messages и DLQ активность
- **Health Checks**: Регулярно проверяйте состояние брокеров и топиков

## Deployment и Operations

### Kafka Cluster Setup

```yaml
# docker-compose.yml
services:
  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_LOG_RETENTION_HOURS: 168  # 7 дней
      KAFKA_LOG_SEGMENT_BYTES: 1073741824  # 1GB
```

### Topic Configuration

```bash
# Создание топиков с оптимальными настройками
kafka-topics --create \
  --topic user-events \
  --partitions 3 \
  --replication-factor 1 \
  --config cleanup.policy=delete \
  --config retention.ms=604800000 \
  --config segment.ms=86400000
```

### Consumer Group Management

```bash
# Мониторинг consumer groups
kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group user-service-group

# Сброс оффсетов
kafka-consumer-groups --bootstrap-server localhost:9092 --group user-service-group --reset-offsets --to-earliest --topic user-events --execute
```

## Troubleshooting

### Типичные проблемы

1. **Consumer Lag**: 
   - Увеличьте количество consumer instances
   - Оптимизируйте обработку сообщений
   - Проверьте network latency

2. **Duplicate Processing**:
   - Убедитесь в работе idempotency checks
   - Проверьте commit strategy
   - Валидируйте consumer group configuration

3. **Message Loss**:
   - Используйте manual commits
   - Настройте proper acknowledgment timeout
   - Проверьте error handling в consumer

4. **High Memory Usage**:
   - Настройте batch size и fetch size
   - Оптимизируйте serialization
   - Мониторьте heap usage

### Полезные команды

```bash
# Проверка состояния кластера
kafka-broker-api-versions --bootstrap-server localhost:9092

# Просмотр сообщений в топике
kafka-console-consumer --bootstrap-server localhost:9092 --topic user-events --from-beginning

# Мониторинг performance metrics
kafka-run-class kafka.tools.JmxTool --object-name kafka.server:type=BrokerTopicMetrics,name=MessagesInPerSec
```

## Roadmap

### Запланированные улучшения

- [ ] Schema Registry интеграция для версионирования событий
- [ ] Kafka Streams для real-time analytics
- [ ] Multi-datacenter replication
- [ ] Advanced monitoring с Prometheus/Grafana
- [ ] Automated partition rebalancing
- [ ] Event sourcing patterns для audit trail

---

*Последнее обновление: 2025-09-03*
