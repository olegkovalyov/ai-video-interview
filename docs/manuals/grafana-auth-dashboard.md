# 📊 GRAFANA AUTH MONITORING DASHBOARD

## 🎯 СОЗДАНИЕ ДАШБОРДА

### 1️⃣ В Grafana:
- **Dashboards** → **New** → **New Dashboard**
- **Add visualization**

### 2️⃣ Панели для мониторинга Auth:

#### 📈 **Panel 1: Auth Activity Rate**
- **Data source:** Prometheus
- **Query:** `rate(http_requests_total{endpoint="/auth/refresh"}[5m])`
- **Type:** Time series
- **Title:** "Token Refresh Rate"

#### 📋 **Panel 2: Recent Auth Logs**
- **Data source:** Loki  
- **Query:** `{job="nestjs-apps"} |= "JWT" or "auth" or "Token"`
- **Type:** Logs
- **Title:** "Auth Activity Logs"

#### 🚨 **Panel 3: Auth Errors**
- **Data source:** Loki
- **Query:** `{job="nestjs-apps"} |= "auth" | json | level="ERROR"`
- **Type:** Logs  
- **Title:** "Auth Errors"

#### ⚡ **Panel 4: Refresh Success Rate**
- **Data source:** Loki
- **Query:** `sum(rate({job="nestjs-apps"} |= "Token verified successfully" [5m]))`
- **Type:** Stat
- **Title:** "Refresh Success/min"

#### 📊 **Panel 5: JWT Guard Performance**
- **Data source:** Prometheus
- **Query:** `histogram_quantile(0.95, rate(jwt_guard_duration_seconds_bucket[5m]))`
- **Type:** Time series
- **Title:** "JWT Guard P95 Latency"

---

## 🎯 ПРАКТИЧЕСКИЕ ALERTS

### 🚨 **Alert 1: High Auth Error Rate**
```
Query: sum(rate({job="nestjs-apps"} |= "auth" | json | level="ERROR" [5m])) > 0.1
Alert: Когда auth ошибок > 6/минуту
```

### ⚠️ **Alert 2: No Token Refresh Activity**
```
Query: absent(rate({job="nestjs-apps"} |= "refresh" [10m]))
Alert: Когда нет refresh активности 10+ минут (может быть проблема)
```

### 🔥 **Alert 3: JWT Guard Latency**
```
Query: histogram_quantile(0.95, rate(jwt_guard_duration_seconds_bucket[5m])) > 0.5
Alert: Когда JWT Guard работает > 500ms
```

---

## 📈 VARIABLES ДЛЯ ДАШБОРДА

### **$service_name variable:**
- **Type:** Query
- **Data source:** Loki
- **Query:** `label_values(service_name)`
- **Use:** Filter logs по сервису

### **$time_range variable:**
- **Type:** Interval
- **Values:** 5m, 15m, 1h, 6h, 24h
- **Use:** Динамический time range

---

## 🎯 DASHBOARD JSON EXPORT

После создания дашборда:
1. **Dashboard settings** → **JSON Model**
2. **Copy JSON**
3. **Save to:** `/monitoring/grafana/dashboards/auth-monitoring.json`
4. **Restart Grafana** → дашборд загрузится автоматически

---

## 🔍 QUERIES ДЛЯ TROUBLESHOOTING

### **Медленный login:**
```logql
{job="nestjs-apps"} |= "login" or "callback" | json | __error__ != "" 
```

### **Auto-refresh failures:**
```logql  
{job="nestjs-apps"} |= "refresh" |= "failed" or "expired" or "invalid"
```

### **Корреляция по пользователю:**
```logql
{job="nestjs-apps"} | json | userId="USER_ID"
```

### **Performance analysis:**
```logql
{job="nestjs-apps"} |= "duration" or "ms" or "took"
```

---

## 🚀 ПРОИЗВОДСТВЕННЫЕ ПРАКТИКИ

### **📊 SLI/SLO Monitoring:**
- **Auth Success Rate:** > 99.5%
- **Token Refresh Latency:** < 200ms P95
- **JWT Guard Performance:** < 100ms P99

### **🚨 Critical Alerts:**
- Auth service down > 1 minute
- Error rate > 1% for 5 minutes  
- No refresh activity > 30 minutes

### **📈 Business Metrics:**
- Daily active users (logins)
- Session duration
- Refresh frequency patterns

**Теперь у тебя enterprise-grade monitoring! 🎉**
