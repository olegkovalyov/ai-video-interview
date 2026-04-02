#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════
# System E2E Tests
# Starts all services on test ports (900x) with test databases
# Runs inter-service test scenarios, then cleans up
# ═══════════════════════════════════════════════════════════════

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PIDS=()
CLEANUP_DONE=false

cleanup() {
  if [ "$CLEANUP_DONE" = true ]; then return; fi
  CLEANUP_DONE=true

  echo -e "\n${YELLOW}Stopping test services...${NC}"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait "${PIDS[@]}" 2>/dev/null || true
  echo -e "${GREEN}All test services stopped.${NC}"
}

trap cleanup EXIT INT TERM

# ─── Step 1: Check infrastructure ─────────────────────────────
echo -e "${CYAN}[1/6] Checking infrastructure...${NC}"

check_service() {
  curl -sf "$1" > /dev/null 2>&1
}

if ! check_service "http://localhost:5432" 2>/dev/null; then
  # Try connecting via psql
  PGPASSWORD=postgres psql -h localhost -U postgres -c "SELECT 1" > /dev/null 2>&1 || {
    echo -e "${RED}PostgreSQL not running. Start with: docker compose up -d postgres${NC}"
    exit 1
  }
fi
echo "  PostgreSQL ✓"

if ! docker exec ai-interview-redis redis-cli ping > /dev/null 2>&1; then
  echo -e "${RED}Redis not running. Start with: docker compose up -d redis${NC}"
  exit 1
fi
echo "  Redis ✓"

echo "  Kafka (optional, skipping check)"
echo ""

# ─── Step 2: Create test databases ────────────────────────────
echo -e "${CYAN}[2/6] Creating test databases...${NC}"

DBS=(
  "ai_video_interview_user_test"
  "ai_video_interview_interview_test"
  "ai_video_interview_analysis_test"
  "ai_video_interview_billing_test"
  "ai_video_interview_notification_test"
)

for db in "${DBS[@]}"; do
  PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE $db;" 2>/dev/null || true
  echo "  $db ✓"
done
echo ""

# ─── Step 3: Run migrations ───────────────────────────────────
echo -e "${CYAN}[3/6] Running migrations...${NC}"

run_migration() {
  local service_dir=$1
  local db_name=$2
  DATABASE_NAME="$db_name" DATABASE_HOST=localhost DATABASE_PORT=5432 \
    DATABASE_USER=postgres DATABASE_PASSWORD=postgres \
    npm run migration:run --workspace="$service_dir" 2>&1 | tail -1
}

run_migration "apps/user-service" "ai_video_interview_user_test" && echo "  user-service ✓"
run_migration "apps/interview-service" "ai_video_interview_interview_test" && echo "  interview-service ✓"
run_migration "apps/ai-analysis-service" "ai_video_interview_analysis_test" && echo "  ai-analysis-service ✓"
run_migration "apps/billing-service" "ai_video_interview_billing_test" && echo "  billing-service ✓"
run_migration "apps/notification-service" "ai_video_interview_notification_test" && echo "  notification-service ✓"
echo ""

# ─── Step 4: Start services on test ports ─────────────────────
echo -e "${CYAN}[4/6] Starting services on test ports...${NC}"

COMMON_ENV="NODE_ENV=test DATABASE_HOST=localhost DATABASE_PORT=5432 DATABASE_USER=postgres DATABASE_PASSWORD=postgres REDIS_HOST=localhost REDIS_PORT=6379 KAFKA_BROKERS=localhost:9092 INTERNAL_SERVICE_TOKEN=test-internal-token LOG_LEVEL=warn"

start_service() {
  local name=$1
  local port=$2
  local dir=$3
  local extra_env=$4

  env $COMMON_ENV PORT=$port $extra_env \
    npx ts-node -r tsconfig-paths/register "$dir/src/main.ts" > "/tmp/system-test-$name.log" 2>&1 &
  PIDS+=($!)
  echo "  $name → :$port (PID $!)"
}

start_service "user-service" 9002 "apps/user-service" \
  "DATABASE_NAME=ai_video_interview_user_test"

start_service "interview-service" 9003 "apps/interview-service" \
  "DATABASE_NAME=ai_video_interview_interview_test"

start_service "ai-analysis-service" 9005 "apps/ai-analysis-service" \
  "DATABASE_NAME=ai_video_interview_analysis_test GROQ_API_KEY=$(grep GROQ_API_KEY apps/ai-analysis-service/.env 2>/dev/null | cut -d= -f2)"

start_service "billing-service" 9007 "apps/billing-service" \
  "DATABASE_NAME=ai_video_interview_billing_test STRIPE_SECRET_KEY=sk_test_fake STRIPE_WEBHOOK_SECRET=whsec_fake"

start_service "notification-service" 9006 "apps/notification-service" \
  "DATABASE_NAME=ai_video_interview_notification_test SMTP_HOST=localhost SMTP_PORT=1025"

# Start API Gateway last (depends on others)
start_service "api-gateway" 9010 "apps/api-gateway" \
  "USER_SERVICE_URL=http://localhost:9002 INTERVIEW_SERVICE_URL=http://localhost:9003 ANALYSIS_SERVICE_URL=http://localhost:9005 BILLING_SERVICE_URL=http://localhost:9007 NOTIFICATION_SERVICE_URL=http://localhost:9006 KEYCLOAK_URL=http://localhost:8090 KEYCLOAK_REALM=ai-video-interview KEYCLOAK_CLIENT_ID=test-client"

echo ""

# ─── Step 5: Wait for health checks ──────────────────────────
echo -e "${CYAN}[5/6] Waiting for services to be ready...${NC}"

wait_for_service() {
  local name=$1
  local url=$2
  local retries=20
  local delay=2

  for i in $(seq 1 $retries); do
    if curl -sf "$url" > /dev/null 2>&1; then
      echo "  $name ready ✓"
      return 0
    fi
    sleep $delay
  done

  echo -e "  ${RED}$name FAILED to start${NC}"
  echo "  Logs: cat /tmp/system-test-$name.log"
  return 1
}

FAILED=0
wait_for_service "user-service" "http://localhost:9002/health" || FAILED=1
wait_for_service "interview-service" "http://localhost:9003/health" || FAILED=1
wait_for_service "billing-service" "http://localhost:9007/health" || FAILED=1
wait_for_service "notification-service" "http://localhost:9006/health" || FAILED=1
wait_for_service "ai-analysis-service" "http://localhost:9005/health" || FAILED=1
wait_for_service "api-gateway" "http://localhost:9010/health" || FAILED=1

if [ $FAILED -eq 1 ]; then
  echo -e "\n${RED}Some services failed to start. Check logs in /tmp/system-test-*.log${NC}"
  exit 1
fi
echo ""

# ─── Step 6: Run system tests ─────────────────────────────────
echo -e "${CYAN}[6/6] Running system tests...${NC}"
echo ""

npx jest --config test/system/jest.config.js --forceExit --runInBand
TEST_EXIT=$?

echo ""
if [ $TEST_EXIT -eq 0 ]; then
  echo -e "${GREEN}═══════════════════════════════════════════${NC}"
  echo -e "${GREEN}  System tests PASSED ✓${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════${NC}"
else
  echo -e "${RED}═══════════════════════════════════════════${NC}"
  echo -e "${RED}  System tests FAILED ✗${NC}"
  echo -e "${RED}═══════════════════════════════════════════${NC}"
  echo ""
  echo "Service logs:"
  for name in api-gateway user-service interview-service ai-analysis-service billing-service notification-service; do
    echo "  /tmp/system-test-$name.log"
  done
fi

exit $TEST_EXIT
