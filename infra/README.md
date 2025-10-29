# 🏗️ Infrastructure Configuration

All infrastructure configurations for the AI Video Interview platform.

---

## 📂 Structure

```
infra/
├── observability/           # Monitoring & Observability stack
│   ├── grafana/            # Grafana dashboards & provisioning
│   ├── loki/               # Loki log aggregation config
│   ├── prometheus/         # Prometheus metrics & rules
│   └── promtail/           # Promtail log shipping config
│
├── keycloak/               # Keycloak authentication
│   ├── realm-export.json   # Keycloak realm configuration
│   ├── theme/              # Custom Keycloak theme (ai-interview)
│   └── data/               # Keycloak runtime data (gitignored)
│
├── postgres/               # PostgreSQL configuration
│   └── init/               # Database initialization scripts
│
└── docker/                 # Docker configurations (future)
    └── (empty - docker-compose.yml in root for convenience)
```

---

## 🚀 Quick Start

### Start all infrastructure services:

```bash
# From project root
docker-compose up -d
```

### Access services:

- **Grafana:** http://localhost:3002 (admin/admin123)
- **Prometheus:** http://localhost:9090
- **Loki:** http://localhost:3100
- **Keycloak:** http://localhost:8090 (admin/admin)

---

## 📊 Observability Stack

### Grafana
- **Location:** `infra/observability/grafana/`
- **Dashboards:** Pre-configured dashboards in `dashboards/`
- **Datasources:** Auto-provisioned (Loki, Prometheus)

### Loki
- **Location:** `infra/observability/loki/`
- **Config:** `loki-config.yml`
- **Retention:** 31 days

### Prometheus
- **Location:** `infra/observability/prometheus/`
- **Config:** `prometheus.yml`
- **Retention:** 15 days

### Promtail
- **Location:** `infra/observability/promtail/`
- **Config:** `promtail-config.yml`
- **Watches:** `apps/*/logs/*.log`

---

## 🔐 Keycloak

### Realm Configuration
- **File:** `infra/keycloak/realm-export.json`
- **Import:** Auto-imported on first startup
- **Client:** `ai-video-interview-app`

### Custom Theme
- **Location:** `infra/keycloak/theme/ai-interview/`
- **Mounted to:** `/opt/keycloak/themes` in container

---

## 💾 Runtime Data

Runtime data (logs, database files, etc.) is stored in `.runtime/` in project root:

```
.runtime/                    # gitignored
├── logs/                   # Application logs
└── data/
    ├── keycloak/          # Keycloak data
    └── postgres/          # PostgreSQL data
```

---

## 🛠️ Maintenance

### View logs:

```bash
docker logs ai-interview-grafana
docker logs ai-interview-loki
docker logs ai-interview-prometheus
```

### Restart services:

```bash
docker-compose restart grafana loki prometheus
```

### Clean up:

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes all data!)
docker-compose down -v
```

---

## 📚 Documentation

For detailed guides:
- **Observability:** See `/docs/08-observability/`
- **Keycloak:** See `/docs/04-authentication/`
- **Database:** See `/docs/03-database/`

---

**Last Updated:** 2025-10-28
