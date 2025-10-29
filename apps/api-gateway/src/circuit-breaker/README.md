# Circuit Breaker Implementation

## 📋 Overview

Circuit Breaker pattern защищает API Gateway от cascading failures при недоступности downstream сервисов.

---

## 🎯 States

Circuit Breaker имеет 3 состояния:

```
┌─────────────┐
│   CLOSED    │  ← Нормальная работа
│  (работает) │     Все запросы проходят
└──────┬──────┘
       │ Failures ≥ threshold
       ↓
┌─────────────┐
│    OPEN     │  ← Сервис недоступен  
│ (отключен)  │     Instant fail (без timeout)
└──────┬──────┘
       │ Reset timeout истёк
       ↓
┌─────────────┐
│ HALF-OPEN   │  ← Проверка восстановления
│  (проверка) │     Пропускаем test requests
└──────┬──────┘
       │
       ├─ Success ≥ threshold → CLOSED
       └─ Failure → OPEN
```

---

## 🏗️ Architecture

### **CircuitBreaker** (core class)

```typescript
const circuit = new CircuitBreaker({
  failureThreshold: 5,        // Открыть после 5 ошибок
  successThreshold: 2,         // Закрыть после 2 успехов
  timeout: 3000,               // Timeout для запросов
  resetTimeout: 60000,         // Через 60 сек попытаться восстановиться
  rollingWindow: 10000,        // Считаем ошибки за последние 10 сек
  name: 'user-service',
});

// Выполнить через circuit breaker
const result = await circuit.execute(() => fetchUser(userId));
```

### **CircuitBreakerRegistry** (management service)

Управляет всеми Circuit Breakers в приложении:

```typescript
@Injectable()
export class CircuitBreakerRegistry {
  // Создаёт или возвращает существующий circuit
  getOrCreate(name: string, options: CircuitBreakerOptions): CircuitBreaker;
  
  // Health check для всех circuits
  getHealthStatus(): { healthy: boolean; circuits: Record<string, any> };
  
  // Собирает метрики каждые 5 секунд
  private startMetricsCollection(): void;
}
```

---

## 🔧 Integration

### **BaseServiceProxy**

Circuit Breaker интегрирован в базовый proxy:

```typescript
export abstract class BaseServiceProxy {
  protected circuitBreakerOptions = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 5000,
    resetTimeout: 60000,
  };

  private circuitBreaker: CircuitBreaker;

  // Все HTTP запросы проходят через circuit breaker
  private async executeRequest<T>(
    method: string,
    path: string,
    data?: any,
    options?: ProxyRequestOptions,
  ): Promise<T> {
    if (options?.bypassCircuitBreaker) {
      return this.executeRequestDirect(...);
    }
    
    return await this.circuitBreaker.execute(() =>
      this.executeRequestDirect(...)
    );
  }
}
```

### **Service-specific configuration**

Каждый сервис может настроить свой circuit:

```typescript
// UserServiceProxy
protected circuitBreakerOptions = {
  failureThreshold: 5,
  timeout: 3000,        // Быстрые операции
  resetTimeout: 30000,  // 30 секунд
};

// InterviewServiceProxy
protected circuitBreakerOptions = {
  failureThreshold: 3,  // Более критично
  timeout: 10000,       // Медленные операции
  resetTimeout: 60000,  // 1 минута
};
```

---

## 📊 Metrics

Circuit Breaker автоматически собирает Prometheus метрики:

```promql
# Состояние circuit (0=CLOSED, 1=OPEN, 2=HALF_OPEN)
circuit_breaker_state{circuit="user-service"}

# Количество недавних ошибок
circuit_breaker_recent_failures{circuit="user-service"}

# Переходы между состояниями
circuit_breaker_state_transitions_total{circuit, from_state, to_state}
```

### **Grafana Queries:**

```promql
# Circuit открыт?
circuit_breaker_state{circuit="user-service"} == 1

# Процент времени в OPEN состоянии
avg_over_time(circuit_breaker_state{circuit="user-service"}[5m]) > 0.5

# Rate переходов в OPEN
rate(circuit_breaker_state_transitions_total{to_state="OPEN"}[5m])
```

---

## 🩺 Health Checks

### **Endpoints:**

```bash
# Общий health
GET /health
Response:
{
  "status": "healthy" | "degraded",
  "timestamp": "2025-01-04T20:15:00Z",
  "uptime": 3600,
  "circuits": {
    "user-service": {
      "state": "CLOSED",
      "failureCount": 0,
      "recentFailures": 0
    },
    "interview-service": {
      "state": "OPEN",
      "failureCount": 5,
      "recentFailures": 5,
      "nextAttempt": 1704397500000
    }
  }
}

# Kubernetes readiness
GET /health/ready

# Kubernetes liveness
GET /health/live

# Детали circuits
GET /health/circuits
```

---

## 🎨 Usage Examples

### **1. Normal usage (автоматический)**

```typescript
// Circuit Breaker работает автоматически
const user = await userServiceProxy.getUser(userId);
// Если User Service недоступен, circuit откроется после 5 ошибок
```

### **2. Bypass circuit breaker (критичные операции)**

```typescript
// Для операций которые ДОЛЖНЫ пройти
const result = await userServiceProxy.updateCriticalData(data, {
  bypassCircuitBreaker: true,
});
```

### **3. Graceful degradation**

```typescript
async getUserDashboard(userId: string) {
  const [userResult, interviewsResult] = await Promise.allSettled([
    userServiceProxy.getUser(userId),
    interviewServiceProxy.getUserInterviews(userId),
  ]);

  return {
    user: userResult.status === 'fulfilled' 
      ? userResult.value 
      : { email: 'unknown' }, // Fallback
    interviews: interviewsResult.status === 'fulfilled'
      ? interviewsResult.value
      : [], // Empty fallback
  };
}
```

### **4. Manual circuit management (тесты)**

```typescript
// Сбросить circuit
circuitBreakerRegistry.get('user-service')?.reset();

// Получить статус
const stats = circuitBreakerRegistry.get('user-service')?.getStats();
console.log(stats.state); // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
```

---

## 🔥 Real-world Scenario

### **User Service падает:**

```
10:00:00 - User Service падает (database connection lost)

10:00:01 - Request 1: try → timeout 3s → fail
10:00:04 - Request 2: try → timeout 3s → fail
10:00:07 - Request 3: try → timeout 3s → fail
10:00:10 - Request 4: try → timeout 3s → fail
10:00:13 - Request 5: try → timeout 3s → fail

10:00:16 - Circuit OPENED (threshold reached)
           LOG: "Circuit breaker 'user-service' OPENED"
           METRIC: circuit_breaker_state{circuit="user-service"} = 1

10:00:16 - Request 6: instant fail (0ms)
10:00:17 - Request 7: instant fail (0ms)
... (requests 8-1000: все instant fail)

10:01:16 - Circuit → HALF_OPEN (resetTimeout = 60s)
           LOG: "Circuit breaker 'user-service' HALF_OPEN (testing recovery)"
           
10:01:16 - Test request 1: try → success!
10:01:17 - Test request 2: try → success!

10:01:17 - Circuit CLOSED (successThreshold reached)
           LOG: "Circuit breaker 'user-service' CLOSED (recovered)"
           METRIC: circuit_breaker_state{circuit="user-service"} = 0

10:01:18+ - Система работает нормально
```

**Бенефиты:**
- ✅ Вместо 1000 × 15s = 15,000s ожидания → instant fail
- ✅ API Gateway не исчерпывает ресурсы
- ✅ Пользователи видят быстрый error response
- ✅ Автоматическое восстановление без участия человека

---

## 🧪 Testing

```typescript
describe('CircuitBreaker', () => {
  it('should open after threshold failures', async () => {
    const circuit = new CircuitBreaker({
      failureThreshold: 3,
      timeout: 1000,
    });

    // 3 failures
    for (let i = 0; i < 3; i++) {
      try {
        await circuit.execute(() => Promise.reject(new Error('fail')));
      } catch {}
    }

    expect(circuit.getState()).toBe(CircuitState.OPEN);
  });

  it('should fail fast when open', async () => {
    // ... circuit is open
    const start = Date.now();
    try {
      await circuit.execute(() => Promise.resolve('ok'));
    } catch (error) {
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10); // Instant fail
      expect(error).toBeInstanceOf(CircuitBreakerError);
    }
  });
});
```

---

## 🚨 Alerts

### **Grafana Alerts:**

```yaml
# Alert when circuit opens
- alert: CircuitBreakerOpen
  expr: circuit_breaker_state == 1
  for: 1m
  annotations:
    summary: "Circuit breaker {{ $labels.circuit }} is OPEN"
    description: "Service {{ $labels.circuit }} is unavailable"

# Alert when circuit flapping (open/close repeatedly)
- alert: CircuitBreakerFlapping
  expr: rate(circuit_breaker_state_transitions_total[5m]) > 0.5
  for: 5m
  annotations:
    summary: "Circuit breaker {{ $labels.circuit }} is flapping"
    description: "Circuit is opening/closing repeatedly, investigate service stability"
```

---

## 📚 Configuration Guide

### **Как выбрать параметры:**

1. **failureThreshold:**
   - Быстрые сервисы: 5-10
   - Медленные сервисы: 3-5
   - Критичные сервисы: 2-3

2. **timeout:**
   - Fast operations (DB queries): 1-3s
   - Medium operations (HTTP calls): 3-5s
   - Slow operations (AI/ML): 10-30s

3. **resetTimeout:**
   - Dev/staging: 30s (быстрое восстановление)
   - Production: 60-120s (избегаем flapping)

4. **successThreshold:**
   - Обычно: 2-3
   - Нестабильные сервисы: 5-10

---

## 🎯 Best Practices

✅ **DO:**
- Используй Circuit Breaker для всех inter-service calls
- Логируй state transitions
- Мониторь метрики в Grafana
- Настраивай alerts на OPEN состояние
- Implement graceful degradation

❌ **DON'T:**
- Не используй для in-process calls
- Не bypass circuit breaker без веской причины
- Не игнорируй OPEN alerts
- Не ставь слишком низкий failureThreshold (flapping)
- Не забывай про fallback logic

---

## 📖 Related Documentation

- [Service Proxies](../proxies/README.md)
- [Metrics & Monitoring](../metrics/README.md)
- [Health Checks](../health/README.md)
