#!/bin/bash

# =============================================================================
# STEP 4A: Suspend test user
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "STEP 4A: SUSPEND USER"

if [ ! -f "${SCRIPT_TMP_DIR}/test-user-id.txt" ]; then
  log_error "User ID not found. Run 01-create-user.sh first"
  exit 1
fi

KEYCLOAK_ID=$(cat "${SCRIPT_TMP_DIR}/test-user-id.txt")
echo "Using Keycloak ID: $KEYCLOAK_ID"
separator

# Get admin operator token (test user may get suspended and unable to login)
log_info "Getting admin operator token..."
OPERATOR_TOKEN=$(get_operator_token) || exit 1
log_success "Operator token obtained"
separator

SUSPEND_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/suspend" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${OPERATOR_TOKEN}" \
  -d '{"reason": "Test suspension from script"}')

echo "$SUSPEND_RESPONSE" | jq .

log_success "User suspended"
echo ""
echo "Wait 3-5 seconds, then check:"
echo "1. API Gateway logs - user.suspended event"
echo "2. User Service logs - SuspendUserCommand"
echo "3. Run: ./00-check-db.sh"
echo ""
log_info "EXPECTED: status='suspended'"
echo ""
echo "Run ./04-activate-user.sh to reactivate"
