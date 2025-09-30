# 📊 GRAFANA LOKI - QUERIES ДЛЯ ПОИСКА ЛОГОВ

## 🎯 **БАЗОВЫЕ QUERIES**

### **Все логи сервиса:**
```logql
{service_name="api-gateway"}
{service_name="user-service"}
{service_name="interview-service"}
```

### **По уровню логирования:**
```logql
{service_name="api-gateway", level="DEBUG"}
{service_name="api-gateway", level="INFO"}
{service_name="api-gateway", level="WARN"}
{service_name="api-gateway", level="ERROR"}
```

---

## 🔍 **KAFKA СОБЫТИЯ**

### **Все Kafka события:**
```logql
{service_name="api-gateway", category="kafka"}
```

### **Успешные публикации:**
```logql
{service_name="api-gateway", category="kafka"} | json | success="true"
```

### **Неудачные публикации:**
```logql
{service_name="api-gateway", category="kafka"} | json | success="false"
```

### **По топику:**
```logql
{service_name="api-gateway"} | json | topic="user-events"
{service_name="api-gateway"} | json | topic="interview-events"
```

### **По типу события:**
```logql
{service_name="api-gateway"} | json | eventType="user.logged_out"
{service_name="api-gateway"} | json | eventType="user_authenticated"
```

### **По action:**
```logql
{service_name="api-gateway"} | json | action="publish"
```

---

## 🔐 **AUTHENTICATION СОБЫТИЯ**

### **Все auth события:**
```logql
{service_name="api-gateway", category="authentication"}
```

### **Login события:**
```logql
{service_name="api-gateway", category="authentication"} | json | action="login_initiation"
```

### **Logout события:**
```logql
{service_name="api-gateway", category="authentication"} | json | action="logout_success"
```

### **Token refresh:**
```logql
{service_name="api-gateway", category="authentication"} | json | action="token_refresh_success"
```

### **Callback processing:**
```logql
{service_name="api-gateway", category="authentication"} | json | action="callback_processing"
```

---

## 👤 **ПОИСК ПО ПОЛЬЗОВАТЕЛЮ**

### **Все действия пользователя:**
```logql
{service_name="api-gateway"} | json | userId="46804177-4264-49c0-bd7d-66b32400fca3"
```

### **Kafka события пользователя:**
```logql
{service_name="api-gateway", category="kafka"} | json | userId="46804177-4264-49c0-bd7d-66b32400fca3"
```

### **Auth события пользователя:**
```logql
{service_name="api-gateway", category="authentication"} | json | userId="46804177-4264-49c0-bd7d-66b32400fca3"
```

---

## 🔎 **ПОИСК ПО ТЕКСТУ**

### **Поиск в сообщениях (regex):**
```logql
{service_name="api-gateway"} | json | message =~ "Kafka.*"
{service_name="api-gateway"} | json | message =~ "JWT.*"
{service_name="api-gateway"} | json | message =~ "Token.*"
```

### **Поиск точного сообщения:**
```logql
{service_name="api-gateway"} | json | message="Kafka: publish to user-events success"
```

### **Исключить из поиска:**
```logql
{service_name="api-gateway"} | json | message !~ "JWT Guard.*"
```

---

## 🔗 **DISTRIBUTED TRACING**

### **Поиск по traceId:**
```logql
{service_name="api-gateway"} | json | traceId="6989a71f4a3e3938ddb25bfc592db59d"
```

### **Все логи с tracing:**
```logql
{service_name="api-gateway"} | json | traceId!=""
```

---

## ⚠️ **ERRORS & WARNINGS**

### **Все ошибки:**
```logql
{service_name="api-gateway", level="ERROR"}
```

### **Все предупреждения:**
```logql
{service_name="api-gateway", level="WARN"}
```

### **Ошибки с текстом:**
```logql
{service_name="api-gateway", level="ERROR"} | json | message =~ ".*failed.*"
```

### **Ошибки Kafka:**
```logql
{service_name="api-gateway", category="kafka"} | json | success="false"
```

---

## 📈 **AGGREGATIONS & METRICS**

### **Количество логов по уровням:**
```logql
sum by (level) (count_over_time({service_name="api-gateway"}[5m]))
```

### **Количество Kafka событий:**
```logql
count_over_time({service_name="api-gateway", category="kafka"}[1h])
```

### **Rate событий в секунду:**
```logql
rate({service_name="api-gateway", category="kafka"}[1m])
```

### **Топ пользователей по активности:**
```logql
topk(10, sum by (userId) (count_over_time({service_name="api-gateway"} | json [1h])))
```

---

## ⏰ **ВРЕМЕННЫЕ ДИАПАЗОНЫ**

### **Последние N минут:**
- Time range: `Last 5 minutes`
- Time range: `Last 15 minutes`
- Time range: `Last 1 hour`

### **Конкретный временной диапазон:**
- Time range: `2025-09-30 21:00:00` to `2025-09-30 22:00:00`

### **В query (за последний час):**
```logql
{service_name="api-gateway"} | json [1h]
```

---

## 🎨 **ФОРМАТИРОВАНИЕ ВЫВОДА**

### **Показать только message:**
```logql
{service_name="api-gateway"} | json | line_format "{{.message}}"
```

### **Кастомный формат:**
```logql
{service_name="api-gateway"} | json | line_format "{{.timestamp}} [{{.level}}] {{.message}}"
```

### **С метаданными:**
```logql
{service_name="api-gateway", category="kafka"} | json | line_format "{{.timestamp}} - User: {{.userId}} - Action: {{.action}} - Topic: {{.topic}}"
```

---

## 🔧 **ADVANCED QUERIES**

### **Несколько условий (AND):**
```logql
{service_name="api-gateway", category="kafka"} | json | success="true" | topic="user-events"
```

### **Несколько условий (OR) через regex:**
```logql
{service_name="api-gateway"} | json | action =~ "login.*|logout.*"
```

### **Комбинированный поиск:**
```logql
{service_name="api-gateway", level=~"ERROR|WARN"} | json | category="kafka"
```

### **Исключение DEBUG логов:**
```logql
{service_name="api-gateway", level!="DEBUG"}
```

---

## 📊 **ИСПОЛЬЗОВАНИЕ В DASHBOARDS**

### **Panel 1: Kafka Events Table**
```
Query: {service_name="api-gateway", category="kafka"}
Visualization: Table
Transform: Extract fields (userId, action, topic, success)
```

### **Panel 2: Error Rate Over Time**
```
Query: rate({service_name="api-gateway", level="ERROR"}[1m])
Visualization: Time series
```

### **Panel 3: Top Users**
```
Query: topk(5, sum by (userId) (count_over_time({service_name="api-gateway"} | json | userId!="" [1h])))
Visualization: Bar chart
```

### **Panel 4: Auth Events Timeline**
```
Query: {service_name="api-gateway", category="authentication"}
Visualization: Logs
```

---

## 💡 **TIPS & TRICKS**

### **1. Используй Label Browser:**
- В Grafana Explore кликни "Label browser"
- Увидишь все доступные labels и их значения

### **2. Сохраняй частые queries:**
- Grafana → Explore → Query history
- Или создай Dashboard с нужными queries

### **3. Export в CSV:**
- Inspector → Data → Download CSV
- Для анализа логов в Excel/Python

### **4. Live tail (real-time логи):**
- В Grafana Explore включи "Live" режим
- Увидишь логи в реальном времени

### **5. Alerts на логах:**
- Grafana → Alerting → Alert rules
- Query: `count_over_time({level="ERROR"}[5m]) > 10`

---

## 🚨 **TROUBLESHOOTING**

### **Логи не появляются:**
```logql
# Проверь что Promtail работает
{job="nestjs-apps"}

# Проверь что есть хоть какие-то логи
{service_name=~".+"}

# Проверь временной диапазон
Time range: Last 1 hour
```

### **"Failed to load log volume":**
- Проверь что labels существуют в Label browser
- Попробуй более широкий временной диапазон
- Перезапусти Promtail: `docker restart ai-interview-promtail`

### **Incomplete data:**
- Увеличь Time range
- Проверь что файлы логов растут: `ls -lh apps/*/logs/*.log`

---

## 📚 **ШПАРГАЛКА OPERATORS**

| Operator | Описание | Пример |
|----------|----------|--------|
| `=` | Равно | `level="INFO"` |
| `!=` | Не равно | `level!="DEBUG"` |
| `=~` | Regex match | `message=~"Kafka.*"` |
| `!~` | Regex not match | `message!~"JWT.*"` |
| `\|` | Pipe (chain) | `{} \| json \| level="ERROR"` |
| `\| json` | Parse JSON | Обязательно для доступа к полям |
| `\| line_format` | Format output | Кастомный формат вывода |

---

## ✅ **ПРИМЕРЫ ДЛЯ КОПИРОВАНИЯ**

**Quick start queries:**
```logql
# Все логи за последний час
{service_name="api-gateway"}

# Kafka события
{service_name="api-gateway", category="kafka"}

# Ошибки
{service_name="api-gateway", level="ERROR"}

# Конкретный пользователь
{service_name="api-gateway"} | json | userId="YOUR_USER_ID"

# Поиск по тексту
{service_name="api-gateway"} | json | message =~ "YOUR_SEARCH_TEXT"
```

---

**Документация обновлена: 2025-09-30 21:47**

**При добавлении нового функционала обновляй этот файл! 📝**
