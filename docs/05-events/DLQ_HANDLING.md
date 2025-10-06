# Dead Letter Queue (DLQ) Handling

**Обработка failed messages**

---

## 🎯 Когда событие попадает в DLQ

События отправляются в Dead Letter Queue при:

1. **Processing Error** - exception во время обработки
2. **Max Retries Exceeded** - превышено 3 попытки
3. **Validation Failed** - invalid event schema
4. **Timeout** - обработка превысила таймаут
5. **Database Error** - connection lost, constraint violation

---

## 📋 DLQ Topics

```
auth-events-dlq          # Auth events failures
user-events-dlq          # User events failures
interview-events-dlq     # Interview events failures
media-events-dlq         # Media events failures
```

**Retention:** 30 days (дольше чем основные topics)

---

## 🔧 DLQ Message Format

```json
{
  "originalEvent": {
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "eventType": "user.created",
    "timestamp": 1728212400000,
    "version": "1.0",
    "source": "user-service",
    "payload": {
      "userId": "user-123",
      "email": "user@example.com"
    }
  },
  "error": {
    "message": "Database connection failed",
    "stack": "Error: Connection timeout\n  at ...",
    "code": "ECONNREFUSED",
    "timestamp": 1728212460000
  },
  "metadata": {
    "originalTopic": "user-events",
    "partition": 0,
    "offset": 12345,
    "serviceName": "user-service",
    "retryCount": 3,
    "failedAt": 1728212460000,
    "dlqTopic": "user-events-dlq"
  }
}
```

---

## 🚀 KafkaService DLQ Logic

```typescript
async sendToDLQ(event: any, error: Error, metadata: any): Promise<void> {
  try {
    const dlqTopic = `${metadata.topic}-dlq`;
    const dlqMessage = {
      originalEvent: event,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        timestamp: Date.now()
      },
      metadata: {
        ...metadata,
        failedAt: Date.now(),
        dlqTopic
      }
    };
    
    await this.producer.send({
      topic: dlqTopic,
      messages: [{
        key: event.eventId,
        value: JSON.stringify(dlqMessage)
      }]
    });
    
    this.logger.kafkaLog('send_to_dlq', dlqTopic, true, {
      eventId: event.eventId,
      originalTopic: metadata.topic,
      errorMessage: error.message
    });
  } catch (dlqError) {
    // Если не можем отправить в DLQ - критическая ошибка!
    this.logger.error('Failed to send message to DLQ', dlqError, {
      eventId: event.eventId,
      originalError: error.message
    });
  }
}
```

---

## 🔄 Retry Strategy

### Automatic Retries (before DLQ)

```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  try {
    await this.processEvent(event);
    break; // Success
  } catch (error) {
    if (attempt === MAX_RETRIES) {
      // Last attempt failed - send to DLQ
      await this.sendToDLQ(event, error, {
        topic: 'user-events',
        partition: 0,
        offset: message.offset,
        serviceName: this.serviceName,
        retryCount: attempt
      });
    } else {
      // Retry with exponential backoff
      await this.sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
    }
  }
}
```

---

## 🔍 Monitoring DLQ

### View DLQ Messages

```bash
# Все сообщения в DLQ
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic user-events-dlq \
  --from-beginning \
  --property print.key=true \
  --property print.timestamp=true

# Count messages in DLQ
kafka-run-class kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 \
  --topic user-events-dlq \
  --time -1
```

### Query через SQL (if stored)

```sql
-- Top errors in DLQ
SELECT 
  error->>'message' as error_message,
  COUNT(*) as count
FROM dlq_messages
WHERE dlq_topic = 'user-events-dlq'
GROUP BY error->>'message'
ORDER BY count DESC
LIMIT 10;

-- Recent DLQ messages
SELECT *
FROM dlq_messages
WHERE dlq_topic = 'user-events-dlq'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔄 DLQ Replay Strategies

### Strategy 1: Manual Fix + Republish

```bash
# 1. Найди проблему в DLQ
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic user-events-dlq --from-beginning > dlq-messages.json

# 2. Исправь код
# 3. Republish в основной topic

kafka-console-producer --bootstrap-server localhost:9092 \
  --topic user-events \
  --property "parse.key=true" \
  --property "key.separator=:"

# Вставь: eventId:{"eventId":"...","eventType":"..."}
```

### Strategy 2: Automated Replay Service

```typescript
@Injectable()
export class DLQReplayService {
  async replayFromDLQ(
    dlqTopic: string,
    fromTimestamp: number,
    toTimestamp: number
  ): Promise<void> {
    const messages = await this.consumeDLQMessages(dlqTopic, fromTimestamp, toTimestamp);
    
    for (const dlqMessage of messages) {
      const originalTopic = dlqMessage.metadata.originalTopic;
      
      try {
        // Republish в основной topic
        await this.kafkaService.publishEvent(
          originalTopic,
          dlqMessage.originalEvent
        );
        
        this.logger.info('DLQ message replayed', {
          eventId: dlqMessage.originalEvent.eventId,
          dlqTopic,
          originalTopic
        });
      } catch (error) {
        this.logger.error('Failed to replay DLQ message', error, {
          eventId: dlqMessage.originalEvent.eventId
        });
      }
    }
  }
}
```

### Strategy 3: Fix in Place

```typescript
// Для transient errors (DB connection lost)
// Просто перезапусти consumer - он обработает DLQ автоматически

@Injectable()
export class DLQConsumerService {
  async processDLQMessages(): Promise<void> {
    await this.kafkaService.subscribe(
      'user-events-dlq',
      'dlq-replay-group',
      async (message) => {
        const dlqMessage = JSON.parse(message.value.toString());
        
        // Попробуй обработать заново
        try {
          await this.processEvent(dlqMessage.originalEvent);
          
          // Success - можно удалить из DLQ (commit offset)
          this.logger.info('DLQ message processed successfully', {
            eventId: dlqMessage.originalEvent.eventId
          });
        } catch (error) {
          // Still failing - оставляем в DLQ
          this.logger.error('DLQ message still failing', error);
        }
      }
    );
  }
}
```

---

## 📊 DLQ Alerts

### Prometheus Metrics

```typescript
// Экспортируй DLQ metrics
kafka_dlq_messages_total{topic="user-events-dlq"} 5
kafka_dlq_messages_age_seconds{topic="user-events-dlq"} 3600
```

### Alert Rules

```yaml
# Alert если в DLQ больше 10 сообщений
- alert: HighDLQVolume
  expr: kafka_dlq_messages_total > 10
  for: 5m
  annotations:
    summary: "High volume of messages in DLQ"
    description: "{{ $value }} messages in DLQ topic {{ $labels.topic }}"

# Alert если сообщения в DLQ старше 1 часа
- alert: StaleDLQMessages
  expr: kafka_dlq_messages_age_seconds > 3600
  for: 10m
  annotations:
    summary: "Stale messages in DLQ"
    description: "Messages in DLQ are older than 1 hour"
```

---

## 🐛 Common DLQ Scenarios

### Scenario 1: Database Connection Lost

**Причина:** Database unavailable during processing

**Решение:**
1. Проверь database connectivity
2. Restart consumer - automatic retry должен сработать
3. Если проблема persists - replay из DLQ после fix

### Scenario 2: Invalid Event Schema

**Причина:** Event не соответствует schema (missing fields)

**Решение:**
1. Исправь producer code
2. Manual fix events в DLQ (добавь missing fields)
3. Republish

### Scenario 3: Business Logic Error

**Причина:** Validation failed (например, duplicate email)

**Решение:**
1. Проверь почему validation failed
2. Если valid case - fix data и republish
3. Если invalid event - просто удали из DLQ

### Scenario 4: External Service Timeout

**Причина:** External API call timeout (например, Keycloak)

**Решение:**
1. Проверь external service health
2. Increase timeout в config
3. Automatic retry should handle transient failures

---

## 📚 Best Practices

### ✅ DO:

1. **Monitor DLQ regularly** - setup alerts
2. **Investigate root cause** - don't just replay blindly
3. **Keep DLQ retention high** (30+ days)
4. **Log DLQ events** с full context
5. **Test DLQ handling** в integration tests

### ❌ DON'T:

1. **Ignore DLQ** - это технический долг
2. **Auto-replay without investigation** - может повторить проблему
3. **Delete from DLQ** без понимания причины
4. **Skip validation** при replay

---

## 📚 Дополнительные ресурсы

- [Kafka Configuration](./KAFKA_CONFIGURATION.md) - DLQ setup
- [Event Catalog](./EVENT_CATALOG.md) - All events
- [Idempotency](./IDEMPOTENCY.md) - Exactly-once processing

---

**Последнее обновление:** 2025-10-06
