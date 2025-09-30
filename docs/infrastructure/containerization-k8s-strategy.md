# 🐳 CONTAINERIZATION & KUBERNETES STRATEGY

## 📋 **OVERVIEW**

**Текущий setup:**
```
Monorepo (Turborepo)
├── apps/
│   ├── api-gateway/
│   ├── user-service/
│   ├── interview-service/
│   ├── media-service/
│   ├── ai-service/
│   └── web/
└── packages/
    └── shared/

Запуск: npm run dev:services (native)
```

**Target setup:**
```
Same monorepo structure
+
Docker containers для каждого сервиса
+
Kubernetes orchestration (local → AWS EKS)
```

---

## 🎯 **СТРАТЕГИЯ: PROGRESSIVE CONTAINERIZATION**

### **Этап 1: Development (CURRENT) ✅**
```bash
# Native execution
npm run dev:services
# или
npm run dev --filter=api-gateway
npm run dev --filter=user-service

Преимущества:
✅ Быстрый перезапуск
✅ Hot reload работает отлично
✅ Легкий debugging (VS Code attach)
✅ Прямой доступ к logs
✅ Низкое потребление ресурсов
```

**Вердикт:** Оставляем для day-to-day development! 🎯

---

### **Этап 2: Docker Compose (NEXT) 🔵**
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # Infrastructure
  postgres:
    image: postgres:16
    ...
  
  redis:
    image: redis:7
    ...
  
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ...
  
  # Application services (в контейнерах)
  api-gateway:
    build:
      context: .
      dockerfile: apps/api-gateway/Dockerfile.dev
    volumes:
      - ./apps/api-gateway/src:/app/apps/api-gateway/src
      - ./packages:/app/packages
    command: npm run dev --filter=api-gateway
    
  user-service:
    build: ...
    volumes: ...
```

**Использование:**
```bash
# Infrastructure только
docker-compose up postgres redis kafka

# App services native
npm run dev:services

# Или все вместе (когда нужно)
docker-compose up
```

**Преимущества:**
✅ Гибкость: можно миксовать native + containers
✅ Volumes для hot reload
✅ Изоляция infrastructure
✅ Ближе к production environment

---

### **Этап 3: Kubernetes Local (FUTURE) 🟡**
```bash
# Minikube или Kind
minikube start

# Deploy
kubectl apply -f k8s/dev/
```

**Использование:**
- Full K8s simulation локально
- Testing deployments, services, ingress
- CI/CD rehearsal

---

### **Этап 4: AWS EKS (PRODUCTION) 🟢**
```bash
# Production K8s на AWS
kubectl apply -f k8s/prod/
```

---

## 🏗️ **МОНОРЕПО + DOCKER BEST PRACTICES**

### **Вариант 1: Multi-stage Dockerfile (РЕКОМЕНДУЮ)**

**Преимущества:**
- Один Dockerfile для dev и prod
- Оптимизация слоев
- Build cache работает хорошо

**Структура:**
```dockerfile
# apps/api-gateway/Dockerfile

# ============================================
# BASE STAGE - общие зависимости
# ============================================
FROM node:20-alpine AS base
WORKDIR /app

# Install turbo globally
RUN npm install -g turbo

# Copy root package files
COPY package*.json turbo.json ./
COPY tsconfig.base.json ./

# ============================================
# DEPS STAGE - install dependencies
# ============================================
FROM base AS deps

# Copy workspace configs
COPY apps/api-gateway/package*.json ./apps/api-gateway/
COPY packages/shared/package*.json ./packages/shared/

# Install all dependencies (включая dev)
RUN npm install

# ============================================
# BUILD STAGE - build the application
# ============================================
FROM deps AS builder

# Copy source code
COPY apps/api-gateway ./apps/api-gateway
COPY packages/shared ./packages/shared

# Build with turbo (используя cache)
RUN turbo run build --filter=api-gateway

# ============================================
# PRODUCTION STAGE - runtime
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Copy only production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api-gateway/dist ./apps/api-gateway/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Production packages
COPY apps/api-gateway/package*.json ./apps/api-gateway/
COPY packages/shared/package*.json ./packages/shared/

ENV NODE_ENV=production
EXPOSE 3002

CMD ["node", "apps/api-gateway/dist/main.js"]

# ============================================
# DEVELOPMENT STAGE - с hot reload
# ============================================
FROM deps AS development

# Copy source (будет overridden volumes)
COPY apps/api-gateway ./apps/api-gateway
COPY packages/shared ./packages/shared

ENV NODE_ENV=development
EXPOSE 3002

CMD ["npm", "run", "dev", "--filter=api-gateway"]
```

**Использование:**
```bash
# Development build
docker build --target development -t api-gateway:dev .

# Production build
docker build --target production -t api-gateway:prod .

# С build cache от Turborepo
docker build --build-arg TURBO_TEAM=team_ai_interview .
```

---

### **Вариант 2: Shared Dockerfile (АЛЬТЕРНАТИВА)**

```dockerfile
# Dockerfile.base - в корне
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g turbo pnpm
COPY package*.json pnpm-lock.yaml turbo.json ./
RUN pnpm install
COPY . .

# Dockerfile.service - template
FROM base AS service
ARG SERVICE_NAME
WORKDIR /app
RUN turbo run build --filter=${SERVICE_NAME}
EXPOSE ${PORT}
CMD turbo run start --filter=${SERVICE_NAME}
```

**Build:**
```bash
docker build \
  --build-arg SERVICE_NAME=api-gateway \
  --build-arg PORT=3002 \
  -f Dockerfile.service \
  -t api-gateway:latest .
```

---

## 📁 **СТРУКТУРА ПРОЕКТА**

```
ai-video-interview/
├── apps/
│   ├── api-gateway/
│   │   ├── Dockerfile              # Multi-stage
│   │   ├── .dockerignore
│   │   └── src/
│   ├── user-service/
│   │   ├── Dockerfile
│   │   └── ...
│   └── web/
│       ├── Dockerfile              # Next.js специфика
│       └── ...
├── k8s/
│   ├── base/                       # Kustomize base
│   │   ├── api-gateway/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── configmap.yaml
│   │   ├── user-service/
│   │   └── ...
│   ├── overlays/
│   │   ├── local/                  # Minikube/Kind
│   │   │   ├── kustomization.yaml
│   │   │   └── ...
│   │   ├── dev/                    # Dev environment
│   │   └── prod/                   # Production (EKS)
│   └── infrastructure/
│       ├── postgres.yaml
│       ├── redis.yaml
│       └── kafka.yaml
├── docker-compose.yml              # Infrastructure only
├── docker-compose.dev.yml          # Dev with services
├── docker-compose.prod.yml         # Production simulation
├── skaffold.yaml                   # Local K8s development
├── .dockerignore
└── Makefile                        # Helper commands
```

---

## 🛠️ **DEVELOPMENT WORKFLOW**

### **Option A: Native (Day-to-day)**

```bash
# Terminal 1: Infrastructure
docker-compose up postgres redis kafka

# Terminal 2: Services
npm run dev:services

# OR individual services
npm run dev --filter=api-gateway
npm run dev --filter=user-service
```

**Когда использовать:**
- Daily development
- Quick iterations
- Debugging
- Hot reload

---

### **Option B: Mixed (Testing)**

```bash
# Infrastructure + some services в Docker
docker-compose up postgres redis kafka user-service

# API Gateway native для debugging
npm run dev --filter=api-gateway
```

**Когда использовать:**
- Testing service interaction
- Integration debugging
- Network issues investigation

---

### **Option C: Full Docker (Pre-deployment)**

```bash
# Все в Docker Compose
docker-compose -f docker-compose.dev.yml up

# Rebuild on code change
docker-compose build api-gateway
docker-compose up -d api-gateway
```

**Когда использовать:**
- Testing Docker builds
- Pre-deployment validation
- CI/CD simulation

---

### **Option D: Local Kubernetes (Advanced)**

```bash
# Start minikube
minikube start --cpus=4 --memory=8192

# Deploy with Skaffold (auto-rebuild)
skaffold dev

# Or manual
kubectl apply -k k8s/overlays/local
```

**Когда использовать:**
- K8s features testing
- Service mesh experiments
- Production simulation
- CI/CD pipeline development

---

## 🎯 **DOCKER COMPOSE SETUP**

### **docker-compose.yml (Infrastructure)**

```yaml
version: '3.8'

networks:
  ai-interview-network:
    driver: bridge

services:
  postgres:
    image: postgres:16-alpine
    container_name: ai-interview-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ai_video_interview_main
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-databases.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - ai-interview-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ai-interview-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ai-interview-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: ai-interview-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    networks:
      - ai-interview-network

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: ai-interview-kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    networks:
      - ai-interview-network
    healthcheck:
      test: ["CMD", "kafka-topics", "--bootstrap-server", "localhost:9092", "--list"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### **docker-compose.dev.yml (с сервисами)**

```yaml
version: '3.8'

services:
  # Extend infrastructure from base
  postgres:
    extends:
      file: docker-compose.yml
      service: postgres

  redis:
    extends:
      file: docker-compose.yml
      service: redis

  kafka:
    extends:
      file: docker-compose.yml
      service: kafka

  # Application Services
  api-gateway:
    build:
      context: .
      dockerfile: apps/api-gateway/Dockerfile
      target: development
    container_name: ai-interview-api-gateway
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_video_interview_main
      - REDIS_HOST=redis
      - KAFKA_BROKERS=kafka:9092
      - USER_SERVICE_URL=http://user-service:3003
      - INTERVIEW_SERVICE_URL=http://interview-service:3004
    volumes:
      - ./apps/api-gateway/src:/app/apps/api-gateway/src
      - ./packages/shared:/app/packages/shared
      - /app/node_modules
      - /app/apps/api-gateway/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      kafka:
        condition: service_healthy
    networks:
      - ai-interview-network

  user-service:
    build:
      context: .
      dockerfile: apps/user-service/Dockerfile
      target: development
    container_name: ai-interview-user-service
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_video_interview_user
      - REDIS_HOST=redis
      - KAFKA_BROKERS=kafka:9092
    volumes:
      - ./apps/user-service/src:/app/apps/user-service/src
      - ./packages/shared:/app/packages/shared
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ai-interview-network

  # ... остальные сервисы аналогично
```

---

## ☸️ **KUBERNETES LOCAL SETUP**

### **Tool Options:**

**1. Minikube (РЕКОМЕНДУЮ для начала)**
```bash
# Install
brew install minikube

# Start
minikube start --driver=docker --cpus=4 --memory=8192

# Dashboard
minikube dashboard

# Use local Docker images
eval $(minikube docker-env)
```

**2. Kind (Kubernetes IN Docker)**
```bash
# Install
brew install kind

# Create cluster
kind create cluster --config k8s/kind-config.yaml

# Load local images
kind load docker-image api-gateway:latest
```

**3. Docker Desktop K8s (Easiest)**
```
Settings → Kubernetes → Enable Kubernetes
```

---

### **Kustomize Structure**

```yaml
# k8s/base/api-gateway/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  labels:
    app: api-gateway
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: api-gateway:latest
        ports:
        - containerPort: 3002
        env:
        - name: NODE_ENV
          value: "development"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: connection-string
        - name: REDIS_HOST
          value: redis-service
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5

---
# k8s/base/api-gateway/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
spec:
  type: ClusterIP
  selector:
    app: api-gateway
  ports:
  - port: 3002
    targetPort: 3002
    protocol: TCP

---
# k8s/base/api-gateway/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml

commonLabels:
  app: api-gateway
  team: backend
```

### **Overlays для разных сред**

```yaml
# k8s/overlays/local/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base/api-gateway
  - ../../base/user-service
  - ../../base/interview-service

namespace: ai-interview-dev

# Patch для local
patchesStrategicMerge:
  - local-patches.yaml

images:
  - name: api-gateway
    newTag: dev-latest
  - name: user-service
    newTag: dev-latest

configMapGenerator:
  - name: app-config
    literals:
      - ENVIRONMENT=local
      - LOG_LEVEL=debug
```

---

## 🚀 **SKAFFOLD для Local K8s Dev**

```yaml
# skaffold.yaml
apiVersion: skaffold/v4beta6
kind: Config

metadata:
  name: ai-video-interview

build:
  artifacts:
    - image: api-gateway
      context: .
      docker:
        dockerfile: apps/api-gateway/Dockerfile
        target: development
      sync:
        manual:
          - src: "apps/api-gateway/src/**/*.ts"
            dest: /app/apps/api-gateway/src
    
    - image: user-service
      context: .
      docker:
        dockerfile: apps/user-service/Dockerfile
        target: development
      sync:
        manual:
          - src: "apps/user-service/src/**/*.ts"
            dest: /app/apps/user-service/src

deploy:
  kustomize:
    paths:
      - k8s/overlays/local

portForward:
  - resourceType: service
    resourceName: api-gateway-service
    port: 3002
    localPort: 3002
  
  - resourceType: service
    resourceName: web-service
    port: 3000
    localPort: 3000
```

**Использование:**
```bash
# Auto-rebuild and deploy on code change
skaffold dev

# Build and deploy once
skaffold run

# Delete deployments
skaffold delete
```

---

## 🎯 **MAKEFILE для удобства**

```makefile
# Makefile

.PHONY: help dev dev-docker dev-k8s build test

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ========================================
# Development
# ========================================

infra-up:  ## Start infrastructure (postgres, redis, kafka)
	docker-compose up -d postgres redis kafka zookeeper

infra-down:  ## Stop infrastructure
	docker-compose down

dev:  ## Start services natively (recommended for dev)
	npm run dev:services

dev-single:  ## Start single service (use SERVICE=api-gateway)
	npm run dev --filter=$(SERVICE)

# ========================================
# Docker
# ========================================

build-all:  ## Build all Docker images
	@for service in api-gateway user-service interview-service media-service web; do \
		echo "Building $$service..."; \
		docker build -t ai-interview-$$service:latest -f apps/$$service/Dockerfile .; \
	done

build:  ## Build single service (use SERVICE=api-gateway)
	docker build -t ai-interview-$(SERVICE):latest -f apps/$(SERVICE)/Dockerfile .

docker-dev:  ## Run all services in Docker Compose
	docker-compose -f docker-compose.dev.yml up

docker-dev-build:  ## Rebuild and run in Docker Compose
	docker-compose -f docker-compose.dev.yml up --build

docker-logs:  ## Tail logs (use SERVICE=api-gateway)
	docker-compose logs -f $(SERVICE)

# ========================================
# Kubernetes Local
# ========================================

k8s-start:  ## Start minikube
	minikube start --cpus=4 --memory=8192 --driver=docker

k8s-stop:  ## Stop minikube
	minikube stop

k8s-deploy:  ## Deploy to local K8s
	kubectl apply -k k8s/overlays/local

k8s-delete:  ## Delete from local K8s
	kubectl delete -k k8s/overlays/local

k8s-dev:  ## Start Skaffold dev mode
	skaffold dev

k8s-logs:  ## Tail K8s logs (use SERVICE=api-gateway)
	kubectl logs -f -l app=$(SERVICE) -n ai-interview-dev

k8s-dashboard:  ## Open K8s dashboard
	minikube dashboard

k8s-port-forward:  ## Port forward API Gateway
	kubectl port-forward svc/api-gateway-service 3002:3002 -n ai-interview-dev

# ========================================
# Testing
# ========================================

test:  ## Run all tests
	npm test

test-e2e:  ## Run E2E tests
	npm run test:e2e

test-docker:  ## Test Docker builds
	@for service in api-gateway user-service; do \
		echo "Testing $$service Docker build..."; \
		docker build --target production -t test-$$service -f apps/$$service/Dockerfile . || exit 1; \
	done
	@echo "All Docker builds successful!"

# ========================================
# Cleanup
# ========================================

clean:  ## Clean all
	npm run clean
	docker-compose down -v
	docker system prune -f

clean-k8s:  ## Clean K8s
	minikube delete
```

**Использование:**
```bash
# Show help
make help

# Start infrastructure only
make infra-up

# Native development
make dev

# Docker development
make docker-dev

# K8s development
make k8s-start
make k8s-deploy
make k8s-logs SERVICE=api-gateway

# Build Docker images
make build-all
make build SERVICE=api-gateway
```

---

## 🎯 **РЕКОМЕНДОВАННАЯ СТРАТЕГИЯ**

### **Phase 1: Current (KEEP) ✅**
```bash
# Day-to-day development
docker-compose up postgres redis kafka  # Infrastructure
npm run dev:services                     # Services native
```

**Причины:**
- Fastest feedback loop
- Hot reload работает отлично
- Easy debugging
- Low resource usage

---

### **Phase 2: Add Dockerfiles (NEXT) 🔵**
```bash
# Create Dockerfiles for all services
apps/*/Dockerfile

# Test builds
make build-all

# Occasional full Docker testing
make docker-dev
```

**Цель:** Готовность к deployment, CI/CD

---

### **Phase 3: K8s Local (WHEN NEEDED) 🟡**
```bash
# When testing K8s features
make k8s-start
make k8s-deploy

# Or with Skaffold
skaffold dev
```

**Когда использовать:**
- Before production deployment
- Testing K8s configs
- Service mesh experiments
- Ingress testing

---

### **Phase 4: AWS EKS (PRODUCTION) 🟢**
```bash
# Terraform/CDK для infrastructure
terraform apply

# Deploy via CI/CD
kubectl apply -k k8s/overlays/prod
```

---

## 📊 **COMPARISON TABLE**

| Aspect | Native | Docker Compose | K8s Local | AWS EKS |
|--------|--------|----------------|-----------|---------|
| **Setup** | ⚡ Instant | 🔵 5 min | 🟡 15 min | 🔴 Hours |
| **Speed** | ⚡⚡⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ |
| **Resources** | Low | Medium | High | Variable |
| **Hot Reload** | ✅ Yes | ✅ With volumes | ⚠️ Skaffold | ❌ No |
| **Debugging** | ✅ Easy | 🔵 Medium | 🟡 Hard | 🔴 Harder |
| **Production Parity** | ❌ Low | 🔵 Medium | ✅ High | ✅ Exact |
| **Use Case** | Daily dev | Integration | Pre-prod | Production |

---

## 🎓 **LEARNING PATH**

```
Week 1-4: Native development ✅
  └─ Master services, APIs, features

Week 5: Docker Compose 🔵
  └─ Create Dockerfiles
  └─ Test builds
  └─ Docker dev workflow

Week 6-7: Local K8s 🟡
  └─ Minikube setup
  └─ K8s manifests
  └─ Skaffold workflow

Week 8+: AWS EKS 🟢
  └─ Terraform infrastructure
  └─ CI/CD pipelines
  └─ Production deployment
```

---

## ✅ **ACTION ITEMS**

**Immediate (сейчас):**
```
✅ Keep native development
✅ Use docker-compose для infrastructure
✅ Focus on features
```

**Soon (после core features):**
```
□ Create Dockerfiles для всех сервисов
□ Setup docker-compose.dev.yml
□ Test Docker builds locally
□ Add to CI/CD
```

**Later (перед production):**
```
□ Create K8s manifests
□ Test on minikube
□ Setup Skaffold
□ Prepare for EKS
```

---

## 📝 **SUMMARY**

**Best Practice для монорепо + микросервисы:**

1. **Development:** Native execution (npm run dev)
   - Fastest iteration
   - Best DX (developer experience)

2. **Testing:** Docker Compose
   - Integration testing
   - Pre-deployment validation

3. **Staging:** Local K8s (minikube/Skaffold)
   - K8s features testing
   - Production simulation

4. **Production:** AWS EKS
   - Real deployment
   - Auto-scaling, monitoring

**Ты можешь:**
- Продолжать native dev (рекомендуется!)
- Добавить Dockerfiles постепенно
- Тестировать Docker когда нужно
- Перейти на K8s когда готов

**Главное:** Не усложняй раньше времени! Native dev отлично работает для обучения и разработки. 🎯
