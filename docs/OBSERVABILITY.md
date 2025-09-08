# Observability с Prometheus и Grafana

## Обзор

Платформа теперь включает полноценную систему observability с:
- **Prometheus** - сбор и хранение метрик
- **Grafana** - визуализация и дашборды
- **Kafka KRaft** - без Zookeeper, современный подход
- **Kafka Exporter** - метрики Kafka для Prometheus
- **Node Exporter** - системные метрики

## Архитектура

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   NestJS Apps   │───▶│  Prometheus  │───▶│   Grafana   │
│                 │    │   :9090      │    │   :3001     │
├─────────────────┤    └──────────────┘    └─────────────┘
│ API Gateway     │           ▲
│ User Service    │           │
│ Interview Svc   │           │
└─────────────────┘    ┌──────────────┐
                       │   Exporters  │
┌─────────────────┐    │              │
│     Kafka       │───▶│ Kafka: 9308  │
│   (KRaft)       │    │ Node:  9100  │
│    :9092        │    └──────────────┘
└─────────────────┘
```

## Запуск на локале

### 1. Запуск Observability стека

```bash
# Запуск Prometheus + Grafana + Node Exporter
docker-compose --profile observability up -d

# Проверка статуса
docker-compose ps
```

### 2. Запуск Kafka с метриками

```bash
# Запуск Kafka (KRaft) + Kafka Exporter
docker-compose --profile kafka --profile observability up -d
```

### 3. Запуск NestJS сервисов

```bash
# API Gateway (с метриками на :8000/metrics)
cd apps/api-gateway
npm run start:dev

# User Service (с метриками на :8001/metrics)
cd apps/user-service  
npm run start:dev

# Interview Service (с метриками на :8002/metrics)
cd apps/interview-service
npm run start:dev
```

## Доступ к интерфейсам

| Сервис | URL | Логин/Пароль |
|--------|-----|--------------|
| **Grafana** | http://localhost:3001 | admin / admin123 |
| **Prometheus** | http://localhost:9090 | - |
| **Kafka UI** | http://localhost:8080 | - |

## Дашборды Grafana

### System Overview
- Загрузка системы (CPU, Memory, Disk)
- Статус сервисов (UP/DOWN)
- Общие системные метрики

### Kafka Overview  
- Количество брокеров
- Топики и партиции
- Пропускная способность сообщений
- Consumer lag

### Auth Metrics (в API Gateway)
- Количество auth запросов по типам
- Успешность аутентификации
- Активные сессии
- Время отклика auth endpoints

## Собираемые метрики

### HTTP метрики (все NestJS сервисы)
```
http_requests_total{method, route, status_code}
http_request_duration_seconds{method, route}
```

### Auth метрики (API Gateway)
```
auth_requests_total{type, status}        # login, logout, refresh, callback
auth_active_sessions                     # количество активных сессий
user_operations_total{operation}         # create, update, delete, authenticate
```

### Kafka метрики
```
kafka_messages_produced_total{topic, status}
kafka_message_processing_duration_seconds{topic}
kafka_brokers                           # количество активных брокеров
kafka_consumer_group_lag               # задержка consumer groups
```

### Системные метрики (Node Exporter)
```
node_cpu_seconds_total
node_memory_MemTotal_bytes
node_filesystem_size_bytes
node_load1, node_load5, node_load15
```

## Развертывание в AWS

### Вариант 1: ECS + CloudWatch
```yaml
# docker-compose.aws.yml
services:
  prometheus:
    image: prom/prometheus
    environment:
      - AWS_REGION=us-east-1
    volumes:
      - ./monitoring/prometheus-aws.yml:/etc/prometheus/prometheus.yml
```

### Вариант 2: EKS + Prometheus Operator
```bash
# Установка через Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack
```

### Вариант 3: Managed Services
- **Amazon Managed Prometheus** (AMP)
- **Amazon Managed Grafana** (AMG)
- **CloudWatch Container Insights**

## Конфигурация для AWS

### Prometheus (production)
```yaml
# monitoring/prometheus-aws.yml
global:
  scrape_interval: 30s
  external_labels:
    environment: production
    region: us-east-1

remote_write:
  - url: https://aps-workspaces.us-east-1.amazonaws.com/workspaces/{workspace-id}/api/v1/remote_write
    sigv4:
      region: us-east-1
```

### Grafana datasource (AWS)
```yaml
# Подключение к Amazon Managed Prometheus
datasources:
  - name: AMP
    type: prometheus
    url: https://aps-workspaces.us-east-1.amazonaws.com/workspaces/{workspace-id}
    jsonData:
      sigV4Auth: true
      sigV4AuthType: default
      sigV4Region: us-east-1
```

## Алерты и уведомления

### Важные алерты
```yaml
# monitoring/rules/alerts.yml
groups:
  - name: system
    rules:
      - alert: HighCPUUsage
        expr: node_load1 > 4
        for: 5m
        labels:
          severity: warning
        
      - alert: ServiceDown  
        expr: up{job=~"api-gateway|user-service|interview-service"} == 0
        for: 1m
        labels:
          severity: critical
          
      - alert: KafkaConsumerLag
        expr: kafka_consumer_group_lag > 1000
        for: 2m
        labels:
          severity: warning
```

### Настройка Slack уведомлений
```yaml
# В Grafana
notifiers:
  - name: slack-alerts
    type: slack
    settings:
      url: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
      channel: "#alerts"
      title: "AI Video Interview Alert"
```

## Мониторинг в продакшене

### Retention политики
- **Prometheus**: 15 дней локально, 1 год в AMP
- **Grafana**: Dashboards в git, data в RDS/Aurora
- **Logs**: CloudWatch Logs с retention 30 дней

### Backup стратегия
- Grafana dashboards → Git repository
- Prometheus config → Infrastructure as Code
- Alerting rules → Версионирование в Git

### Security
- Prometheus: Доступ только из VPC
- Grafana: SSO через Authentik/AWS SSO  
- Metrics endpoints: Internal load balancer
- TLS для всех connections в продакшене

## Troubleshooting

### Проблемы с метриками
```bash
# Проверка доступности metrics endpoints
curl http://localhost:8000/metrics  # API Gateway
curl http://localhost:9100/metrics  # Node Exporter
curl http://localhost:9308/metrics  # Kafka Exporter

# Проверка Prometheus targets
curl http://localhost:9090/api/v1/targets
```

### Kafka KRaft проблемы
```bash
# Проверка логов Kafka
docker logs ai-interview-kafka

# Проверка cluster metadata
docker exec -it ai-interview-kafka kafka-metadata-shell.sh \
  --snapshot /var/lib/kafka/data/__cluster_metadata-0/00000000000000000000.log
```

### Grafana проблемы
```bash
# Проверка подключения к Prometheus
docker logs ai-interview-grafana

# Тест datasource
curl -H "Authorization: Bearer $GRAFANA_TOKEN" \
     http://localhost:3001/api/datasources/proxy/1/api/v1/query?query=up
```

## Масштабирование

### Горизонтальное масштабирование
- Multiple Prometheus instances с federation
- Grafana за load balancer  
- Kafka cluster с несколькими брокерами

### Вертикальное масштабирование
- Увеличение retention в Prometheus
- Больше памяти для Grafana
- SSD storage для быстрых запросов

---

Эта observability система готова к использованию как на локале для разработки, так и в AWS для продакшена.
