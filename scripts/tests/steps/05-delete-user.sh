#!/bin/bash

# =============================================================================
# STEP 5: Delete test user (hard delete)
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "STEP 5: DELETE USER"

if [ ! -f "${SCRIPT_TMP_DIR}/test-user-id.txt" ]; then
  log_error "User ID not found. Run 01-create-user.sh first"
  exit 1
fi

KEYCLOAK_ID=$(cat "${SCRIPT_TMP_DIR}/test-user-id.txt")
echo "Using Keycloak ID: $KEYCLOAK_ID"
separator

# Get admin operator token
log_info "Getting admin operator token..."
OPERATOR_TOKEN=$(get_operator_token) || exit 1
log_success "Operator token obtained"
separator

DELETE_RESPONSE=$(curl -s -X DELETE "${API_GATEWAY}/api/admin/users/${KEYCLOAK_ID}" \
  -H "Authorization: Bearer ${OPERATOR_TOKEN}")

echo "$DELETE_RESPONSE" | jq .

log_success "User deleted (HARD DELETE)"
echo ""
echo "Wait 3-5 seconds, then check:"
echo "1. API Gateway logs - user.deleted event"
echo "2. User Service logs - DeleteUserCommand"
echo "3. Run: ./00-check-db.sh"
echo ""
log_info "EXPECTED: User NOT FOUND in database (hard delete with CASCADE)"

# Clean up temp file
rm -f "${SCRIPT_TMP_DIR}/test-user-id.txt"
