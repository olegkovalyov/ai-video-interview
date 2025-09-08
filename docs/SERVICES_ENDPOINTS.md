# AI Video Interview - Services Endpoints

Полный список всех доступных сервисов, их URL и портов.

## 🌐 Web Applications

### Frontend (Next.js)
- **URL**: http://localhost:3000
- **Port**: 3000
- **Status**: Development server (manual start)
- **Start**: `cd apps/web && npm run dev`

### API Gateway (NestJS)
- **URL**: http://localhost:3002
- **Port**: 3002
- **Status**: Development server (manual start)
- **Start**: `cd apps/api-gateway && npm run dev`

### User Service (NestJS)
- **URL**: http://localhost:3003
- **Port**: 3003
- **Status**: Development server (manual start)
- **Start**: `cd apps/user-service && npm run dev`

### Interview Service (NestJS)
- **URL**: http://localhost:3004
- **Port**: 3004
- **Status**: Development server (manual start)
- **Start**: `cd apps/interview-service && npm run dev`

## 📊 Observability & Monitoring

### Grafana - Dashboards & Visualization
- **URL**: http://localhost:3001
- **Port**: 3001
- **Credentials**: admin / admin123
- **Container**: ai-interview-grafana
- **Features**: Unified observability dashboard, metrics, logs correlation

### Prometheus - Metrics Collection
- **URL**: http://localhost:9090
- **Port**: 9090
- **Container**: ai-interview-prometheus
- **Features**: Metrics scraping, alerting rules, PromQL queries

### Jaeger - Distributed Tracing
- **URL**: http://localhost:16686
- **Ports**: 
  - 16686 (UI)
  - 14268 (HTTP collector)
  - 14250 (gRPC collector)
  - 6831/udp (UDP agent)
- **Container**: ai-interview-jaeger
- **Features**: Trace visualization, performance analysis, service maps

### Loki - Log Aggregation
- **API URL**: http://localhost:3100
- **Port**: 3100
- **Container**: ai-interview-loki
- **Features**: LogQL queries, log correlation with metrics/traces
- **Note**: No UI, access via Grafana Explore

### Node Exporter - System Metrics
- **URL**: http://localhost:9100/metrics
- **Port**: 9100
- **Container**: ai-interview-node-exporter
- **Features**: System-level metrics (CPU, memory, disk, network)

## 🔧 Message Queue & Event Streaming

### Kafka UI - Kafka Management
- **URL**: http://localhost:8080
- **Port**: 8080
- **Container**: ai-interview-kafka-ui
- **Features**: Topic management, message browsing, consumer groups

### Kafka - Message Broker
- **Bootstrap Servers**: localhost:9092
- **Ports**:
  - 9092 (Client connections)
  - 9997 (JMX metrics)
- **Container**: ai-interview-kafka
- **Mode**: KRaft (no Zookeeper)

### Kafka Exporter - Kafka Metrics
- **Metrics URL**: http://localhost:9308/metrics
- **Port**: 9308
- **Container**: ai-interview-kafka-exporter
- **Features**: Kafka metrics for Prometheus

## 🗄️ Databases & Storage

### PostgreSQL - Main Database
- **Host**: localhost:5432
- **Port**: 5432
- **Container**: ai-interview-postgres
- **Credentials**: postgres / postgres
- **Database**: ai_video_interview

### Redis - Cache & Sessions
- **Host**: localhost:6379
- **Port**: 6379
- **Container**: ai-interview-redis
- **Features**: Caching, session storage, pub/sub

### ClickHouse - Analytics Database
- **HTTP URL**: http://localhost:8123
- **Native Port**: 9009
- **Ports**:
  - 8123 (HTTP interface)
  - 9009 (Native TCP)
- **Container**: ai-interview-clickhouse
- **Status**: Optional (analytics phase)

## 🔐 Authentication & Security

### Authentik - Identity Provider
- **URL**: https://localhost:9443
- **Port**: 9443
- **Container**: ai-interview-authentik-server
- **Features**: OAuth2/OIDC provider, user management
- **Note**: HTTPS only, self-signed certificate

### Authentik PostgreSQL
- **Port**: 5432 (internal)
- **Container**: ai-interview-authentik-postgres
- **Credentials**: authentik / authentik-password

### Authentik Redis
- **Port**: 6379 (internal)
- **Container**: ai-interview-authentik-redis

## 📁 File Storage

### MinIO - Object Storage
- **Console URL**: http://localhost:9001
- **API URL**: http://localhost:9000
- **Ports**:
  - 9000 (S3 API)
  - 9001 (Web Console)
- **Container**: ai-interview-minio
- **Credentials**: minioadmin / minioadmin123

## 🚀 Quick Start Commands

### Start All Services
```bash
# Start all infrastructure
docker compose up -d

# Start development servers (in separate terminals)
cd apps/api-gateway && npm run dev     # Port 3002
cd apps/user-service && npm run dev    # Port 3003  
cd apps/interview-service && npm run dev # Port 3004
cd apps/web && npm run dev              # Port 3000
```

### Stop All Services
```bash
# Stop all containers
docker compose stop

# Or completely remove
docker compose down
```

### Health Check URLs
```bash
# Check infrastructure services
curl http://localhost:9090/-/healthy     # Prometheus
curl http://localhost:3100/ready         # Loki
curl http://localhost:16686/             # Jaeger
curl http://localhost:3001/api/health    # Grafana
```

## 🔍 Troubleshooting

### Port Conflicts
If ports are already in use:
```bash
# Check what's using a port
lsof -i :3001

# Kill process on port
kill $(lsof -t -i:3001)

# Or use cleanup script
npm run cleanup:ports
```

### Container Issues
```bash
# Check container status
docker ps

# View logs
docker logs ai-interview-grafana

# Restart specific service
docker compose restart grafana
```

### Network Issues
```bash
# Check docker networks
docker network ls

# Inspect network
docker network inspect ai-interview-network
```

## 📝 Notes

- All containerized services start automatically with `docker compose up -d`
- Development servers (Next.js, NestJS) must be started manually
- Grafana includes unified dashboard combining metrics, logs, and traces
- Kafka runs in KRaft mode (no Zookeeper required)
- MinIO provides S3-compatible object storage for file uploads
- Authentik handles OAuth2/OIDC authentication flows
