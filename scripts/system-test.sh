#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════
# System E2E Tests — Category Runner
#
# Usage:
#   ./scripts/system-test.sh                           # run ALL categories
#   ./scripts/system-test.sh --category 01-sync-http   # run one category
#   ./scripts/system-test.sh -c 01-sync-http -c 07-auth # run multiple
#   ./scripts/system-test.sh --list                    # list categories
#   ./scripts/system-test.sh --skip-start              # skip service startup
# ═══════════════════════════════════════════════════════════════

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

# All categories in execution order
ALL_CATEGORIES=(
  "01-sync-http"
  "02-interview-lifecycle"
  "03-kafka-async"
  "04-ai-analysis"
  "05-notifications"
  "06-billing-stripe"
  "07-auth"
  "08-resilience"
)

CATEGORY_DESCRIPTIONS=(
  "User CRUD, Billing plans, Correlation ID"
  "Template → Publish → Invite → Respond → Complete"
  "Kafka event propagation (user.created, invitation.completed)"
  "LLM scoring via Groq (sandbox + Kafka-triggered)"
  "Email delivery via Mailpit, preferences"
  "Subscription lifecycle, checkout, cancel/resume"
  "JWT auth, internal token, public endpoints"
  "Error handling, health checks, concurrency"
)

# Parse arguments
SELECTED_CATEGORIES=()
SKIP_START=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -c|--category)
      SELECTED_CATEGORIES+=("$2")
      shift 2
      ;;
    --skip-start)
      SKIP_START=true
      shift
      ;;
    --list)
      echo -e "${CYAN}Available test categories:${NC}"
      echo ""
      for i in "${!ALL_CATEGORIES[@]}"; do
        echo -e "  ${GREEN}${ALL_CATEGORIES[$i]}${NC}  ${DIM}— ${CATEGORY_DESCRIPTIONS[$i]}${NC}"
      done
      echo ""
      echo -e "${DIM}Usage: $0 --category 01-sync-http --category 07-auth${NC}"
      exit 0
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  -c, --category NAME   Run specific category (can be repeated)"
      echo "  --skip-start          Skip service startup (assume already running)"
      echo "  --list                List available categories"
      echo "  -h, --help            Show this help"
      echo ""
      echo "Examples:"
      echo "  $0                           # Run all categories"
      echo "  $0 -c 01-sync-http           # Run only sync HTTP tests"
      echo "  $0 -c 01-sync-http -c 07-auth # Run two categories"
      echo "  $0 --skip-start -c 03-kafka-async  # Skip startup, run Kafka tests"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Default to all categories
if [ ${#SELECTED_CATEGORIES[@]} -eq 0 ]; then
  SELECTED_CATEGORIES=("${ALL_CATEGORIES[@]}")
fi

# Validate categories
for cat in "${SELECTED_CATEGORIES[@]}"; do
  VALID=false
  for valid_cat in "${ALL_CATEGORIES[@]}"; do
    if [ "$cat" = "$valid_cat" ]; then
      VALID=true
      break
    fi
  done
  if [ "$VALID" = false ]; then
    echo -e "${RED}Unknown category: $cat${NC}"
    echo -e "Use ${CYAN}$0 --list${NC} to see available categories"
    exit 1
  fi
done

PIDS=()
CLEANUP_DONE=false

cleanup() {
  if [ "$CLEANUP_DONE" = true ]; then return; fi
  CLEANUP_DONE=true

  if [ "$SKIP_START" = false ] && [ ${#PIDS[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}Stopping test services...${NC}"
    for pid in "${PIDS[@]}"; do
      kill "$pid" 2>/dev/null || true
    done
    wait "${PIDS[@]}" 2>/dev/null || true
    echo -e "${GREEN}All test services stopped.${NC}"
  fi
}

trap cleanup EXIT INT TERM

# ─── Step 1: Check infrastructure ─────────────────────────────
echo -e "${CYAN}[1/6] Checking infrastructure...${NC}"

check_service() {
  curl -sf "$1" > /dev/null 2>&1
}

docker exec ai-interview-postgres pg_isready -U postgres > /dev/null 2>&1 || {
  echo -e "${RED}PostgreSQL not running. Start with: docker compose up -d postgres${NC}"
  exit 1
}
echo "  PostgreSQL ✓"

if ! docker exec ai-interview-redis redis-cli ping > /dev/null 2>&1; then
  echo -e "${RED}Redis not running. Start with: docker compose up -d redis${NC}"
  exit 1
fi
echo "  Redis ✓"

KAFKA_TOPICS=(
  "user-commands" "user-commands-dlq"
  "interview-commands" "interview-commands-dlq"
  "auth-events" "auth-events-dlq"
  "user-events" "user-events-dlq"
  "interview-events" "interview-events-dlq"
  "analysis-events" "analysis-events-dlq"
  "billing-events" "billing-events-dlq"
  "notification-events" "notification-events-dlq"
  "user-analytics" "user-analytics-dlq"
)

if docker exec ai-interview-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
  echo "  Kafka ✓"

  # 1. Delete ALL consumer groups (no active members — services not started yet)
  for group in $(docker exec ai-interview-kafka kafka-consumer-groups --bootstrap-server localhost:9092 --list 2>/dev/null || true); do
    docker exec ai-interview-kafka kafka-consumer-groups --bootstrap-server localhost:9092 --delete-group "$group" 2>/dev/null || true
  done
  echo "  Kafka consumer groups deleted ✓"

  # 2. Delete all topics (purge old messages)
  for t in "${KAFKA_TOPICS[@]}"; do
    docker exec ai-interview-kafka kafka-topics --bootstrap-server localhost:9092 --delete --topic "$t" 2>/dev/null || true
  done
  sleep 3

  # 3. Recreate topics fresh (empty, zero messages)
  for t in "${KAFKA_TOPICS[@]}"; do
    docker exec ai-interview-kafka kafka-topics --bootstrap-server localhost:9092 \
      --create --topic "$t" --partitions 3 --replication-factor 1 --if-not-exists 2>/dev/null || true
  done
  echo "  Kafka topics recreated (empty) ✓"
else
  echo -e "  ${YELLOW}Kafka not available (async tests may fail)${NC}"
fi

if curl -sf http://localhost:8025/api/v1/messages > /dev/null 2>&1; then
  echo "  Mailpit ✓"
else
  echo -e "  ${YELLOW}Mailpit not available (notification tests may fail)${NC}"
fi
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
  docker exec ai-interview-postgres psql -U postgres -c "CREATE DATABASE $db;" 2>/dev/null || true
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

# ─── Step 3.5: Clean dist caches (prevent ts-node stale code) ──
echo -e "${CYAN}Cleaning dist caches...${NC}"
for svc in user-service interview-service ai-analysis-service billing-service notification-service api-gateway; do
  rm -rf "apps/$svc/dist" 2>/dev/null
done
echo ""

# ─── Step 4: Start services on test ports ─────────────────────
if [ "$SKIP_START" = true ]; then
  echo -e "${YELLOW}[4/6] Skipping service startup (--skip-start)${NC}"
  echo ""
else
  echo -e "${CYAN}[4/6] Starting services on test ports...${NC}"

  # Kill any leftover processes from previous runs
  echo -e "  ${DIM}Cleaning up stale test processes...${NC}"
  for port in 9002 9003 9005 9006 9007 9010; do
    pid=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
      kill $pid 2>/dev/null || true
      echo -e "  ${YELLOW}Killed stale process on :$port (PID $pid)${NC}"
    fi
  done
  sleep 1

  start_service() {
    local name=$1
    local port=$2
    local dir=$3
    shift 3
    # Remaining args are KEY=VALUE env pairs

    (
      cd "$ROOT_DIR/$dir"

      export NODE_ENV=test
      export DATABASE_HOST=localhost DATABASE_PORT=5432
      export DATABASE_USER=postgres DATABASE_PASSWORD=postgres
      export REDIS_HOST=localhost REDIS_PORT=6379
      export KAFKA_BROKERS=localhost:9092
      export INTERNAL_SERVICE_TOKEN=test-internal-token
      export LOG_LEVEL=warn
      export PORT=$port

      for kv in "$@"; do
        export "$kv"
      done

      exec ./node_modules/.bin/ts-node -r tsconfig-paths/register src/main.ts
    ) > "/tmp/system-test-$name.log" 2>&1 &
    PIDS+=($!)
    echo "  $name → :$port (PID $!)"
  }

  start_service "user-service" 9002 "apps/user-service" \
    "DATABASE_NAME=ai_video_interview_user_test"

  start_service "interview-service" 9003 "apps/interview-service" \
    "DATABASE_NAME=ai_video_interview_interview_test"

  GROQ_KEY=$(grep GROQ_API_KEY apps/ai-analysis-service/.env 2>/dev/null | cut -d= -f2)
  start_service "ai-analysis-service" 9005 "apps/ai-analysis-service" \
    "DATABASE_NAME=ai_video_interview_analysis_test" \
    "GROQ_API_KEY=$GROQ_KEY"

  start_service "billing-service" 9007 "apps/billing-service" \
    "DATABASE_NAME=ai_video_interview_billing_test" \
    "STRIPE_SECRET_KEY=sk_test_fake" \
    "STRIPE_WEBHOOK_SECRET=whsec_fake"

  start_service "notification-service" 9006 "apps/notification-service" \
    "DATABASE_NAME=ai_video_interview_notification_test" \
    "SMTP_HOST=localhost" \
    "SMTP_PORT=1025"

  # Start API Gateway last (depends on others)
  start_service "api-gateway" 9010 "apps/api-gateway" \
    "USER_SERVICE_URL=http://localhost:9002" \
    "INTERVIEW_SERVICE_URL=http://localhost:9003" \
    "ANALYSIS_SERVICE_URL=http://localhost:9005" \
    "BILLING_SERVICE_URL=http://localhost:9007" \
    "NOTIFICATION_SERVICE_URL=http://localhost:9006" \
    "KEYCLOAK_URL=http://localhost:8090" \
    "KEYCLOAK_REALM=ai-video-interview" \
    "KEYCLOAK_CLIENT_ID=test-client"

  echo ""
fi

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

# ─── Step 6: Run system tests by category ─────────────────────
TOTAL_EXIT=0
RESULTS=()

echo -e "${CYAN}[6/6] Running system tests...${NC}"
echo -e "${DIM}Categories: ${SELECTED_CATEGORIES[*]}${NC}"
echo ""

for i in "${!SELECTED_CATEGORIES[@]}"; do
  cat="${SELECTED_CATEGORIES[$i]}"

  # Category header
  echo -e "${CYAN}━━━ Category: ${cat} ━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  # Run tests for this category (unbuffered output for real-time progress)
  npx --yes jest \
    --config test/system/jest.config.js \
    --testPathPattern="$cat" \
    --forceExit \
    --runInBand \
    --verbose

  CAT_EXIT=$?

  if [ $CAT_EXIT -eq 0 ]; then
    RESULTS+=("${GREEN}✓ ${cat}${NC}")
  else
    RESULTS+=("${RED}✗ ${cat}${NC}")
    TOTAL_EXIT=1
  fi

  echo ""
done

# ─── Summary ──────────────────────────────────────────────────
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${CYAN}  System Test Summary${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
for result in "${RESULTS[@]}"; do
  echo -e "  $result"
done
echo -e "${CYAN}═══════════════════════════════════════════${NC}"

if [ $TOTAL_EXIT -eq 0 ]; then
  echo -e "${GREEN}  All categories PASSED ✓${NC}"
else
  echo -e "${RED}  Some categories FAILED ✗${NC}"
  echo ""
  echo "Service logs:"
  for name in api-gateway user-service interview-service ai-analysis-service billing-service notification-service; do
    echo "  /tmp/system-test-$name.log"
  done
fi

exit $TOTAL_EXIT
