# Kafka Configuration

**Версия:** 1.0  
**Дата:** 2025-10-06  
**Статус:** ✅ Реализовано

---

## 🎯 Обзор

Платформа использует **Apache Kafka** для event-driven communication между микросервисами.

**Ключевые особенности:**
- ✅ Exactly-once processing (manual offset commits)
- ✅ Event idempotency (processed_events table)
- ✅ Dead Letter Queue (DLQ) для failed messages
- ✅ Partitioning по userId для гарантии порядка
- ✅ Separate consumer groups per service
- ✅ Health monitoring

---

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────┐
│            KAFKA CLUSTER (KRaft)                │
│          kafka:9092 (internal)                  │
│          localhost:9092 (external)              │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────┐│
│  │ user-events  │  │interview-evt │  │media  ││
│  │ 3 partitions │  │ 3 partitions │  │events ││
│  └──────────────┘  └──────────────┘  └───────┘│
│                                                 │
│  ┌──────────────┐  ┌──────────────┐           │
│  │ user-events  │  │interview-evt │  (DLQ)    │
│  │     -dlq     │  │     -dlq     │           │
│  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────┘
           │                    │
    ┌──────┴────────┐    ┌──────┴────────┐
    │               │    │               │
┌───▼────────┐  ┌───▼────────┐  ┌──────────────┐
│User Service│  │Interview   │  │ API Gateway  │
│            │  │ Service    │  │              │
│ - Producer │  │ - Producer │  │  - Consumer  │
│ - Consumer │  │ - Consumer │  │              │
└────────────┘  └────────────┘  └──────────────┘
```

---

## 📋 Topics Configuration

### Auth Events
```yaml
Topic: auth-events
Partitions: 3
Replication Factor: 1 (dev), 3 (prod)
Retention: 30 days
Partition Key: userId
```

**Event Types:**
- `user.authenticated`
- `user.logged_out`

**Producer:** API Gateway  
**Consumers:** Analytics Service (future), Audit Service (future)

**Note:** Auth events хранятся дольше (30 дней) для audit purposes.

### User Events
```yaml
Topic: user-events
Partitions: 3
Replication Factor: 1 (dev), 3 (prod)
Retention: 7 days
Partition Key: userId
```

**Event Types:**
- `user.created`
- `user.updated`
- `user.deleted`
- `user.avatar_uploaded`

### Interview Events
```yaml
Topic: interview-events
Partitions: 3
Replication Factor: 1 (dev), 3 (prod)
Retention: 7 days
Partition Key: userId
```

**Event Types:**
- `interview.created`
- `interview.updated`
- `interview.published`
- `interview.completed`
- `interview.deleted`

### Media Events
```yaml
Topic: media-events
Partitions: 3
Replication Factor: 1 (dev), 3 (prod)
Retention: 7 days
Partition Key: userId
```

**Event Types:**
- `media.uploaded`
- `media.processed`
- `media.deleted`

### Dead Letter Queues (DLQ)
```yaml
Topics:
  - user-events-dlq
  - interview-events-dlq
  - media-events-dlq

Partitions: 1
Retention: 30 days
```

---

## 🔧 KafkaService Configuration

### Environment Variables

```bash
# Kafka Connection
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=user-service
KAFKA_GROUP_ID=user-service-group

# Consumer Configuration
KAFKA_AUTO_COMMIT=false           # Manual commits
KAFKA_FROM_BEGINNING=false        # Production mode
KAFKA_SESSION_TIMEOUT=30000       # 30s
KAFKA_HEARTBEAT_INTERVAL=3000     # 3s

# Retry Configuration
KAFKA_MAX_RETRIES=3
KAFKA_RETRY_DELAY_MS=1000
KAFKA_DLQ_ENABLED=true
```

---

## 🔄 Exactly-Once Processing

### Manual Offset Commits

```typescript
// KafkaService - eachBatch mode
await consumer.run({
  autoCommit: false,  // ❌ Не коммитим автоматически
  eachBatch: async ({ batch, resolveOffset, commitOffsetsIfNecessary }) => {
    for (const message of batch.messages) {
      const event = JSON.parse(message.value.toString());
      
      // 1. Проверяем идемпотентность
      const isProcessed = await this.eventIdempotencyService.isProcessed(
        event.eventId,
        this.serviceName
      );
      
      if (!isProcessed) {
        try {
          // 2. Обрабатываем событие
          await this.processEvent(event);
          
          // 3. Сохраняем в processed_events (в транзакции)
          await this.eventIdempotencyService.markAsProcessed(event);
          
          // 4. Коммитим offset вручную
          resolveOffset(message.offset);
          await commitOffsetsIfNecessary();
          
        } catch (error) {
          // 5. Отправляем в DLQ при ошибке
          await this.sendToDLQ(event, error);
        }
      } else {
        // Уже обработано - просто коммитим offset
        resolveOffset(message.offset);
      }
    }
  }
});
```

---

## 🔐 Event Idempotency

### Database Table

```sql
CREATE TABLE processed_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_event_per_service 
    UNIQUE (event_id, service_name)
);

CREATE INDEX idx_processed_events_event_id 
  ON processed_events(event_id);
```

### EventIdempotencyService

```typescript
@Injectable()
export class EventIdempotencyService {
  async isProcessed(eventId: string, serviceName: string): Promise<boolean> {
    const event = await this.repository.findOne({
      where: { eventId, serviceName }
    });
    return !!event;
  }
  
  async markAsProcessed(event: any): Promise<void> {
    await this.repository.save({
      eventId: event.eventId,
      serviceName: this.serviceName,
      topic: event.topic,
      processedAt: new Date()
    });
  }
}
```

**Гарантии:**
- ✅ Дубликаты событий игнорируются
- ✅ UNIQUE constraint предотвращает race conditions
- ✅ Транзакции обеспечивают атомарность

---

## ⚠️ Dead Letter Queue (DLQ)

### Когда событие попадает в DLQ:
1. **Ошибка обработки** (exception thrown)
2. **Превышено max retries** (3 попытки)
3. **Validation failed** (invalid event schema)

### DLQ Message Format

```json
{
  "originalEvent": {
    "eventId": "evt-123",
    "eventType": "user.created",
    "data": { ... }
  },
  "error": {
    "message": "Database connection failed",
    "stack": "...",
    "timestamp": "2025-10-06T10:00:00.000Z"
  },
  "metadata": {
    "originalTopic": "user-events",
    "partition": 0,
    "offset": 12345,
    "serviceName": "user-service",
    "retryCount": 3
  }
}
```

### DLQ Replay

```bash
# Просмотр DLQ messages
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic user-events-dlq --from-beginning

# Ручной replay (после исправления проблемы)
# Можно republish событие в основной topic
```

---

## 🎯 Partitioning Strategy

### По userId

```typescript
// При отправке события
await producer.send({
  topic: 'user-events',
  messages: [{
    key: event.userId,  // ← Partition key
    value: JSON.stringify(event)
  }]
});
```

**Гарантии:**
- ✅ События одного пользователя всегда в одной partition
- ✅ Порядок событий внутри partition гарантирован
- ✅ Параллельная обработка разных пользователей

---

## 👥 Consumer Groups

### Separate Groups per Service

```
Topic: user-events

Consumer Groups:
├── user-service-group
│   └── user-service instance(s)
│
├── interview-service-group
│   └── interview-service instance(s)
│
└── api-gateway-group (если нужно)
    └── api-gateway instance(s)
```

**Преимущества:**
- ✅ Изоляция между сервисами
- ✅ Независимое потребление
- ✅ Каждый сервис может иметь свой offset

---

## 🔍 Monitoring & Health Checks

### KafkaHealthService

```typescript
@Injectable()
export class KafkaHealthService {
  async checkHealth(): Promise<boolean> {
    try {
      // Проверяем подключение к Kafka
      const admin = this.kafka.admin();
      await admin.connect();
      
      // Получаем список topics
      const topics = await admin.listTopics();
      
      await admin.disconnect();
      return topics.length > 0;
      
    } catch (error) {
      this.logger.error('Kafka health check failed', error);
      return false;
    }
  }
}
```

### Metrics

```typescript
// Экспортируемые метрики (Prometheus)
- kafka_messages_published_total (counter)
- kafka_messages_consumed_total (counter)
- kafka_consumer_lag (gauge)
- kafka_processing_duration_seconds (histogram)
- kafka_errors_total (counter by error_type)
- kafka_dlq_messages_total (counter)
```

---

## 🧪 Testing

### Integration Tests

```typescript
describe('Kafka Integration', () => {
  it('should publish and consume event', async () => {
    const event = {
      eventId: uuidv4(),
      eventType: 'user.created',
      userId: 'user-123',
      data: { email: 'test@example.com' }
    };
    
    // Publish
    await kafkaService.publishEvent('user-events', event);
    
    // Wait for consumption
    await sleep(1000);
    
    // Verify processing
    const isProcessed = await eventIdempotencyService.isProcessed(
      event.eventId,
      'user-service'
    );
    
    expect(isProcessed).toBe(true);
  });
  
  it('should handle duplicate events', async () => {
    // Publish same event twice
    await kafkaService.publishEvent('user-events', event);
    await kafkaService.publishEvent('user-events', event);
    
    await sleep(2000);
    
    // Should be processed only once
    const count = await countProcessedEvents(event.eventId);
    expect(count).toBe(1);
  });
  
  it('should send failed events to DLQ', async () => {
    // Mock processing error
    jest.spyOn(service, 'processEvent').mockRejectedValue(
      new Error('Processing failed')
    );
    
    await kafkaService.publishEvent('user-events', event);
    await sleep(1000);
    
    // Verify DLQ
    const dlqMessages = await consumeDLQ('user-events-dlq');
    expect(dlqMessages).toHaveLength(1);
    expect(dlqMessages[0].error.message).toBe('Processing failed');
  });
});
```

---

## 🐛 Troubleshooting

### Consumer не получает сообщения

```bash
# Проверь consumer lag
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group user-service-group --describe

# Должен показывать lag = 0 если всё обработано
```

### Сообщения накапливаются в DLQ

```bash
# Посмотри что в DLQ
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic user-events-dlq --from-beginning

# Исправь проблему в коде
# Потом можно replay из DLQ
```

### Дубликаты событий

```bash
# Проверь processed_events table
SELECT * FROM processed_events 
WHERE event_id = 'evt-123'
ORDER BY processed_at DESC;

# Должна быть UNIQUE constraint
```

### Kafka недоступен

```bash
# Проверь Kafka
docker-compose ps kafka

# Проверь connectivity
telnet localhost 9092

# Логи Kafka
docker-compose logs kafka
```

---

## 📚 Дополнительные ресурсы

- [Event Catalog](./EVENT_CATALOG.md) - Полный список событий
- [Event Schema Standard](./EVENT_SCHEMA_STANDARD.md) - Формат событий
- [Idempotency](./IDEMPOTENCY.md) - Exactly-once processing
- [DLQ Handling](./DLQ_HANDLING.md) - Dead Letter Queue
- [Kafka Documentation](https://kafka.apache.org/documentation/)

---

**Последнее обновление:** 2025-10-06
