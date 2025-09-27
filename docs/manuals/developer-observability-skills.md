# 💻 SENIOR DEVELOPER OBSERVABILITY SKILLS

## 1️⃣ ADVANCED CODE INSTRUMENTATION 🔧

### 🎯 Custom Metrics для твоего кода:
```typescript
// Вместо просто http_requests_total
@Injectable()
export class InterviewService {
  private readonly interviewDuration = new Histogram({
    name: 'interview_duration_seconds',
    help: 'Duration of video interviews',
    labelNames: ['interview_type', 'user_type']
  });

  private readonly interviewOutcomes = new Counter({
    name: 'interview_outcomes_total', 
    help: 'Interview completion outcomes',
    labelNames: ['outcome', 'reason']
  });

  async conductInterview(type: string) {
    const timer = this.interviewDuration.startTimer({ 
      interview_type: type,
      user_type: 'premium' 
    });
    
    try {
      const result = await this.processInterview();
      this.interviewOutcomes.inc({ 
        outcome: 'success',
        reason: 'completed' 
      });
      return result;
    } catch (error) {
      this.interviewOutcomes.inc({ 
        outcome: 'failure', 
        reason: error.code 
      });
      throw error;
    } finally {
      timer(); // Record duration
    }
  }
}
```

### 📊 Business Logic Metrics:
```typescript
// Metrics that matter для продукта
interview_completion_rate_percent
user_engagement_score  
feature_adoption_rate{feature="ai_feedback"}
payment_conversion_rate{plan="premium"}
```

---

## 2️⃣ ADVANCED TRACE ANALYSIS 🔍

### 🎯 Что Senior Developer ищет в traces:

#### ❌ Junior подход:
"Trace медленный, наверно база данных виновата"

#### ✅ Senior подход:
```typescript
// Анализ specific bottlenecks:
1. Database N+1 queries (много маленьких spans)
2. Synchronous external API calls (blocking)  
3. Inefficient algorithms (CPU-bound spans)
4. Memory allocation patterns
5. Lock contention (concurrency issues)
```

### 🔍 Trace Correlation Techniques:
```promql
# Найти все медленные traces пользователя
jaeger_query: service="interview-service" AND tags.user_id="12345" AND duration>500ms

# Correlation с business events
jaeger_query: tags.interview_id="abc123" AND tags.payment_status="failed"
```

---

## 3️⃣ LOG-DRIVEN DEVELOPMENT 📋

### 🎯 Structured Logging для debugging:
```typescript
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  async processPayment(userId: string, amount: number) {
    // Начало операции - structured data
    this.logger.log({
      event: 'payment_started',
      userId,
      amount,
      timestamp: new Date().toISOString(),
      traceId: this.traceService.getCurrentTraceId()
    });

    try {
      // Каждый важный шаг
      const validation = await this.validatePayment(userId, amount);
      this.logger.log({
        event: 'payment_validated',
        userId, 
        validationResult: validation,
        traceId: this.traceService.getCurrentTraceId()
      });

      const result = await this.chargeCard(amount);
      this.logger.log({
        event: 'payment_completed',
        userId,
        transactionId: result.id,
        processingTime: Date.now() - startTime,
        traceId: this.traceService.getCurrentTraceId()
      });

    } catch (error) {
      // Error context crucial для debugging
      this.logger.error({
        event: 'payment_failed',
        userId,
        amount,
        error: error.message,
        errorCode: error.code,
        stackTrace: error.stack,
        traceId: this.traceService.getCurrentTraceId()
      });
    }
  }
}
```

### 📊 Smart Log Queries:
```logql
# Debug specific user journey
{job="nestjs-apps"} | json | userId="12345" | line_format "{{.timestamp}} {{.event}} {{.message}}"

# Find error patterns  
{job="nestjs-apps"} | json | level="ERROR" | count by (errorCode)

# Performance analysis
{job="nestjs-apps"} | json | processingTime > 1000 | avg by (service)
```

---

## 4️⃣ PERFORMANCE DEBUGGING 🚀

### 🎯 Code-level performance analysis:

#### 🔍 Database Performance:
```typescript
// Instrument database queries
@Injectable() 
export class UserRepository {
  private readonly queryTimer = new Histogram({
    name: 'db_query_duration_seconds',
    labelNames: ['query_type', 'table']
  });

  async getUserWithInterviews(userId: string) {
    const timer = this.queryTimer.startTimer({ 
      query_type: 'select_with_join',
      table: 'users_interviews' 
    });

    // Log slow queries
    const startTime = Date.now();
    const result = await this.db.query(`
      SELECT u.*, i.* FROM users u 
      LEFT JOIN interviews i ON u.id = i.user_id 
      WHERE u.id = $1
    `, [userId]);
    
    const duration = Date.now() - startTime;
    if (duration > 100) { // Slow query threshold
      this.logger.warn({
        event: 'slow_query',
        query: 'getUserWithInterviews',
        duration,
        userId
      });
    }

    timer();
    return result;
  }
}
```

#### ⚡ Algorithm Performance:
```typescript
// Memory и CPU profiling
@Injectable()
export class AIAnalysisService {
  private readonly analysisTimer = new Histogram({
    name: 'ai_analysis_duration_seconds',
    labelNames: ['model_type', 'input_size']
  });

  async analyzeInterview(videoData: Buffer) {
    const timer = this.analysisTimer.startTimer({
      model_type: 'speech_recognition',
      input_size: videoData.length > 10_000_000 ? 'large' : 'small'
    });

    // Memory usage tracking
    const memBefore = process.memoryUsage();
    
    try {
      const result = await this.processVideoAI(videoData);
      
      const memAfter = process.memoryUsage();
      const memDelta = memAfter.heapUsed - memBefore.heapUsed;
      
      this.logger.log({
        event: 'ai_analysis_completed',
        memoryUsed: memDelta,
        inputSize: videoData.length,
        processingTime: timer()
      });

      return result;
    } catch (error) {
      timer();
      throw error;
    }
  }
}
```

---

## 5️⃣ FEATURE SUCCESS MEASUREMENT 📈

### 🎯 Product-focused metrics:
```typescript
@Injectable()
export class FeatureMetricsService {
  // Feature adoption tracking
  private readonly featureUsage = new Counter({
    name: 'feature_usage_total',
    labelNames: ['feature', 'user_type', 'outcome']
  });

  // Feature performance
  private readonly featureLatency = new Histogram({
    name: 'feature_response_time_seconds', 
    labelNames: ['feature', 'complexity']
  });

  async trackFeatureUsage(feature: string, userId: string, outcome: 'success' | 'failure') {
    const userType = await this.getUserType(userId);
    
    this.featureUsage.inc({
      feature,
      user_type: userType,
      outcome
    });

    // Correlate с business data
    this.logger.log({
      event: 'feature_used',
      feature,
      userId, 
      userType,
      outcome,
      timestamp: new Date(),
      // Business context важен!
      userPlan: await this.getUserPlan(userId),
      sessionDuration: await this.getSessionDuration(userId)
    });
  }
}
```

---

## 6️⃣ PRODUCTION DEBUGGING MASTERY 🐛

### 🎯 Real-world debugging scenarios:

#### 🔍 "Users can't login randomly":
```typescript
// Senior approach - hypothesis-driven debugging
async debugLoginIssues() {
  // 1. Check error rate по времени
  const errorQuery = `rate(http_requests_total{route="/auth/login", status_code=~"4..|5.."}[5m])`;
  
  // 2. Correlation с infrastructure
  const loginTraces = await jaeger.findTraces({
    service: 'api-gateway',
    operation: 'POST /auth/login',
    tags: { error: 'true' },
    limit: 50
  });
  
  // 3. Pattern analysis в логах
  const errorLogs = await loki.query(`
    {job="nestjs-apps"} 
    |= "login" 
    | json 
    | level="ERROR" 
    | count by (errorCode, hour)
  `);
  
  // 4. User journey reconstruction
  const affectedUsers = loginTraces
    .map(trace => trace.tags.userId)
    .filter(Boolean);
    
  for (const userId of affectedUsers) {
    const userJourney = await this.reconstructUserJourney(userId);
    console.log(`User ${userId} journey:`, userJourney);
  }
}
```

#### 🔧 "Payment service slow sometimes":
```typescript
async debugPaymentLatency() {
  // 1. P95/P99 analysis
  const latencyQuery = `
    histogram_quantile(0.95, 
      rate(payment_duration_seconds_bucket[5m])
    ) by (payment_method)
  `;
  
  // 2. Slow traces analysis  
  const slowTraces = await jaeger.findTraces({
    service: 'payment-service',
    minDuration: '1s',
    limit: 20
  });
  
  // 3. Common patterns identification
  const bottlenecks = slowTraces.map(trace => ({
    traceId: trace.traceId,
    slowestSpan: this.findSlowestSpan(trace),
    externalCalls: this.countExternalCalls(trace),
    dbQueries: this.countDbQueries(trace)
  }));
  
  console.log('Payment bottlenecks:', bottlenecks);
}
```

---

## 7️⃣ DASHBOARD DESIGN FOR DEVELOPERS 📊

### 🎯 Developer-focused dashboards:

#### 📈 Code Quality Dashboard:
```promql
# Error rate по endpoints
sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (route)

# Slowest endpoints
topk(10, histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (route))

# Database query performance
avg(db_query_duration_seconds) by (query_type)

# Feature usage trends
sum(increase(feature_usage_total[1d])) by (feature)
```

#### 🔍 Personal Performance Dashboard:
```promql
# Your service health
up{job="your-service"}

# Your endpoints performance  
rate(http_requests_total{service="your-service"}[5m])

# Your error contributions
sum(rate(http_requests_total{service="your-service", status_code=~"5.."}[5m]))

# Your slow queries
topk(5, avg(db_query_duration_seconds{service="your-service"}) by (query_name))
```

---

## 🎯 PRACTICAL SKILLS ASSESSMENT

### ✅ MID DEVELOPER (ты сейчас):
- Read existing metrics ✅
- Analyze traces for bottlenecks ✅  
- Filter logs effectively ✅
- Basic debugging ✅

### 🚀 SENIOR DEVELOPER (твоя цель):
- Write custom business metrics 
- Advanced trace correlation
- Structured logging design
- Performance optimization
- Production debugging mastery

### 👨‍💼 TECH LEAD DEVELOPER:
- Define observability standards
- Mentor team on debugging  
- Architecture monitoring
- Business impact measurement

---

## 💡 NEXT STEPS FOR YOU:

### 🎯 Практические задания:
1. **Add custom metrics** к твоему AI Interview app
2. **Implement structured logging** для user journey
3. **Create performance dashboard** для твоих endpoints
4. **Practice production debugging** scenarios

**Это именно то что нужно DEVELOPER'у Senior+ уровня! 🚀**
