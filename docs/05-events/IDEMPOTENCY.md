# Event Idempotency

**Exactly-Once Processing гарантии**

---

## 🎯 Проблема

Kafka гарантирует **at-least-once delivery**. События могут быть доставлены несколько раз:
- Network retry
- Consumer restart  
- Rebalancing
- Manual offset rewind

**Без idempotency** одно событие может обработаться 2+ раза, что приведет к:
- Дублирующим записям в БД
- Повторной отправке email
- Некорректным счетчикам

**Решение:** Event Idempotency через `processed_events` table с UNIQUE constraint.

---

## 🔧 Реализация

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
  
CREATE INDEX idx_processed_events_processed_at
  ON processed_events(processed_at);
```

**Важно:** UNIQUE constraint на `(event_id, service_name)` гарантирует, что один сервис не обработает одно событие дважды.

---

### EventIdempotencyService

```typescript
@Injectable()
export class EventIdempotencyService {
  constructor(
    @InjectRepository(ProcessedEvent)
    private readonly repository: Repository<ProcessedEvent>,
  ) {}
  
  async isProcessed(eventId: string, serviceName: string): Promise<boolean> {
    const event = await this.repository.findOne({
      where: { eventId, serviceName }
    });
    return !!event;
  }
  
  async markAsProcessed(
    eventId: string,
    serviceName: string,
    topic: string
  ): Promise<void> {
    try {
      await this.repository.save({
        eventId,
        serviceName,
        topic,
        processedAt: new Date()
      });
    } catch (error) {
      // UNIQUE constraint violation = уже обработано
      if (error.code === '23505') {
        // PostgreSQL unique violation code
        return; // Уже обработано, всё ок
      }
      throw error;
    }
  }
}
```

---

## 🔄 Processing Flow

```typescript
// В Kafka consumer handler
await consumer.run({
  autoCommit: false,  // Manual commits!
  eachBatch: async ({ batch, resolveOffset, commitOffsetsIfNecessary }) => {
    for (const message of batch.messages) {
      const event = JSON.parse(message.value.toString());
      
      // 1️⃣ Проверяем идемпотентность
      const isProcessed = await this.idempotencyService.isProcessed(
        event.eventId,
        'user-service'
      );
      
      if (isProcessed) {
        // Уже обработано - skip
        resolveOffset(message.offset);
        await commitOffsetsIfNecessary();
        continue;
      }
      
      // 2️⃣ Обрабатываем событие + mark as processed (в транзакции)
      await this.dataSource.transaction(async (manager) => {
        // Бизнес-логика
        await this.handleUserCreated(event, manager);
        
        // Отмечаем как обработанное
        await manager.save(ProcessedEvent, {
          eventId: event.eventId,
          serviceName: 'user-service',
          topic: 'user-events'
        });
      });
      
      // 3️⃣ Коммитим offset ПОСЛЕ successful processing
      resolveOffset(message.offset);
      await commitOffsetsIfNecessary();
    }
  }
});
```

---

## ✅ Гарантии

### Exactly-Once Processing
- ✅ Дубликаты автоматически игнорируются
- ✅ UNIQUE constraint предотвращает race conditions
- ✅ Транзакции обеспечивают атомарность (обработка + mark = одна операция)
- ✅ Manual offset commits гарантируют commit только после обработки

### Race Condition Protection
```
Consumer 1                     Consumer 2
├─ Получил event evt-123       ├─ Получил event evt-123
├─ Проверил: not processed     ├─ Проверил: not processed
├─ Начал обработку             ├─ Начал обработку
├─ INSERT processed_events ✅  ├─ INSERT processed_events ❌
└─ Commit offset               │  (UNIQUE constraint violation)
                               └─ Rollback, skip event
```

---

## 📊 Monitoring

### Проверка дубликатов

```sql
-- Найти события обработанные несколько раз (не должно быть!)
SELECT event_id, service_name, COUNT(*) as count
FROM processed_events
GROUP BY event_id, service_name
HAVING COUNT(*) > 1;
```

### Cleanup старых событий

```sql
-- Удалить события старше 30 дней
DELETE FROM processed_events
WHERE processed_at < NOW() - INTERVAL '30 days';
```

Рекомендуется запускать cleanup job регулярно (например, раз в день).

---

## 🐛 Troubleshooting

### Событие не обрабатывается

**Проверь:**
```sql
SELECT * FROM processed_events
WHERE event_id = 'evt-123'
AND service_name = 'user-service';
```

Если запись есть - событие уже обработано. Если нужно reprocess:
```sql
DELETE FROM processed_events
WHERE event_id = 'evt-123'
AND service_name = 'user-service';

-- Replay из Kafka
```

### UNIQUE constraint violation в логах

**Это норма!** Означает что событие пришло второй раз и было корректно проигнорировано.

Логируется как `debug` level:
```
[DEBUG] Event evt-123 already processed, skipping
```

---

## 📚 Дополнительные ресурсы

- [Kafka Configuration](./KAFKA_CONFIGURATION.md) - Manual offset commits
- [Event Catalog](./EVENT_CATALOG.md) - Все события системы
- [TypeORM Migrations](../06-database/MIGRATIONS.md) - Database setup

---

**Последнее обновление:** 2025-10-06
