# Service Proxies

## 📋 Overview

HTTP клиенты для вызовов других микросервисов с built-in:
- **Retry logic** (exponential backoff)
- **Timeout management**
- **Error handling**
- **Metrics collection**
- **Logging**

---

## 🏗️ Architecture

```
proxies/
├── base/
│   └── base-service-proxy.ts     # Базовый класс для всех proxies
├── user-service.proxy.ts         # User Service HTTP client
├── interview-service.proxy.ts    # Interview Service HTTP client
└── index.ts                       # Public exports
```

---

## 🎯 BaseServiceProxy

Абстрактный класс с общей логикой для HTTP вызовов.

### **Features:**

1. **HTTP Methods:**
   - `get<T>(path, options?)`
   - `post<T>(path, data?, options?)`
   - `put<T>(path, data?, options?)`
   - `delete<T>(path, options?)`
   - `patch<T>(path, data?, options?)`

2. **Retry Logic:**
   - Exponential backoff (1s → 2s → 4s → max 10s)
   - Не retry на 4xx ошибках (client errors)
   - Configurable retries per request

3. **Error Handling:**
   - Custom `ServiceProxyError` with service name, status code, details
   - Network error detection
   - HTTP error normalization

4. **Metrics:**
   - Success/error counters
   - Duration histograms
   - Per-service, per-method tracking

5. **Logging:**
   - Request/response logging
   - Error logging
   - Retry attempt logging

---

## 🔧 UserServiceProxy

HTTP клиент для User Service.

### **Methods:**

```typescript
// Получить пользователя
await userServiceProxy.getUser(userId);

// Получить профиль
await userServiceProxy.getUserProfile(userId);

// Обновить профиль
await userServiceProxy.updateUserProfile(userId, { bio: 'New bio' });

// Резервировать квоту
await userServiceProxy.reserveInterviewQuota(userId);

// Освободить квоту
await userServiceProxy.releaseQuota(userId, reservationId);

// Статистика
await userServiceProxy.getUserStats(userId);

// Проверить existence
await userServiceProxy.checkUserExists(email);

// Список пользователей (admin)
await userServiceProxy.listUsers({ page: 1, limit: 20, search: 'john' });
```

### **Configuration:**

```bash
# .env
USER_SERVICE_URL=http://localhost:3003
```

---

## 🎬 InterviewServiceProxy

HTTP клиент для Interview Service.

### **Methods:**

```typescript
// Создать интервью
await interviewServiceProxy.createInterview({
  userId,
  title: 'Senior Developer Interview',
  settings: {
    duration: 3600,
    difficulty: 'hard',
    recordVideo: true,
    recordAudio: true,
    allowRetakes: false,
  },
});

// Получить интервью
await interviewServiceProxy.getInterview(interviewId);

// Список интервью пользователя
await interviewServiceProxy.getUserInterviews(userId, {
  limit: 10,
  status: 'active',
});

// Обновить интервью
await interviewServiceProxy.updateInterview(interviewId, { title: 'New Title' });

// Удалить интервью
await interviewServiceProxy.deleteInterview(interviewId);

// Кандидаты
await interviewServiceProxy.getCandidates(interviewId);
await interviewServiceProxy.addCandidate(interviewId, {
  email: 'candidate@example.com',
  firstName: 'John',
  lastName: 'Doe',
});

// Статистика
await interviewServiceProxy.getInterviewStats(interviewId);
await interviewServiceProxy.getUserInterviewStats(userId);

// Управление статусом
await interviewServiceProxy.publishInterview(interviewId);
await interviewServiceProxy.pauseInterview(interviewId);
await interviewServiceProxy.archiveInterview(interviewId);
```

### **Configuration:**

```bash
# .env
INTERVIEW_SERVICE_URL=http://localhost:3004
```

---

## 🎨 Usage Example

```typescript
import { Injectable } from '@nestjs/common';
import { UserServiceProxy, InterviewServiceProxy } from '../proxies';

@Injectable()
export class DashboardAggregator {
  constructor(
    private readonly userServiceProxy: UserServiceProxy,
    private readonly interviewServiceProxy: InterviewServiceProxy,
  ) {}

  async getUserDashboard(userId: string) {
    // Параллельные запросы
    const [user, interviews, stats] = await Promise.all([
      this.userServiceProxy.getUser(userId),
      this.interviewServiceProxy.getUserInterviews(userId, { limit: 10 }),
      this.userServiceProxy.getUserStats(userId),
    ]);

    return {
      user,
      interviews: interviews.interviews,
      stats,
    };
  }
}
```

---

## 📊 Metrics

Service Proxies автоматически собирают метрики:

```promql
# Total calls
service_calls_total{service="user-service", method="GET", status="success"}

# Duration
service_call_duration_milliseconds_bucket{service="user-service", method="GET"}
```

### **Grafana Dashboard:**

```
Rate of service calls: rate(service_calls_total[5m])
Error rate: sum(rate(service_calls_total{status="error"}[5m])) / sum(rate(service_calls_total[5m]))
P99 latency: histogram_quantile(0.99, service_call_duration_milliseconds_bucket)
```

---

## 🔒 Error Handling

```typescript
try {
  const user = await userServiceProxy.getUser(userId);
} catch (error) {
  if (error instanceof ServiceProxyError) {
    console.log(error.serviceName); // 'user-service'
    console.log(error.statusCode);  // 404
    console.log(error.details);     // { message: 'User not found' }
  }
}
```

---

## ⚙️ Request Options

```typescript
await userServiceProxy.getUser(userId, {
  timeout: 3000,      // Override default timeout
  retries: 2,         // Enable retries
  headers: {          // Additional headers
    'x-custom': 'value',
  },
});
```

---

## 🧪 Testing

```typescript
// Mock UserServiceProxy
const mockUserServiceProxy = {
  getUser: jest.fn().mockResolvedValue({ id: '123', email: 'test@example.com' }),
};

// Use in tests
const result = await mockUserServiceProxy.getUser('123');
expect(result.email).toBe('test@example.com');
```

---

## 🚀 Future Enhancements

1. **Circuit Breaker** - prevent cascading failures
2. **Request caching** - для read-only операций
3. **gRPC support** - миграция с HTTP на gRPC
4. **Health checks** - автоматическая проверка доступности сервисов
5. **Service discovery** - dynamic URL resolution

---

## 📚 Related Documentation

- [Circuit Breaker Pattern](../../docs/CIRCUIT_BREAKER.md)
- [Service-to-Service Auth](../../docs/INTERNAL_AUTH.md)
- [Monitoring Guide](../../docs/MONITORING.md)
