Start development services for $ARGUMENTS.

## Steps

1. **Check infrastructure is running**:
   ```bash
   docker compose ps
   ```

2. **Start infrastructure if needed**:
   - If PostgreSQL/Redis/MinIO not running: `npm run infra:up`
   - If Kafka not running and backend services requested: `npm run kafka:up`
   - Wait for health checks to pass

3. **Start requested services**:

| Argument | Command | Description |
|----------|---------|-------------|
| `all` | `npm run dev:all` | All backend services + web frontend |
| `backend` | `npm run dev:services` | API Gateway + all microservices |
| `web` | `npm run dev:web` | Web frontend only (port 3000) |
| `api` | `npm run dev:api` | API Gateway only (port 8001) |
| `analysis` | `npm run dev:analysis` | AI Analysis service only (port 8005) |
| `<service-name>` | `npx turbo run start:dev --filter=./apps/<service-name>` | Specific service |

4. **Verify services are accessible**:
   - Check health endpoints: `curl http://localhost:<port>/health`
   - Check Swagger docs: `http://localhost:<port>/api/docs`
