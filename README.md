# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## AI Video Interview Platform

A scalable platform for asynchronous AI-powered video interviews built with modern microservices architecture.

## Architecture Overview

This is a **Turborepo monorepo** containing:

### Applications
- **`web`** - Next.js 14+ dashboard for HR managers
- **`api-gateway`** - NestJS API Gateway with authentication
- **`user-service`** - NestJS microservice for user management
- **`interview-service`** - NestJS microservice for interview management
- **`docs`** - Next.js documentation site

### Shared Packages
- **`@repo/shared`** - Common types, DTOs, utilities, constants
- **`@repo/ui`** - Shared React components with Tailwind CSS
- **`@repo/eslint-config`** - ESLint configurations
- **`@repo/typescript-config`** - TypeScript configurations

### Infrastructure
- **PostgreSQL** - Main database (OLTP)
- **Redis** - Caching and sessions
- **MinIO** - S3-compatible object storage
- **Kafka** - Message queue (for later phases)
- **ClickHouse** - Analytics database (for later phases)

---

## Quick Start

### Prerequisites
```bash
# Required
Node.js 18+
npm 10+
Docker & Docker Compose

# Check versions
node --version  # Should be 18+
npm --version   # Should be 10+
docker --version
docker-compose --version
```

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd ai-video-interview-platform

# Install dependencies and start infrastructure
npm run setup
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# (Default values work for local development)
```

### 3. Start Development
```bash
# Start all services (recommended)
npm run dev:all

# Or start services separately:
npm run dev:services  # Backend services only
npm run dev:web       # Frontend only
```

### 4. Access Applications
- **Web Dashboard:** http://localhost:3000
- **API Gateway:** http://localhost:8000
- **User Service:** http://localhost:8001
- **Interview Service:** http://localhost:8002
- **MinIO Console:** http://localhost:9001 (minioadmin/minioadmin123)
- **Kafka UI:** http://localhost:8080 (when Kafka is running)

---

## Available Scripts

### Development
```bash
npm run dev:all        # Start all services
npm run dev:services   # Start backend services only
npm run dev:web        # Start web app only
npm run build          # Build all packages
npm run lint           # Lint all packages
npm run test           # Run all tests
```

### Infrastructure Management
```bash
npm run infra:up       # Start infrastructure (PostgreSQL, Redis, MinIO)
npm run infra:down     # Stop infrastructure
npm run infra:logs     # View infrastructure logs
npm run infra:reset    # Reset infrastructure (removes data)
```

### Kafka Management (Optional)
```bash
npm run kafka:up       # Start Kafka + Zookeeper + Kafka UI
npm run kafka:down     # Stop Kafka services
npm run kafka:logs     # View Kafka logs
npm run kafka:reset    # Reset Kafka (removes topics and data)
```

### Utilities
```bash
npm run format         # Format code with Prettier
npm run check-types    # Type check all packages
npm run test:e2e       # Run end-to-end tests
```

---

## Project Structure

```
ai-video-interview-platform/
├── apps/
│   ├── api-gateway/           # Main API Gateway (NestJS)
│   ├── user-service/          # User management service (NestJS)
│   ├── interview-service/     # Interview management service (NestJS)
│   ├── web/                   # HR Dashboard (Next.js)
│   └── docs/                  # Documentation (Next.js)
├── packages/
│   ├── shared/                # Common types, DTOs, utilities
│   ├── ui/                    # Shared React components
│   ├── eslint-config/         # ESLint configurations
│   └── typescript-config/     # TypeScript configurations
├── docs/
│   └── architecture/          # Architecture documentation
├── scripts/
│   └── init-db.sql           # Database initialization
├── docker-compose.yml         # Infrastructure services
├── turbo.json                # Turborepo configuration
└── README.md                 # This file
```

---

## Technology Stack

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
