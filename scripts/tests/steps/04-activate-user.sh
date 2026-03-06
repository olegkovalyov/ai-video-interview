#!/bin/bash

# =============================================================================
# STEP 4B: Activate (reactivate) test user
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "STEP 4B: ACTIVATE USER"

if [ ! -f "${SCRIPT_TMP_DIR}/test-user-id.txt" ]; then
  log_error "User ID not found. Run 01-create-user.sh first"
  exit 1
fi

KEYCLOAK_ID=$(cat "${SCRIPT_TMP_DIR}/test-user-id.txt")
echo "Using Keycloak ID: $KEYCLOAK_ID"
separator

# Get admin operator token (test user may be suspended and unable to login)
log_info "Getting admin operator token..."
OPERATOR_TOKEN=$(get_operator_token) || exit 1
log_success "Operator token obtained"
separator

ACTIVATE_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}/activate" \
  -H "Authorization: Bearer ${OPERATOR_TOKEN}")

echo "$ACTIVATE_RESPONSE" | jq .

log_success "User activated"
echo ""
echo "Wait 3-5 seconds, then check:"
echo "1. API Gateway logs - user.activated event"
echo "2. User Service logs - ActivateUserCommand"
echo "3. Run: ./00-check-db.sh"
echo ""
log_info "EXPECTED: status='active'"
