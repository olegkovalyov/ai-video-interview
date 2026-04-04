#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════
# Test Pipeline — Sequential test runner for all services
#
# Usage:
#   ./scripts/test-pipeline.sh                # Run all stages
#   ./scripts/test-pipeline.sh --unit         # Unit tests only
#   ./scripts/test-pipeline.sh --integration  # Integration tests only
#   ./scripts/test-pipeline.sh --e2e          # E2E tests only
#   ./scripts/test-pipeline.sh --system       # System tests only
#   ./scripts/test-pipeline.sh --no-system    # Skip system tests
#
# Stops on first failure. Fix the error, then re-run.
# ═══════════════════════════════════════════════════════════════

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# Parse arguments
RUN_UNIT=false
RUN_INTEGRATION=false
RUN_E2E=false
RUN_SYSTEM=false
EXPLICIT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --unit) RUN_UNIT=true; EXPLICIT=true; shift ;;
    --integration) RUN_INTEGRATION=true; EXPLICIT=true; shift ;;
    --e2e) RUN_E2E=true; EXPLICIT=true; shift ;;
    --system) RUN_SYSTEM=true; EXPLICIT=true; shift ;;
    --no-system) RUN_UNIT=true; RUN_INTEGRATION=true; RUN_E2E=true; EXPLICIT=true; shift ;;
    -v|--verbose)
      shift ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --unit          Run only unit tests"
      echo "  --integration   Run only integration tests"
      echo "  --e2e           Run only E2E tests"
      echo "  --system        Run only system tests"
      echo "  --no-system     Run unit + integration + e2e (skip system)"
      echo "  -v, --verbose   Show full test output (no noise suppression)"
      echo "  -h, --help      Show this help"
      echo ""
      echo "Default: quiet mode — shows only pass/fail + test counts"
      echo "Use --verbose (-v) to see full Jest output for debugging"
      exit 0
      ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
  esac
done

# Default: run everything
if [ "$EXPLICIT" = false ]; then
  RUN_UNIT=true
  RUN_INTEGRATION=true
  RUN_E2E=true
  RUN_SYSTEM=true
fi

PASSED=()
TOTAL_TESTS=0
START_TIME=$(date +%s)

VERBOSE=false
for arg in "$@"; do
  [[ "$arg" == "--verbose" || "$arg" == "-v" ]] && VERBOSE=true
done

run_step() {
  local label=$1
  local cmd=$2
  local logfile="/tmp/test-pipeline-$$.log"

  echo -en "${CYAN}━━━ ${label} ━━━${NC} "

  if [ "$VERBOSE" = true ]; then
    # Verbose: show full output
    echo ""
    if eval "$cmd"; then
      PASSED+=("${GREEN}✓ ${label}${NC}")
      echo -e "${GREEN}✓ ${label} passed${NC}"
    else
      echo -e "\n${RED}✗ ${label} FAILED${NC}"
      echo -e "${RED}Pipeline stopped. Fix the error above and re-run.${NC}"
      print_summary
      exit 1
    fi
  else
    # Quiet: capture output, show only summary line
    if eval "$cmd" > "$logfile" 2>&1; then
      # Extract test count from Jest output
      local summary
      summary=$(grep -E "Tests:|Test Suites:" "$logfile" | tail -2 | tr '\n' ' ')
      PASSED+=("${GREEN}✓ ${label}${NC}")
      echo -e "${GREEN}✓${NC} ${DIM}${summary}${NC}"
    else
      echo -e "${RED}✗ FAILED${NC}"
      echo ""
      # Show last 30 lines of output for debugging
      tail -30 "$logfile"
      echo -e "\n${RED}Pipeline stopped. Full log: ${logfile}${NC}"
      print_summary
      exit 1
    fi
    rm -f "$logfile"
  fi
}

print_summary() {
  local END_TIME=$(date +%s)
  local ELAPSED=$((END_TIME - START_TIME))

  echo -e "\n${CYAN}═══════════════════════════════════════════${NC}"
  echo -e "${CYAN}  Test Pipeline Summary  (${ELAPSED}s)${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════${NC}"
  for result in "${PASSED[@]}"; do
    echo -e "  $result"
  done
  echo -e "${CYAN}═══════════════════════════════════════════${NC}"
}

# Services with unit tests
UNIT_SERVICES=(
  "user-service"
  "interview-service"
  "ai-analysis-service"
  "billing-service"
  "notification-service"
  "api-gateway"
)

# Services with integration tests
INTEGRATION_SERVICES=(
  "user-service"
  "interview-service"
  "ai-analysis-service"
  "billing-service"
  "notification-service"
)

# Services with e2e tests
E2E_SERVICES=(
  "user-service"
  "interview-service"
  "ai-analysis-service"
  "billing-service"
  "api-gateway"
)

# ─── Stage 1: Unit Tests ──────────────────────────────
if [ "$RUN_UNIT" = true ]; then
  echo -e "\n${BOLD}${CYAN}╔═══════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║       STAGE 1: UNIT TESTS             ║${NC}"
  echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════╝${NC}"

  for svc in "${UNIT_SERVICES[@]}"; do
    run_step "unit: ${svc}" "npm run test --workspace=apps/${svc}"
  done
fi

# ─── Stage 2: Integration Tests ───────────────────────
if [ "$RUN_INTEGRATION" = true ]; then
  echo -e "\n${BOLD}${CYAN}╔═══════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║    STAGE 2: INTEGRATION TESTS         ║${NC}"
  echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════╝${NC}"

  for svc in "${INTEGRATION_SERVICES[@]}"; do
    run_step "integration: ${svc}" "npm run test:integration --workspace=apps/${svc}"
  done
fi

# ─── Stage 3: E2E Tests ───────────────────────────────
if [ "$RUN_E2E" = true ]; then
  echo -e "\n${BOLD}${CYAN}╔═══════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║         STAGE 3: E2E TESTS            ║${NC}"
  echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════╝${NC}"

  for svc in "${E2E_SERVICES[@]}"; do
    run_step "e2e: ${svc}" "npm run test:e2e --workspace=apps/${svc}"
  done
fi

# ─── Stage 4: System Tests ────────────────────────────
if [ "$RUN_SYSTEM" = true ]; then
  echo -e "\n${BOLD}${CYAN}╔═══════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║      STAGE 4: SYSTEM E2E TESTS        ║${NC}"
  echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════╝${NC}"

  run_step "system: all categories" "./scripts/system-test.sh"
fi

# ─── Done ──────────────────────────────────────────────
print_summary
echo -e "${GREEN}  All stages PASSED ✓${NC}"
