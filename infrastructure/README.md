# 🏗️ Infrastructure Setup

Production-ready infrastructure for AI Video Interview platform with logging, monitoring, and observability.

---

## 📦 Services

| Service | Port | Description |
|---------|------|-------------|
| **PostgreSQL** | 5432 | Primary database |
| **Redis** | 6379 | Caching & sessions |
| **Kafka** | 9092 | Event streaming |
| **MinIO** | 9000/9001 | S3-compatible storage |
| **Keycloak** | 8080 | Authentication |
| **Loki** | 3100 | Log aggregation |
| **Promtail** | - | Log shipper |
| **Grafana** | 3001 | Monitoring & visualization |

---

## 🚀 Quick Start

### **1. Start All Services**

```bash
docker-compose -f docker-compose.infrastructure.yml up -d
```

### **2. Verify Services**

```bash
docker-compose -f docker-compose.infrastructure.yml ps
```

### **3. Access Services**

- **Grafana**: http://localhost:3001 (admin/admin)
- **Keycloak**: http://localhost:8080 (admin/admin)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

---

## 📝 Logging Architecture

### **Log Rotation Strategy**

```
apps/
├── api-gateway/logs/
│   ├── api-gateway-2025-10-01.log          # Daily logs
│   ├── api-gateway-2025-10-01.log.gz       # Compressed
│   ├── api-gateway-error-2025-10-01.log    # Daily errors
│   └── archive/
│       └── api-gateway-2025-10.log         # Monthly archive
└── user-service/logs/
    ├── user-service-2025-10-01.log
    ├── user-service-error-2025-10-01.log
    └── archive/
        └── user-service-2025-10.log
```

### **Retention Policy**

| Type | Retention | Compression |
|------|-----------|-------------|
| **Daily logs** | 14 days | Yes (gzip) |
| **Error logs** | 30 days | Yes (gzip) |
| **Monthly archive** | 12 months | Yes (gzip) |

### **Log Format**

All logs are in JSON format for easy parsing:

```json
{
  "timestamp": "2025-10-01T10:52:30.123Z",
  "level": "info",
  "service": "api-gateway",
  "message": "User authenticated successfully",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "traceId": "abc-def-ghi",
  "category": "authentication",
  "action": "login",
  "duration": 145
}
```

---

## 📊 Grafana Setup

### **1. Access Grafana**

```
URL: http://localhost:3001
Username: admin
Password: admin
```

### **2. View Logs**

Loki datasource is pre-configured. Use LogQL queries:

```logql
# All logs from api-gateway
{service="api-gateway"}

# Only errors
{service="user-service", level="error"}

# Filter by user
{service="api-gateway"} |= "userId=123"

# Performance issues (>1s)
{category="performance"} | json | duration > 1000

# Kafka errors
{category="kafka", success="false"}
```

### **3. Example Queries**

**Authentication Logs:**
```logql
{service="api-gateway", category="authentication"}
```

**Command Execution:**
```logql
{service="user-service", category="command"}
```

**HTTP Requests with 5xx errors:**
```logql
{service="api-gateway", category="http"} | json | statusCode >= 500
```

**Slow Queries:**
```logql
{service="user-service", category="query"} | json | duration > 500
```

---

## 🔧 Configuration

### **Promtail**

Configured to:
- Watch log directories in real-time
- Parse JSON logs automatically
- Extract labels (service, level, category)
- Drop debug logs in production
- Handle archived logs

Config: `infrastructure/promtail/promtail-config.yml`

### **Loki**

Configured for:
- 31 days retention
- TSDB schema for performance
- Embedded cache for queries
- Automatic compaction

Config: `infrastructure/loki/loki-config.yml`

---

## 🛠️ Maintenance

### **View Logs**

```bash
# Loki logs
docker logs ai-interview-loki

# Promtail logs
docker logs ai-interview-promtail

# Grafana logs
docker logs ai-interview-grafana
```

### **Restart Services**

```bash
# Restart specific service
docker restart ai-interview-loki

# Restart all logging stack
docker-compose -f docker-compose.infrastructure.yml restart loki promtail grafana
```

### **Clean Up Old Logs**

```bash
# Remove logs older than 14 days (automated by winston)
# Manual cleanup if needed:
find apps/*/logs -name "*.log.gz" -mtime +14 -delete
```

### **Check Disk Usage**

```bash
# Check log directory sizes
du -sh apps/*/logs

# Check Docker volumes
docker system df -v
```

---

## 🚨 Troubleshooting

### **Promtail not sending logs**

```bash
# Check Promtail is running
docker ps | grep promtail

# Check Promtail logs
docker logs ai-interview-promtail

# Verify log file permissions
ls -la apps/api-gateway/logs/
```

### **Loki not receiving logs**

```bash
# Test Loki API
curl http://localhost:3100/ready

# Check Loki logs
docker logs ai-interview-loki
```

### **Grafana can't connect to Loki**

```bash
# Test from Grafana container
docker exec -it ai-interview-grafana curl http://loki:3100/ready

# Check network
docker network inspect ai-interview-network
```

### **Logs not rotating**

Winston handles rotation automatically. Check:
- Disk space: `df -h`
- Permissions: `ls -la apps/*/logs`
- Winston config in logger.service.ts

---

## 📚 Best Practices

### **Development**

✅ Use `debug` level for detailed debugging  
✅ Include `traceId` for request tracking  
✅ Use structured logging (JSON)  
✅ Log performance metrics  

### **Production**

✅ Set `LOG_LEVEL=info` in production  
✅ Enable log compression  
✅ Monitor disk usage  
✅ Set up alerts in Grafana  
✅ Regular backup of critical logs  

### **Security**

❌ Never log sensitive data (passwords, tokens, PII)  
✅ Sanitize user input in logs  
✅ Use log levels appropriately  
✅ Implement log retention policies  

---

## 🎯 Next Steps

1. **Create Grafana Dashboards** for each service
2. **Set up Alerts** for critical errors
3. **Configure Log Sampling** for high-volume services
4. **Integrate Distributed Tracing** (Jaeger/Tempo)
5. **Add Metrics** (Prometheus)

---

**Last Updated:** 2025-10-01
