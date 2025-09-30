# 📊 STRUCTURED LOGGING ДЛЯ GRAFANA/LOKI

## ✅ **ФИНАЛЬНАЯ КОНФИГУРАЦИЯ**

### **Решение:**
```typescript
// apps/api-gateway/src/logger/logger.service.ts

// Формат для ФАЙЛОВ - чистый JSON для Loki
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json() // ← Чистый JSON
);

// Формат для КОНСОЛИ - красивый вывод
const consoleFormat = winston.format.combine(
  winston.format.colorize(), // ← Зеленый цвет
  winston.format.timestamp(),
  winston.format.printf(({ level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 
      ? `\n${JSON.stringify(meta, null, 2)}` 
      : '';
    return `[${level}] ${service} - ${message}${metaStr}`;
  })
);

// Transports с явными форматами
transports: [
  new winston.transports.Console({
    level: 'debug',
    format: consoleFormat // ← Красиво в консоли
  }),
  new winston.transports.File({
    filename: 'logs/api-gateway.log',
    level: 'debug',
    format: fileFormat // ← JSON в файл
  })
]
```

**Результат:**
- ✅ Console: Красивые зеленые логи с форматированием
- ✅ File: Чистый JSON для Loki
- ✅ ВСЕ логи (debug, info, warn, error) попадают везде

---

## ✅ **ЧТО ИСПРАВЛЕНО**

### **Проблема:**
Объекты и многострочные логи из `console.log()` не попадали в Grafana Loki правильно. В терминале видно красиво:
```
🔍 OIDC Discovery Debug: {
  issuerUrl: 'http://localhost:8090/realms/ai-video-interview',
  discoveryUrl: '...',
  clientId: 'ai-video-interview-app'
}
```

Но в Grafana только: `JWT Refresh Guard: Attempting token verification...`

### **Причина:**
- `console.log()` выводит напрямую в stdout, минуя Winston
- Winston для Console использует `simple()` формат (красиво в терминале)
- Winston для файлов использует JSON формат (правильно для Loki)
- Объекты не сериализуются правильно если логировать через console.log

---

## 🔧 **РЕШЕНИЕ**

### **1. Добавлены методы в LoggerService**

```typescript
// apps/api-gateway/src/logger/logger.service.ts

/**
 * Логирует структурированные данные с правильной сериализацией
 */
debugObject(message: string, data: Record<string, any>, context?: LogContext) {
  this.logger.debug(message, {
    ...context,
    data: data // Winston автоматически сериализует в JSON
  });
}

infoObject(message: string, data: Record<string, any>, context?: LogContext) {
  this.logger.info(message, {
    ...context,
    data: data
  });
}
```

### **2. Заменены console.log на LoggerService**

**До:**
```typescript
console.log('🔍 OIDC Discovery Debug:', {
  issuerUrl: this.issuerUrl,
  discoveryUrl: this.discoveryUrl,
  clientId: this.clientId,
  clientSecretPresent: !!this.clientSecret
});
```

**После:**
```typescript
this.logger.debugObject('OIDC Discovery: Fetching configuration', {
  issuerUrl: this.issuerUrl,
  discoveryUrl: this.discoveryUrl,
  clientId: this.clientId,
  clientSecretPresent: !!this.clientSecret
});
```

### **3. Файлы где заменены console.log:**
- ✅ `auth/oidc.service.ts` - OIDC discovery логи
- ✅ `auth/cookie.service.ts` - Cookie debug логи
- ✅ Остальные файлы (main.ts, tracing.ts) - оставлены console.log для startup messages

---

## 📊 **КАК ТЕПЕРЬ ЛОГИ В GRAFANA**

### **В Loki файле (api-gateway.log):**
```json
{
  "timestamp": "2025-09-30 20:47:18.385",
  "level": "DEBUG",
  "service": "api-gateway",
  "message": "OIDC Discovery: Fetching configuration",
  "data": {
    "issuerUrl": "http://localhost:8090/realms/ai-video-interview",
    "discoveryUrl": "http://localhost:8090/realms/ai-video-interview/.well-known/openid-configuration",
    "clientId": "ai-video-interview-app",
    "clientSecretPresent": false
  },
  "environment": "development",
  "version": "1.0.0"
}
```

### **В Grafana Explore:**

**Query:**
```logql
{service="api-gateway"} | json | level="DEBUG" | line_format "{{.message}}"
```

**Результат:**
```
2025-09-30 20:47:18  OIDC Discovery: Fetching configuration
```

**Детали (JSON):**
```json
{
  "message": "OIDC Discovery: Fetching configuration",
  "data": {
    "issuerUrl": "...",
    "discoveryUrl": "...",
    "clientId": "ai-video-interview-app"
  }
}
```

---

## 🔍 **GRAFANA QUERIES**

### **1. Все debug логи с данными:**
```logql
{service="api-gateway"} | json | level="DEBUG" | data!=""
```

### **2. OIDC Discovery логи:**
```logql
{service="api-gateway"} | json | message=~"OIDC.*"
```

### **3. Cookie debug логи:**
```logql
{service="api-gateway"} | json | message=~"Cookies.*"
```

### **4. Структурированные данные как таблица:**
```logql
{service="api-gateway"} 
  | json 
  | level="DEBUG"
  | line_format "{{.timestamp}} {{.message}} | issuerUrl={{.data_issuerUrl}} clientId={{.data_clientId}}"
```

### **5. Фильтр по полям внутри data:**
```logql
{service="api-gateway"} 
  | json 
  | data_clientId="ai-video-interview-app"
```

---

## 📝 **BEST PRACTICES**

### **✅ ИСПОЛЬЗУЙ:**

**1. LoggerService методы для структурированных логов:**
```typescript
// Для debug с объектами
this.logger.debugObject('Operation name', {
  key1: value1,
  key2: value2
});

// Для info с объектами
this.logger.infoObject('Event happened', {
  userId: user.id,
  action: 'login'
});

// Для простых сообщений
this.logger.debug('Simple message', { userId: '123' });
this.logger.info('User logged in');
this.logger.error('Something failed', error, { context: 'auth' });
```

**2. Специальные методы для категорий:**
```typescript
// Auth logs
this.logger.authLog('login_success', {
  userId: user.id,
  ip: req.ip
});

// HTTP logs
this.logger.httpLog('POST', '/api/users', 200, 150, {
  userId: '123'
});

// Kafka logs
this.logger.kafkaLog('publish', 'user.events', true, {
  eventId: event.id
});
```

### **❌ НЕ ИСПОЛЬЗУЙ:**

```typescript
// ❌ BAD: console.log с объектами
console.log('Debug:', { data: something });

// ❌ BAD: многострочный вывод
console.log(`
  User: ${user}
  Action: ${action}
`);

// ❌ BAD: JSON.stringify вручную
console.log(JSON.stringify(object));
```

---

## 🎨 **GRAFANA DASHBOARD SETUP**

### **Panel 1: Debug Logs Table**
```
Query: {service="api-gateway"} | json | level="DEBUG"
Visualization: Table
Columns: timestamp, message, data.*
```

### **Panel 2: Auth Events**
```
Query: {service="api-gateway"} | json | category="authentication"
Visualization: Logs
```

### **Panel 3: Structured Data Inspector**
```
Query: {service="api-gateway"} | json | data!="" | line_format "{{.data}}"
Visualization: JSON
```

---

## 🐛 **TROUBLESHOOTING**

### **Проблема: Логи все еще не структурированы**

**Проверь:**
1. Winston пишет в JSON формат в файл:
   ```bash
   tail -f logs/api-gateway.log | jq
   ```

2. Promtail читает правильный файл:
   ```yaml
   # docker-compose.yml
   promtail:
     volumes:
       - ./logs:/logs:ro
   ```

3. Loki получает логи:
   ```
   Grafana → Explore → Loki → {service="api-gateway"}
   ```

### **Проблема: Нет поля data в Grafana**

**Причина:** Winston не сериализует nested objects правильно

**Решение:** Используй `debugObject()` метод, который правильно структурирует данные

---

## 📊 **EXAMPLE QUERIES ДЛЯ DEBUGGING**

### **1. Find all errors with context:**
```logql
{service="api-gateway"} 
  | json 
  | level="ERROR"
  | line_format "{{.timestamp}} {{.message}} | Error: {{.error_message}} | Context: {{.context}}"
```

### **2. Trace request flow:**
```logql
{service="api-gateway"} 
  | json 
  | traceId="abc-123"
  | line_format "{{.timestamp}} [{{.level}}] {{.message}}"
```

### **3. Performance slow queries:**
```logql
{service="api-gateway"} 
  | json 
  | category="performance"
  | duration > 1000
```

### **4. Auth failures:**
```logql
{service="api-gateway"} 
  | json 
  | category="authentication"
  | level="ERROR"
```

---

## ✅ **ИТОГО**

**Что изменилось:**
- ❌ console.log() с объектами → ✅ logger.debugObject()
- ❌ Неструктурированные логи → ✅ JSON с полями
- ❌ Нет данных в Grafana → ✅ Полная информация видна

**Результат:**
- 🎯 Все debug данные попадают в Loki
- 🎯 Можно фильтровать по любым полям
- 🎯 Структурированный поиск работает
- 🎯 Dashboards могут показывать детали

**Теперь в Grafana ты видишь ВСЕ данные, которые раньше были только в терминале! 🚀**
